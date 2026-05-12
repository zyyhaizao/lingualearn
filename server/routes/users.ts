import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const { limit = 20 } = req.query;
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.avatar_url, u.level, u.total_points,
              u.current_streak, u.total_study_days,
              (SELECT COUNT(*) FROM lingualearn_user_achievements WHERE user_id = u.user_id) as achievements_count
       FROM lingualearn_users u
       WHERE u.is_active = true
       ORDER BY u.total_points DESC
       LIMIT $1`,
      [parseInt(limit as string)]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userStats = await pool.query(
      `SELECT total_points, level, experience_points, current_streak,
              total_study_days, (SELECT COUNT(*) FROM lingualearn_user_achievements WHERE user_id = $1) as achievements_count
       FROM lingualearn_users
       WHERE user_id = $1`,
      [req.userId]
    );

    const progressStats = await pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE completion_status = 'completed') as completed_lessons,
         COUNT(*) FILTER (WHERE completion_status = 'in_progress') as in_progress_lessons,
         AVG(score) FILTER (WHERE score > 0) as average_score,
         SUM(time_spent_minutes) as total_time_spent,
         COUNT(DISTINCT language_id) as languages_learning,
         COUNT(DISTINCT course_id) as courses_started
       FROM lingualearn_user_progress
       WHERE user_id = $1`,
      [req.userId]
    );

    res.json({
      user: userStats.rows[0],
      progress: progressStats.rows[0]
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

router.get('/rank', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userPoints = await pool.query(
      `SELECT total_points FROM lingualearn_users WHERE user_id = $1`,
      [req.userId]
    );

    const rank = await pool.query(
      `SELECT COUNT(*) + 1 as rank
       FROM lingualearn_users
       WHERE total_points > $1 AND is_active = true`,
      [userPoints.rows[0].total_points]
    );

    const totalUsers = await pool.query(
      `SELECT COUNT(*) as total FROM lingualearn_users WHERE is_active = true`
    );

    res.json({
      rank: rank.rows[0].rank,
      totalUsers: totalUsers.rows[0].total,
      percentile: Math.round((1 - parseInt(rank.rows[0].rank) / parseInt(totalUsers.rows[0].total)) * 100)
    });
  } catch (error) {
    console.error('Get user rank error:', error);
    res.status(500).json({ error: 'Failed to fetch user rank' });
  }
});

export default router;
