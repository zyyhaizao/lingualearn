import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth';
import languageRoutes from './routes/languages';
import courseRoutes from './routes/courses';
import lessonRoutes from './routes/lessons';
import progressRoutes from './routes/progress';
import vocabularyRoutes from './routes/vocabulary';
import grammarRoutes from './routes/grammar';
import exerciseRoutes from './routes/exercises';
import achievementRoutes from './routes/achievements';
import communityRoutes from './routes/community';
import learningPathRoutes from './routes/learningPath';
import userRoutes from './routes/users';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/languages', languageRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/grammar', grammarRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/learning-path', learningPathRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const distPath = path.join(__dirname, '../dist');
try {
  app.use(express.static(distPath));
  app.get('/{.*}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} catch (err) {
  console.log('Frontend dist folder not found, serving API only');
  app.get('/{.*}', (req, res) => {
    res.send('LinguaLearn API is running! Frontend not available.');
  });
}

const server = app.listen(PORT, () => {
  console.log(`\n=================================`);
  console.log(`LinguaLearn API Server started`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port: ${PORT}`);
  console.log(`=================================\n`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});
