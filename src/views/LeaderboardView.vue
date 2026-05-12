<template>
  <div class="leaderboard-page">
    <div class="page-header">
      <h1>排行榜</h1>
      <p>看看谁是最勤奋的学习者</p>
    </div>

    <div class="top-three" v-if="leaderboard.length >= 3">
      <div class="podium-card second">
        <div class="rank-badge">🥈</div>
        <div class="user-avatar">{{ leaderboard[1]?.username?.charAt(0).toUpperCase() }}</div>
        <h3>{{ leaderboard[1]?.username }}</h3>
        <p class="points">{{ leaderboard[1]?.total_points || 0 }} 积分</p>
        <p class="level">Lv.{{ leaderboard[1]?.level || 1 }}</p>
      </div>
      <div class="podium-card first">
        <div class="rank-badge">🥇</div>
        <div class="user-avatar gold">{{ leaderboard[0]?.username?.charAt(0).toUpperCase() }}</div>
        <h3>{{ leaderboard[0]?.username }}</h3>
        <p class="points">{{ leaderboard[0]?.total_points || 0 }} 积分</p>
        <p class="level">Lv.{{ leaderboard[0]?.level || 1 }}</p>
      </div>
      <div class="podium-card third">
        <div class="rank-badge">🥉</div>
        <div class="user-avatar">{{ leaderboard[2]?.username?.charAt(0).toUpperCase() }}</div>
        <h3>{{ leaderboard[2]?.username }}</h3>
        <p class="points">{{ leaderboard[2]?.total_points || 0 }} 积分</p>
        <p class="level">Lv.{{ leaderboard[2]?.level || 1 }}</p>
      </div>
    </div>

    <div class="ranking-list">
      <div
        v-for="(user, index) in leaderboard.slice(3)"
        :key="user.user_id"
        :class="['ranking-item', { highlight: user.user_id === currentUserId }]"
      >
        <div class="rank">{{ index + 4 }}</div>
        <div class="user-avatar small">{{ user.username?.charAt(0).toUpperCase() }}</div>
        <div class="user-info">
          <h4>{{ user.username }}</h4>
          <div class="user-stats">
            <span>Lv.{{ user.level }}</span>
            <span>🔥 {{ user.current_streak || 0 }}天</span>
            <span>🏆 {{ user.achievements_count || 0 }}</span>
          </div>
        </div>
        <div class="total-points">{{ user.total_points }} 积分</div>
      </div>
    </div>

    <div class="loading" v-if="loading">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useLearningStore } from '../stores/learning';

const authStore = useAuthStore();
const learningStore = useLearningStore();

const leaderboard = ref<any[]>([]);
const loading = ref(false);

const currentUserId = computed(() => authStore.user?.user_id);

onMounted(async () => {
  loading.value = true;
  try {
    await learningStore.fetchLeaderboard();
    leaderboard.value = learningStore.leaderboard;
  } catch (err) {
    console.error('Failed to load leaderboard:', err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.leaderboard-page {
  padding: 2rem;
  max-width: 1000px;
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

.top-three {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 1.5rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}

.podium-card {
  background: white;
  padding: 2rem;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  min-width: 200px;
  transition: transform 0.3s;
}

.podium-card:hover {
  transform: translateY(-5px);
}

.podium-card.first {
  order: 2;
  min-width: 240px;
  padding: 2.5rem;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  transform: scale(1.05);
}

.podium-card.first:hover {
  transform: scale(1.08);
}

.podium-card.first .user-avatar {
  width: 80px;
  height: 80px;
  font-size: 2.5rem;
  margin: 1rem auto;
  background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
}

.podium-card.second {
  order: 1;
}

.podium-card.second .user-avatar {
  background: linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%);
}

.podium-card.third {
  order: 3;
}

.podium-card.third .user-avatar {
  background: linear-gradient(135deg, #cd7f32 0%, #b5651d 100%);
}

.rank-badge {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.user-avatar {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.8rem;
  margin: 1rem auto;
}

.podium-card h3 {
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.points {
  font-size: 1.3rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.3rem;
}

.level {
  color: #666;
  font-size: 0.95rem;
}

.ranking-list {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.3s;
}

.ranking-item:hover {
  background: #f8f9fa;
}

.ranking-item:last-child {
  border-bottom: none;
}

.ranking-item.highlight {
  background: #f0f0ff;
  border-left: 4px solid #667eea;
}

.rank {
  width: 40px;
  font-size: 1.3rem;
  font-weight: bold;
  color: #667eea;
}

.user-avatar.small {
  width: 50px;
  height: 50px;
  font-size: 1.5rem;
}

.user-info {
  flex: 1;
}

.user-info h4 {
  font-size: 1.05rem;
  color: #333;
  margin-bottom: 0.3rem;
}

.user-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.total-points {
  font-size: 1.2rem;
  font-weight: bold;
  color: #667eea;
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

@media (max-width: 768px) {
  .top-three {
    flex-direction: column;
    align-items: center;
  }

  .podium-card {
    width: 100%;
    max-width: 300px;
  }

  .podium-card.first {
    order: 1;
    transform: scale(1);
  }

  .podium-card.first:hover {
    transform: scale(1.03);
  }
}
</style>
