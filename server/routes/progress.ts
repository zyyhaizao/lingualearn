import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT p.progress_id, p.language_id, p.course_id, p.lesson_id,
              p.completion_status, p.score, p.time_spent_minutes, p.attempts,
              p.last_accessed_at, p.completed_at,
              l.lesson_name, c.course_name, c.level, lg.language_name
       FROM lingualearn_user_progress p
       JOIN lingualearn_lessons l ON p.lesson_id = l.lesson_id
       JOIN lingualearn_courses c ON p.course_id = c.course_id
       JOIN lingualearn_languages lg ON p.language_id = lg.language_id
       WHERE p.user_id = $1
       ORDER BY p.last_accessed_at DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

router.get('/summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const progressResult = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE completion_status = 'completed') as completed_lessons,
              COUNT(*) as total_lessons,
              AVG(score) FILTER (WHERE score > 0) as average_score,
              SUM(time_spent_minutes) as total_time_spent
       FROM lingualearn_user_progress
       WHERE user_id = $1`,
      [req.userId]
    );

    const streakResult = await pool.query(
      `SELECT current_streak, total_study_days
       FROM lingualearn_users
       WHERE user_id = $1`,
      [req.userId]
    );

    const pointsResult = await pool.query(
      `SELECT total_points, level, experience_points
       FROM lingualearn_users
       WHERE user_id = $1`,
      [req.userId]
    );

    const languagesResult = await pool.query(
      `SELECT COUNT(DISTINCT language_id) as languages_learning
       FROM lingualearn_user_progress
       WHERE user_id = $1`,
      [req.userId]
    );

    res.json({
      lessonsProgress: progressResult.rows[0],
      streak: streakResult.rows[0],
      points: pointsResult.rows[0],
      languagesCount: languagesResult.rows[0]
    });
  } catch (error) {
    console.error('Get progress summary error:', error);
    res.status(500).json({ error: 'Failed to fetch progress summary' });
  }
});

router.get('/daily', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const result = await pool.query(
      `SELECT streak_date, study_time_minutes, lessons_completed, xp_earned
       FROM lingualearn_daily_streak
       WHERE user_id = $1 AND streak_date >= CURRENT_DATE - INTERVAL '${parseInt(days as string)} days'
       ORDER BY streak_date DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get daily progress error:', error);
    res.status(500).json({ error: 'Failed to fetch daily progress' });
  }
});

router.post('/lesson', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId, courseId, languageId, completionStatus, score, timeSpentMinutes } = req.body;

    const existingProgress = await pool.query(
      `SELECT progress_id, attempts FROM lingualearn_user_progress
       WHERE user_id = $1 AND lesson_id = $2`,
      [req.userId, lessonId]
    );

    let result;
    if (existingProgress.rows.length > 0) {
      const newAttempts = existingProgress.rows[0].attempts + 1;
      result = await pool.query(
        `UPDATE lingualearn_user_progress
         SET completion_status = COALESCE($1, completion_status),
             score = GREATEST(score, $2),
             time_spent_minutes = time_spent_minutes + $3,
             attempts = $4,
             last_accessed_at = CURRENT_TIMESTAMP,
             completed_at = CASE WHEN $1 = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END
         WHERE user_id = $5 AND lesson_id = $6
         RETURNING *`,
        [completionStatus, score, timeSpentMinutes, newAttempts, req.userId, lessonId]
      );
    } else {
      result = await pool.query(
        `INSERT INTO lingualearn_user_progress
         (user_id, language_id, course_id, lesson_id, completion_status, score, time_spent_minutes, attempts, last_accessed_at, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1, CURRENT_TIMESTAMP, 
                 CASE WHEN $5 = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END)
         RETURNING *`,
        [req.userId, languageId, courseId, lessonId, completionStatus || 'in_progress', score || 0, timeSpentMinutes || 0]
      );
    }

    if (completionStatus === 'completed') {
      const lessonResult = await pool.query(
        `SELECT xp_reward FROM lingualearn_lessons WHERE lesson_id = $1`,
        [lessonId]
      );
      const xpEarned = lessonResult.rows[0]?.xp_reward || 10;

      await pool.query(
        `UPDATE lingualearn_users
         SET experience_points = experience_points + $1,
             total_points = total_points + $1,
             level = CASE 
               WHEN experience_points >= 1000 THEN 2
               WHEN experience_points >= 2500 THEN 3
               WHEN experience_points >= 5000 THEN 4
               WHEN experience_points >= 10000 THEN 5
               ELSE 1
             END
         WHERE user_id = $2`,
        [xpEarned, req.userId]
      );

      await pool.query(
        `INSERT INTO lingualearn_daily_streak (user_id, streak_date, lessons_completed, xp_earned)
         VALUES ($1, CURRENT_DATE, 1, $2)
         ON CONFLICT (user_id, streak_date)
         DO UPDATE SET 
           lessons_completed = lingualearn_daily_streak.lessons_completed + 1,
           xp_earned = lingualearn_daily_streak.xp_earned + $2`,
        [req.userId, xpEarned]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update lesson progress error:', error);
    res.status(500).json({ error: 'Failed to update lesson progress' });
  }
});

export default router;
