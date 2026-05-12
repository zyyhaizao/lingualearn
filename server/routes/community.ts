import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { languageId, category, sort = 'recent' } = req.query;
    let query = `
      SELECT p.post_id, p.post_title, p.post_content, p.category, p.likes_count,
             p.comments_count, p.is_pinned, p.is_resolved, p.created_at,
             u.username, u.avatar_url, u.level, lg.language_name
      FROM lingualearn_community_posts p
      JOIN lingualearn_users u ON p.user_id = u.user_id
      JOIN lingualearn_languages lg ON p.language_id = lg.language_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (languageId) {
      params.push(parseInt(languageId as string));
      query += ` AND p.language_id = $${params.length}`;
    }
    if (category) {
      params.push(category);
      query += ` AND p.category = $${params.length}`;
    }

    if (sort === 'popular') {
      query += ' ORDER BY p.likes_count DESC, p.created_at DESC';
    } else if (sort === 'resolved') {
      query += ' ORDER BY p.is_resolved DESC, p.created_at DESC';
    } else {
      query += ' ORDER BY p.is_pinned DESC, p.created_at DESC';
    }

    query += ' LIMIT 50';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT p.post_id, p.post_title, p.post_content, p.category, p.likes_count,
              p.comments_count, p.is_pinned, p.is_resolved, p.created_at,
              u.user_id, u.username, u.avatar_url, u.level, lg.language_name
       FROM lingualearn_community_posts p
       JOIN lingualearn_users u ON p.user_id = u.user_id
       JOIN lingualearn_languages lg ON p.language_id = lg.language_id
       WHERE p.post_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { postTitle, postContent, languageId, category } = req.body;

    const result = await pool.query(
      `INSERT INTO lingualearn_community_posts
       (user_id, post_title, post_content, language_id, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.userId, postTitle, postContent, languageId, category || 'general']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

router.put('/:id/like', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE lingualearn_community_posts
       SET likes_count = likes_count + 1
       WHERE post_id = $1
       RETURNING likes_count`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({ likesCount: result.rows[0].likes_count });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

router.put('/:id/resolve', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE lingualearn_community_posts
       SET is_resolved = true, updated_at = CURRENT_TIMESTAMP
       WHERE post_id = $1 AND user_id = $2
       RETURNING is_resolved`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }

    res.json({ isResolved: result.rows[0].is_resolved });
  } catch (error) {
    console.error('Resolve post error:', error);
    res.status(500).json({ error: 'Failed to resolve post' });
  }
});

export default router;
