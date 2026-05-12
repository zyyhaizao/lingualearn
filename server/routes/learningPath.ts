import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT lp.path_id, lp.path_name, lp.path_description, lp.recommended_courses,
              lp.estimated_duration_days, lp.difficulty_presets, lp.is_active,
              l.language_name, l.flag_emoji,
              COALESCE(
                (SELECT COUNT(*) FROM lingualearn_user_progress 
                 WHERE user_id = $1 AND course_id = ANY(lp.recommended_courses) 
                 AND completion_status = 'completed'), 0
              ) as courses_completed
       FROM lingualearn_learning_paths lp
       JOIN lingualearn_languages l ON lp.language_id = l.language_id
       WHERE lp.user_id = $1 AND lp.is_active = true`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get learning paths error:', error);
    res.status(500).json({ error: 'Failed to fetch learning paths' });
  }
});

router.post('/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { languageId, currentLevel, goal, dailyTime } = req.body;

    let targetLevel = currentLevel;
    if (goal === 'conversational') targetLevel = 'intermediate';
    else if (goal === 'fluent') targetLevel = 'advanced';
    else if (goal === 'business') targetLevel = 'advanced';

    const courses = await pool.query(
      `SELECT course_id, course_name, level, total_lessons, estimated_hours
       FROM lingualearn_courses
       WHERE language_id = $1 AND level <= $2
       ORDER BY 
         CASE level 
           WHEN 'beginner' THEN 1 
           WHEN 'intermediate' THEN 2 
           WHEN 'advanced' THEN 3 
         END,
         total_lessons ASC
       LIMIT 5`,
      [languageId, targetLevel]
    );

    const recommendedCourseIds = courses.rows.map(c => c.course_id);
    const totalHours = courses.rows.reduce((sum, c) => sum + c.estimated_hours, 0);
    const estimatedDays = Math.ceil(totalHours / (dailyTime || 1));

    const result = await pool.query(
      `INSERT INTO lingualearn_learning_paths
       (user_id, language_id, path_name, path_description, recommended_courses, estimated_duration_days, difficulty_presets)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.userId,
        languageId,
        `${goal || 'custom'}学习路径`,
        `为你定制的${goal || 'custom'}级别学习计划，建议每天学习${dailyTime || 1}小时`,
        recommendedCourseIds,
        estimatedDays,
        { currentLevel, targetLevel, goal, dailyTime }
      ]
    );

    res.json({
      ...result.rows[0],
      courses: courses.rows
    });
  } catch (error) {
    console.error('Generate learning path error:', error);
    res.status(500).json({ error: 'Failed to generate learning path' });
  }
});

router.get('/recommendations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userStats = await pool.query(
      `SELECT preferred_languages, total_points, level
       FROM lingualearn_users
       WHERE user_id = $1`,
      [req.userId]
    );

    const completedCourses = await pool.query(
      `SELECT DISTINCT course_id, language_id
       FROM lingualearn_user_progress
       WHERE user_id = $1 AND completion_status = 'completed'`,
      [req.userId]
    );

    const inProgressCourses = await pool.query(
      `SELECT course_id, language_id, COUNT(*) as lessons_completed
       FROM lingualearn_user_progress
       WHERE user_id = $1 AND completion_status = 'in_progress'
       GROUP BY course_id, language_id`,
      [req.userId]
    );

    const recommendations = [];
    const languages = userStats.rows[0]?.preferred_languages || ['en'];

    for (const lang of languages) {
      const langResult = await pool.query(
        `SELECT language_id FROM lingualearn_languages WHERE language_code = $1`,
        [lang]
      );

      if (langResult.rows.length > 0) {
        const languageId = langResult.rows[0].language_id;

        const nextCourse = await pool.query(
          `SELECT c.course_id, c.course_name, c.level, c.total_lessons, c.estimated_hours,
                  c.description, l.language_name, l.flag_emoji
           FROM lingualearn_courses c
           JOIN lingualearn_languages l ON c.language_id = l.language_id
           WHERE c.language_id = $1 
             AND c.course_id NOT IN (SELECT course_id FROM UNNEST($2::int[]) AS cc(course_id))
             AND c.level = 'beginner'
           ORDER BY c.course_id
           LIMIT 1`,
          [languageId, completedCourses.rows.map(c => c.course_id)]
        );

        if (nextCourse.rows.length > 0) {
          recommendations.push({
            type: 'next_course',
            reason: '继续你的学习之旅',
            course: nextCourse.rows[0]
          });
        }
      }
    }

    const popularCourse = await pool.query(
      `SELECT c.course_id, c.course_name, c.level, c.total_lessons,
              l.language_name, l.flag_emoji, c.estimated_hours,
              (SELECT COUNT(*) FROM lingualearn_user_progress WHERE course_id = c.course_id) as learner_count
       FROM lingualearn_courses c
       JOIN lingualearn_languages l ON c.language_id = l.language_id
       ORDER BY learner_count DESC
       LIMIT 1`
    );

    if (popularCourse.rows.length > 0) {
      recommendations.push({
        type: 'popular',
        reason: '热门课程推荐',
        course: popularCourse.rows[0]
      });
    }

    res.json(recommendations);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;
