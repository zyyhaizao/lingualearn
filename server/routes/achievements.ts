import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    let query = `
      SELECT achievement_id, achievement_name, description, category,
             icon_url, points_reward, criteria, is_hidden
      FROM lingualearn_achievements
      WHERE is_hidden = false
    `;
    const params: any[] = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    query += ' ORDER BY points_reward DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

router.get('/user', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT a.achievement_id, a.achievement_name, a.description, a.category,
              a.icon_url, a.points_reward, ua.earned_at, ua.progress_value
       FROM lingualearn_achievements a
       LEFT JOIN lingualearn_user_achievements ua ON a.achievement_id = ua.achievement_id AND ua.user_id = $1
       WHERE a.is_hidden = false
       ORDER BY a.points_reward DESC`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({ error: 'Failed to fetch user achievements' });
  }
});

router.post('/check', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userResult = await pool.query(
      `SELECT total_points, current_streak, total_study_days,
              (SELECT COUNT(*) FROM lingualearn_user_progress WHERE user_id = $1 AND completion_status = 'completed') as lessons_completed,
              (SELECT COUNT(DISTINCT course_id) FROM lingualearn_user_progress WHERE user_id = $1 AND completion_status = 'completed') as courses_completed,
              (SELECT COUNT(DISTINCT language_id) FROM lingualearn_user_progress WHERE user_id = $1) as languages_learning
       FROM lingualearn_users
       WHERE user_id = $1`,
      [req.userId]
    );

    const userStats = userResult.rows[0];
    const achievements = await pool.query(
      `SELECT achievement_id, achievement_name, criteria, points_reward
       FROM lingualearn_achievements
       WHERE achievement_id NOT IN (
         SELECT achievement_id FROM lingualearn_user_achievements WHERE user_id = $1
       )`,
      [req.userId]
    );

    const newlyEarned = [];
    for (const achievement of achievements.rows) {
      const criteria = achievement.criteria;
      let earned = false;

      switch (criteria.type) {
        case 'total_points':
          earned = userStats.total_points >= criteria.count;
          break;
        case 'streak_days':
          earned = userStats.current_streak >= criteria.count;
          break;
        case 'lessons_completed':
          earned = parseInt(userStats.lessons_completed) >= criteria.count;
          break;
        case 'courses_completed':
          earned = parseInt(userStats.courses_completed) >= criteria.count;
          break;
        case 'languages_started':
          earned = parseInt(userStats.languages_learning) >= criteria.count;
          break;
      }

      if (earned) {
        await pool.query(
          `INSERT INTO lingualearn_user_achievements (user_id, achievement_id)
           VALUES ($1, $2)`,
          [req.userId, achievement.achievement_id]
        );
        await pool.query(
          `UPDATE lingualearn_users SET total_points = total_points + $1 WHERE user_id = $2`,
          [achievement.points_reward, req.userId]
        );
        newlyEarned.push(achievement);
      }
    }

    res.json({ newlyEarned, totalEarned: newlyEarned.length });
  } catch (error) {
    console.error('Check achievements error:', error);
    res.status(500).json({ error: 'Failed to check achievements' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { achievementName, description, category, iconUrl, pointsReward, criteria, isHidden } = req.body;

    const result = await pool.query(
      `INSERT INTO lingualearn_achievements
       (achievement_name, description, category, icon_url, points_reward, criteria, is_hidden)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [achievementName, description, category, iconUrl, pointsReward || 0, criteria, isHidden || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create achievement error:', error);
    res.status(500).json({ error: 'Failed to create achievement' });
  }
});

export default router;
