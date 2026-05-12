<template>
  <nav class="main-nav">
    <div class="nav-container">
      <router-link to="/" class="logo">
        <span class="logo-icon">🌍</span>
        <span class="logo-text">LinguaLearn</span>
      </router-link>

      <div class="nav-links">
        <router-link to="/courses" class="nav-link">
          <span>📚</span> 课程
        </router-link>
        <router-link to="/flashcards" class="nav-link">
          <span>🎴</span> 单词卡
        </router-link>
        <router-link to="/community" class="nav-link">
          <span>💬</span> 社区
        </router-link>
        <router-link to="/progress" class="nav-link">
          <span>📊</span> 进度
        </router-link>
        <router-link to="/achievements" class="nav-link">
          <span>🏆</span> 成就
        </router-link>
      </div>

      <div class="nav-user" v-if="authStore.isAuthenticated">
        <div class="user-stats">
          <span class="points">⭐ {{ authStore.user?.total_points || 0 }}</span>
          <span class="level">Lv.{{ authStore.user?.level || 1 }}</span>
        </div>
        <div class="user-menu">
          <div class="user-avatar" @click="showMenu = !showMenu">
            {{ authStore.user?.username?.charAt(0).toUpperCase() }}
          </div>
          <div v-if="showMenu" class="dropdown-menu">
            <router-link to="/" @click="showMenu = false">学习面板</router-link>
            <router-link to="/leaderboard" @click="showMenu = false">排行榜</router-link>
            <button @click="handleLogout" class="logout-btn">退出登录</button>
          </div>
        </div>
      </div>
      <router-link v-else to="/auth" class="login-btn">登录</router-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();
const router = useRouter();
const showMenu = ref(false);

async function handleLogout() {
  authStore.logout();
  showMenu.value = false;
  router.push('/auth');
}
</script>

<style scoped>
.main-nav {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  text-decoration: none;
  color: #333;
}

.logo-icon {
  font-size: 2rem;
}

.logo-text {
  font-size: 1.5rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #666;
  font-weight: 500;
  transition: color 0.3s;
  font-size: 0.95rem;
}

.nav-link:hover {
  color: #667eea;
}

.nav-link.router-link-active {
  color: #667eea;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.user-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.95rem;
}

.points {
  color: #f59e0b;
  font-weight: 600;
}

.level {
  color: #667eea;
  font-weight: 600;
}

.user-menu {
  position: relative;
}

.user-avatar {
  width: 45px;
  height: 45px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  cursor: pointer;
  transition: transform 0.3s;
}

.user-avatar:hover {
  transform: scale(1.05);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 180px;
  overflow: hidden;
}

.dropdown-menu a,
.dropdown-menu button {
  display: block;
  width: 100%;
  padding: 0.9rem 1.2rem;
  text-decoration: none;
  color: #333;
  font-size: 0.95rem;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.3s;
}

.dropdown-menu a:hover,
.dropdown-menu button:hover {
  background: #f5f5f5;
}

.logout-btn {
  color: #dc3545 !important;
}

.login-btn {
  padding: 0.7rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-decoration: none;
  border-radius: 25px;
  font-weight: 600;
  transition: opacity 0.3s;
}

.login-btn:hover {
  opacity: 0.9;
}

@media (max-width: 968px) {
  .nav-links {
    display: none;
  }
}
</style>
