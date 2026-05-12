<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="welcome-section">
        <h1>欢迎回来，{{ authStore.user?.username || '学习者' }}！</h1>
        <p class="streak-info" v-if="authStore.user?.current_streak">
          <span class="fire-icon">🔥</span>
          {{ authStore.user.current_streak }} 天连续学习
        </p>
      </div>
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-value">{{ authStore.user?.total_points || 0 }}</div>
          <div class="stat-label">总积分</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">Lv.{{ authStore.user?.level || 1 }}</div>
          <div class="stat-label">当前等级</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ learningStore.progressSummary?.lessonsProgress?.completed_lessons || 0 }}</div>
          <div class="stat-label">已完成课时</div>
        </div>
      </div>
    </header>

    <section class="quick-actions">
      <h2>快速开始</h2>
      <div class="action-grid">
        <router-link to="/courses" class="action-card vocabulary-card">
          <div class="action-icon">📚</div>
          <h3>开始学习</h3>
          <p>选择课程继续学习</p>
        </router-link>
        <router-link to="/flashcards" class="action-card flashcard-card">
          <div class="action-icon">🎴</div>
          <h3>单词卡</h3>
          <p>记忆单词强化</p>
        </router-link>
        <router-link to="/community" class="action-card community-card">
          <div class="action-icon">💬</div>
          <h3>社区</h3>
          <p>与其他学习者交流</p>
        </router-link>
        <router-link to="/progress" class="action-card progress-card">
          <div class="action-icon">📊</div>
          <h3>学习报告</h3>
          <p>查看学习进度</p>
        </router-link>
      </div>
    </section>

    <section class="recommended-courses" v-if="learningStore.recommendations.length > 0">
      <h2>为你推荐</h2>
      <div class="course-grid">
        <div v-for="rec in learningStore.recommendations" :key="rec.course?.course_id" class="course-card">
          <div class="course-header">
            <span class="course-flag">{{ rec.course?.flag_emoji || '🌐' }}</span>
            <span class="course-level">{{ rec.course?.level }}</span>
          </div>
          <h3>{{ rec.course?.course_name }}</h3>
          <p>{{ rec.reason }}</p>
          <router-link :to="`/course/${rec.course?.course_id}`" class="start-btn">开始学习</router-link>
        </div>
      </div>
    </section>

    <section class="recent-activity">
      <h2>最近学习</h2>
      <div class="activity-list" v-if="learningStore.progress.length > 0">
        <div v-for="item in learningStore.progress.slice(0, 5)" :key="item.progress_id" class="activity-item">
          <div class="activity-info">
            <h4>{{ item.lesson_name }}</h4>
            <p>{{ item.course_name }} - {{ item.language_name }}</p>
          </div>
          <div class="activity-status">
            <span :class="['status-badge', item.completion_status]">
              {{ item.completion_status === 'completed' ? '✓ 已完成' : '进行中' }}
            </span>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>还没有学习记录，</p>
        <router-link to="/courses">开始你的学习之旅</router-link>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useLearningStore } from '../stores/learning';

const authStore = useAuthStore();
const learningStore = useLearningStore();

onMounted(async () => {
  if (authStore.isAuthenticated) {
    await Promise.all([
      learningStore.fetchProgress(),
      learningStore.fetchRecommendations(),
      learningStore.fetchAchievements(),
    ]);
  }
});
</script>

<style scoped>
.dashboard {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  color: white;
}

.welcome-section h1 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.streak-info {
  font-size: 1rem;
  opacity: 0.9;
}

.fire-icon {
  font-size: 1.2rem;
}

.stats-overview {
  display: flex;
  gap: 1.5rem;
}

.stat-card {
  text-align: center;
  padding: 1rem 1.2rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  min-width: 80px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
}

.stat-label {
  font-size: 0.85rem;
  opacity: 0.9;
}

section h2 {
  font-size: 1.4rem;
  margin-bottom: 1.2rem;
  color: #333;
}

.quick-actions {
  margin-bottom: 2rem;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.action-card {
  padding: 1.5rem;
  border-radius: 14px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
  overflow: hidden;
}

.action-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.vocabulary-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.flashcard-card {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.community-card {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.progress-card {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.action-icon {
  font-size: 2.5rem;
  margin-bottom: 0.8rem;
}

.action-card h3 {
  font-size: 1.1rem;
  margin-bottom: 0.4rem;
  color: white;
}

.action-card p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.85rem;
}

.recommended-courses {
  margin-bottom: 2rem;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.2rem;
}

.course-card {
  background: white;
  padding: 1.2rem;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s;
}

.course-card:hover {
  transform: translateY(-3px);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
}

.course-flag {
  font-size: 1.8rem;
}

.course-level {
  padding: 0.25rem 0.6rem;
  background: #e8f4f8;
  color: #1976d2;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
}

.course-card h3 {
  font-size: 1.1rem;
  margin-bottom: 0.4rem;
  color: #333;
}

.course-card p {
  color: #666;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  line-height: 1.4;
}

.start-btn {
  display: inline-block;
  padding: 0.6rem 1.2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
  transition: opacity 0.3s;
}

.start-btn:hover {
  opacity: 0.9;
}

.recent-activity {
  background: white;
  padding: 1.5rem;
  border-radius: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem;
  background: #f8f9fa;
  border-radius: 10px;
  transition: background 0.3s;
}

.activity-item:hover {
  background: #e9ecef;
}

.activity-info h4 {
  font-size: 0.95rem;
  color: #333;
  margin-bottom: 0.2rem;
}

.activity-info p {
  font-size: 0.8rem;
  color: #666;
}

.status-badge {
  padding: 0.3rem 0.8rem;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.status-badge.in_progress {
  background: #fff3cd;
  color: #856404;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.empty-state a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

@media (max-width: 1024px) {
  .dashboard-header {
    flex-direction: column;
    text-align: center;
    gap: 1.5rem;
    padding: 1.5rem;
  }

  .welcome-section h1 {
    font-size: 1.5rem;
  }

  .stats-overview {
    flex-wrap: wrap;
    justify-content: center;
    gap: 1rem;
  }

  .stat-card {
    flex: 1 1 28%;
    min-width: 70px;
  }

  .stat-value {
    font-size: 1.5rem;
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

  .action-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.8rem;
  }

  .action-card {
    padding: 1.2rem;
  }

  .action-icon {
    font-size: 2rem;
  }

  .course-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .dashboard-header {
    padding: 1rem;
  }

  .welcome-section h1 {
    font-size: 1.3rem;
  }

  .stat-card {
    flex: 1 1 45%;
    padding: 0.8rem 0.6rem;
  }

  .stat-value {
    font-size: 1.3rem;
  }

  .action-grid {
    grid-template-columns: 1fr;
  }

  .action-card {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .action-icon {
    font-size: 2.2rem;
    margin-bottom: 0;
  }

  .activity-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .status-badge {
    align-self: flex-end;
  }
}
</style>
