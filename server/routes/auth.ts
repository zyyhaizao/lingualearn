import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password, nativeLanguage, preferredLanguages } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO lingualearn_users 
       (username, email, password_hash, native_language, preferred_languages) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING user_id, username, email, native_language, total_points, level, created_at`,
      [username, email, hashedPassword, nativeLanguage || 'zh-CN', preferredLanguages || ['en']]
    );

    const user = result.rows[0];
    const token = generateToken(user.user_id);

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query(
      `UPDATE lingualearn_users 
       SET last_login_at = CURRENT_TIMESTAMP 
       WHERE email = $1 
       RETURNING user_id, username, email, password_hash, native_language, 
                 total_points, level, experience_points, avatar_url, 
                 total_study_days, current_streak, preferred_languages`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.user_id);

    delete user.password_hash;
    res.json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT user_id, username, email, native_language, avatar_url, 
              total_points, level, experience_points, total_study_days, 
              current_streak, preferred_languages, created_at, last_login_at
       FROM lingualearn_users 
       WHERE user_id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { username, avatarUrl, nativeLanguage, preferredLanguages, learningGoals } = req.body;

    const result = await pool.query(
      `UPDATE lingualearn_users 
       SET username = COALESCE($1, username),
           avatar_url = COALESCE($2, avatar_url),
           native_language = COALESCE($3, native_language),
           preferred_languages = COALESCE($4, preferred_languages),
           learning_goals = COALESCE($5, learning_goals),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $6
       RETURNING user_id, username, email, native_language, avatar_url, 
                 total_points, level, experience_points`,
      [username, avatarUrl, nativeLanguage, preferredLanguages, learningGoals, req.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
