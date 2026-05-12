<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1>LinguaLearn</h1>
        <p>开启你的多语种学习之旅</p>
      </div>

      <div class="auth-tabs">
        <button
          :class="{ active: activeTab === 'login' }"
          @click="activeTab = 'login'"
        >
          登录
        </button>
        <button
          :class="{ active: activeTab === 'register' }"
          @click="activeTab = 'register'"
        >
          注册
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div v-if="activeTab === 'register'" class="form-group">
          <label>用户名</label>
          <input
            v-model="formData.username"
            type="text"
            placeholder="选择你的用户名"
            required
          />
        </div>

        <div class="form-group">
          <label>邮箱</label>
          <input
            v-model="formData.email"
            type="email"
            placeholder="输入你的邮箱"
            required
          />
        </div>

        <div class="form-group">
          <label>密码</label>
          <input
            v-model="formData.password"
            type="password"
            placeholder="输入密码"
            required
            minlength="6"
          />
        </div>

        <div v-if="activeTab === 'register'" class="form-group">
          <label>母语</label>
          <select v-model="formData.nativeLanguage">
            <option value="zh-CN">中文</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
            <option value="ko">한국어</option>
          </select>
        </div>

        <div v-if="activeTab === 'register'" class="form-group">
          <label>想学习的语言（可多选）</label>
          <div class="language-checkboxes">
            <label v-for="lang in availableLanguages" :key="lang.code">
              <input
                type="checkbox"
                :value="lang.code"
                v-model="formData.preferredLanguages"
              />
              {{ lang.flag }} {{ lang.name }}
            </label>
          </div>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? '处理中...' : (activeTab === 'login' ? '登录' : '创建账户') }}
        </button>
      </form>

      <div class="auth-footer">
        <p>探索世界，从语言开始</p>
      </div>
    </div>

    <div class="auth-background">
      <div class="floating-language">🇬🇧</div>
      <div class="floating-language">🇯🇵</div>
      <div class="floating-language">🇰🇷</div>
      <div class="floating-language">🇫🇷</div>
      <div class="floating-language">🇪🇸</div>
      <div class="floating-language">🇩🇪</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref<'login' | 'register'>('login');
const formData = ref({
  username: '',
  email: '',
  password: '',
  nativeLanguage: 'zh-CN',
  preferredLanguages: ['en']
});

const availableLanguages = [
  { code: 'en', name: '英语', flag: '🇬🇧' },
  { code: 'ja', name: '日语', flag: '🇯🇵' },
  { code: 'ko', name: '韩语', flag: '🇰🇷' },
  { code: 'fr', name: '法语', flag: '🇫🇷' },
  { code: 'es', name: '西班牙语', flag: '🇪🇸' },
  { code: 'de', name: '德语', flag: '🇩🇪' }
];

const loading = computed(() => authStore.loading);
const error = computed(() => authStore.error);

async function handleSubmit() {
  try {
    if (activeTab.value === 'login') {
      await authStore.login(formData.value.email, formData.value.password);
    } else {
      await authStore.register(formData.value);
    }
    router.push('/');
  } catch (err) {
    console.error('Auth error:', err);
  }
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
  position: relative;
  overflow: hidden;
}

.auth-card {
  background: white;
  border-radius: 24px;
  padding: 2.5rem;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 10;
}

.auth-header {
  text-align: center;
  margin-bottom: 1.8rem;
}

.auth-header h1 {
  font-size: 2.2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.4rem;
}

.auth-header p {
  color: #666;
  font-size: 0.95rem;
}

.auth-tabs {
  display: flex;
  gap: 0.8rem;
  margin-bottom: 1.8rem;
}

.auth-tabs button {
  flex: 1;
  padding: 0.9rem;
  border: none;
  background: #f5f5f5;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.auth-tabs button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-weight: 500;
  color: #333;
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  padding: 0.8rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 0.95rem;
  transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
}

.language-checkboxes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;
}

.language-checkboxes label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  font-weight: normal;
  font-size: 0.85rem;
}

.language-checkboxes input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.error-message {
  padding: 0.8rem;
  background: #fee;
  color: #c33;
  border-radius: 8px;
  font-size: 0.85rem;
  text-align: center;
}

.submit-btn {
  padding: 0.9rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-footer {
  margin-top: 1.8rem;
  text-align: center;
  color: #999;
  font-size: 0.85rem;
}

.auth-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.floating-language {
  position: absolute;
  font-size: 4rem;
  opacity: 0.15;
  animation: float 6s ease-in-out infinite;
}

.floating-language:nth-child(1) { top: 10%; left: 10%; animation-delay: 0s; }
.floating-language:nth-child(2) { top: 20%; right: 15%; animation-delay: 1s; }
.floating-language:nth-child(3) { bottom: 30%; left: 5%; animation-delay: 2s; }
.floating-language:nth-child(4) { bottom: 20%; right: 10%; animation-delay: 3s; }
.floating-language:nth-child(5) { top: 50%; left: 15%; animation-delay: 4s; }
.floating-language:nth-child(6) { bottom: 40%; right: 20%; animation-delay: 5s; }

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@media screen and (max-width: 768px) {
  .auth-container {
    padding: 0.8rem;
  }
  
  .auth-card {
    padding: 2rem;
  }
  
  .language-checkboxes {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media screen and (max-width: 480px) {
  .auth-card {
    padding: 1.5rem;
  }
  
  .auth-header h1 {
    font-size: 1.8rem;
  }
  
  .language-checkboxes {
    grid-template-columns: 1fr;
  }
}
</style>