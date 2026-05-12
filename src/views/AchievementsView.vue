<template>
  <div class="achievements-page">
    <div class="page-header">
      <h1>成就系统</h1>
      <p>解锁成就，获得荣誉</p>
    </div>

    <div class="achievements-grid">
      <div
        v-for="achievement in achievements"
        :key="achievement.achievement_id"
        :class="['achievement-card', { earned: achievement.earned_at }]"
      >
        <div class="achievement-icon">
          {{ achievement.icon_url || '🏆' }}
        </div>
        <div class="achievement-info">
          <h3>{{ achievement.achievement_name }}</h3>
          <p>{{ achievement.description }}</p>
          <div class="achievement-meta">
            <span class="category">{{ achievement.category }}</span>
            <span v-if="achievement.points_reward > 0" class="points">
              +{{ achievement.points_reward }} XP
            </span>
          </div>
        </div>
        <div v-if="achievement.earned_at" class="earned-badge">
          ✓ 已获得
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

const achievements = ref<any[]>([]);
const loading = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    await learningStore.fetchAchievements();
    achievements.value = learningStore.achievements;
  } catch (err) {
    console.error('Failed to load achievements:', err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.achievements-page {
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
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #666;
  font-size: 1.1rem;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.achievement-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 1rem;
  transition: transform 0.3s, box-shadow 0.3s;
  position: relative;
}

.achievement-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.achievement-card.earned {
  border: 2px solid #22c55e;
}

.achievement-icon {
  font-size: 3rem;
  flex-shrink: 0;
}

.achievement-info {
  flex: 1;
}

.achievement-info h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.achievement-info p {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 0.8rem;
}

.achievement-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
}

.category {
  padding: 0.2rem 0.6rem;
  background: #f0f0f0;
  border-radius: 12px;
  color: #666;
}

.points {
  color: #f59e0b;
  font-weight: 600;
}

.earned-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.3rem 0.8rem;
  background: #22c55e;
  color: white;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.loading {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #f093fb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
