<template>
  <div class="progress-page">
    <div class="page-header">
      <h1>学习报告</h1>
      <p>追踪你的学习进度和成果</p>
    </div>

    <div class="stats-grid" v-if="summary">
      <div class="stat-card total-points">
        <div class="stat-icon">⭐</div>
        <div class="stat-value">{{ summary.points.total_points || 0 }}</div>
        <div class="stat-label">总积分</div>
      </div>
      <div class="stat-card level">
        <div class="stat-icon">🏆</div>
        <div class="stat-value">Lv.{{ summary.points.level || 1 }}</div>
        <div class="stat-label">当前等级</div>
      </div>
      <div class="stat-card streak">
        <div class="stat-icon">🔥</div>
        <div class="stat-value">{{ summary.streak.current_streak || 0 }}</div>
        <div class="stat-label">连续学习天数</div>
      </div>
      <div class="stat-card lessons">
        <div class="stat-icon">📚</div>
        <div class="stat-value">{{ summary.lessonsProgress.completed_lessons || 0 }}</div>
        <div class="stat-label">已完成课时</div>
      </div>
    </div>

    <div class="progress-section">
      <h2>学习概览</h2>
      <div class="progress-details">
        <div class="detail-card">
          <h3>课程完成率</h3>
          <div class="circular-progress">
            <svg viewBox="0 0 100 100">
              <circle class="bg" cx="50" cy="50" r="45" />
              <circle
                class="progress"
                cx="50"
                cy="50"
                r="45"
                :style="{ strokeDashoffset: getCircleOffset(summary?.lessonsProgress?.completed_lessons, summary?.lessonsProgress?.total_lessons) }"
              />
            </svg>
            <div class="progress-text">
              {{ getCompletionRate() }}%
            </div>
          </div>
          <p>{{ summary?.lessonsProgress?.completed_lessons || 0 }} / {{ summary?.lessonsProgress?.total_lessons || 0 }}</p>
        </div>

        <div class="detail-card">
          <h3>学习时间</h3>
          <div class="stat-display">
            <span class="big-number">{{ formatTime(summary?.lessonsProgress?.total_time_spent || 0) }}</span>
          </div>
          <p>累计学习时长</p>
        </div>

        <div class="detail-card">
          <h3>学习语言</h3>
          <div class="stat-display">
            <span class="big-number">{{ summary?.languagesCount?.languages_learning || 0 }}</span>
            <span class="unit">种语言</span>
          </div>
          <p>正在学习</p>
        </div>
      </div>
    </div>

    <div class="recent-progress" v-if="progress.length > 0">
      <h2>最近学习记录</h2>
      <div class="progress-list">
        <div v-for="item in progress.slice(0, 10)" :key="item.progress_id" class="progress-item">
          <div class="item-info">
            <h4>{{ item.lesson_name }}</h4>
            <p>{{ item.course_name }} - {{ item.language_name }}</p>
          </div>
          <div class="item-stats">
            <span v-if="item.score > 0" class="score">得分: {{ item.score }}</span>
            <span v-if="item.time_spent_minutes > 0" class="time">{{ item.time_spent_minutes }}分钟</span>
            <span :class="['status', item.completion_status]">
              {{ item.completion_status === 'completed' ? '✓ 已完成' : '进行中' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="loading" v-if="loading">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useLearningStore } from '../stores/learning';

const learningStore = useLearningStore();

const loading = ref(false);
const progress = ref<any[]>([]);
const summary = ref<any>(null);

function getCircleOffset(completed: number = 0, total: number = 1) {
  const circumference = 2 * Math.PI * 45;
  const rate = total > 0 ? completed / total : 0;
  return circumference * (1 - rate);
}

function getCompletionRate() {
  if (!summary.value?.lessonsProgress) return 0;
  const { completed_lessons, total_lessons } = summary.value.lessonsProgress;
  if (total_lessons === 0) return 0;
  return Math.round((completed_lessons / total_lessons) * 100);
}

function formatTime(minutes: number) {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时`;
  const days = Math.floor(hours / 24);
  return `${days}天${hours % 24}小时`;
}

onMounted(async () => {
  loading.value = true;
  try {
    await learningStore.fetchProgress();
    progress.value = learningStore.progress;
    summary.value = learningStore.progressSummary;
  } catch (err) {
    console.error('Failed to load progress:', err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.progress-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-header h1 {
  font-size: 2rem;
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #666;
  font-size: 1.1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  padding: 2rem;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 1rem;
}

.progress-section {
  margin-bottom: 3rem;
}

.progress-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.progress-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.detail-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.detail-card h3 {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.circular-progress {
  position: relative;
  width: 150px;
  height: 150px;
  margin: 0 auto 1rem;
}

.circular-progress svg {
  transform: rotate(-90deg);
}

.circular-progress circle {
  fill: none;
  stroke-width: 10;
}

.circular-progress .bg {
  stroke: #e5e7eb;
}

.circular-progress .progress {
  stroke: url(#gradient);
  stroke-linecap: round;
  stroke-dasharray: 283;
  transition: stroke-dashoffset 1s ease;
}

.progress-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  font-weight: bold;
  color: #333;
}

.detail-card p {
  color: #666;
  font-size: 0.95rem;
}

.stat-display {
  margin-bottom: 1rem;
}

.big-number {
  font-size: 3rem;
  font-weight: bold;
  color: #667eea;
}

.unit {
  font-size: 1rem;
  color: #666;
  margin-left: 0.5rem;
}

.recent-progress h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.progress-list {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.progress-item {
  padding: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background 0.3s;
}

.progress-item:hover {
  background: #f8f9fa;
}

.progress-item:last-child {
  border-bottom: none;
}

.item-info h4 {
  font-size: 1.05rem;
  color: #333;
  margin-bottom: 0.3rem;
}

.item-info p {
  font-size: 0.9rem;
  color: #666;
}

.item-stats {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.score,
.time {
  font-size: 0.9rem;
  color: #666;
}

.status {
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.status.completed {
  background: #d4edda;
  color: #155724;
}

.status.in_progress {
  background: #fff3cd;
  color: #856404;
}

.loading {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #fa709a;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
