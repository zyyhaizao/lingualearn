import { Router, Request, Response } from 'express';
import pool from '../config/database';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT language_id, language_code, language_name, native_name, 
              flag_emoji, difficulty_level, description, icon_url, total_learners
       FROM lingualearn_languages
       ORDER BY total_learners DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get languages error:', error);
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT language_id, language_code, language_name, native_name, 
              flag_emoji, difficulty_level, description, icon_url, total_learners
       FROM lingualearn_languages
       WHERE language_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Language not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get language error:', error);
    res.status(500).json({ error: 'Failed to fetch language' });
  }
});

router.get('/:id/courses', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT course_id, course_name, course_code, level, description,
              total_lessons, estimated_hours, thumbnail_url, skills_covered,
              is_premium, is_published
       FROM lingualearn_courses
       WHERE language_id = $1 AND is_published = true
       ORDER BY level, course_id`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

export default router;
