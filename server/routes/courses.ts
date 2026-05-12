import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { language, level } = req.query;
    let query = `
      SELECT c.course_id, c.course_name, c.course_code, c.level, c.description,
             c.total_lessons, c.estimated_hours, c.thumbnail_url, c.skills_covered,
             c.is_premium, c.is_published, l.language_name, l.flag_emoji
      FROM lingualearn_courses c
      JOIN lingualearn_languages l ON c.language_id = l.language_id
      WHERE c.is_published = true
    `;
    
    const params: any[] = [];
    if (language) {
      params.push(language);
      query += ` AND c.language_id = $${params.length}`;
    }
    if (level) {
      params.push(level);
      query += ` AND c.level = $${params.length}`;
    }
    
    query += ' ORDER BY c.level, c.course_id';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT c.course_id, c.course_name, c.course_code, c.level, c.description,
              c.total_lessons, c.estimated_hours, c.thumbnail_url, c.skills_covered,
              c.prerequisites, c.is_premium, c.is_published, l.language_name, 
              l.flag_emoji, l.language_id
       FROM lingualearn_courses c
       JOIN lingualearn_languages l ON c.language_id = l.language_id
       WHERE c.course_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

router.get('/:id/lessons', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT lesson_id, lesson_name, lesson_order, lesson_type, duration_minutes,
              difficulty_score, xp_reward, is_locked
       FROM lingualearn_lessons
       WHERE course_id = $1
       ORDER BY lesson_order`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get lessons error:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { languageId, courseName, courseCode, level, description, totalLessons, estimatedHours, skillsCovered, prerequisites, isPremium } = req.body;

    const result = await pool.query(
      `INSERT INTO lingualearn_courses 
       (language_id, course_name, course_code, level, description, total_lessons, 
        estimated_hours, skills_covered, prerequisites, is_premium)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [languageId, courseName, courseCode, level, description, totalLessons, estimatedHours, skillsCovered, prerequisites, isPremium]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Course code already exists' });
    }
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

export default router;
