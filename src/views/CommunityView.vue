<template>
  <div class="community-page">
    <div class="page-header">
      <h1>学习社区</h1>
      <p>与其他学习者交流、分享经验</p>
    </div>

    <div class="community-controls">
      <div class="filters">
        <select v-model="selectedLanguage" @change="loadPosts">
          <option value="">所有语言</option>
          <option v-for="lang in learningStore.languages" :key="lang.language_id" :value="lang.language_id">
            {{ lang.flag_emoji }} {{ lang.language_name }}
          </option>
        </select>
        <select v-model="sortBy">
          <option value="recent">最新</option>
          <option value="popular">最热</option>
        </select>
      </div>
      <button @click="showCreateModal = true" class="create-btn">
        发布帖子
      </button>
    </div>

    <div class="posts-grid">
      <div v-for="post in posts" :key="post.post_id" class="post-card">
        <div class="post-header">
          <div class="post-author">
            <div class="avatar">{{ post.username?.charAt(0).toUpperCase() }}</div>
            <div class="author-info">
              <h4>{{ post.username }}</h4>
              <span class="level">Lv.{{ post.level }}</span>
            </div>
          </div>
          <span class="language-tag">{{ post.language_name }}</span>
        </div>
        <h3 class="post-title">{{ post.post_title || '无标题' }}</h3>
        <p class="post-content">{{ post.post_content }}</p>
        <div class="post-footer">
          <div class="post-stats">
            <span class="stat" @click="likePost(post)">
              ❤️ {{ post.likes_count }}
            </span>
            <span class="stat">
              💬 {{ post.comments_count }}
            </span>
          </div>
          <span class="post-date">{{ formatDate(post.created_at) }}</span>
        </div>
      </div>
    </div>

    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="create-modal">
        <div class="modal-header">
          <h2>发布新帖子</h2>
          <button @click="showCreateModal = false" class="close-btn">×</button>
        </div>
        <form @submit.prevent="createPost" class="create-form">
          <div class="form-group">
            <label>标题</label>
            <input v-model="newPost.postTitle" type="text" placeholder="帖子标题" required />
          </div>
          <div class="form-group">
            <label>语言</label>
            <select v-model="newPost.languageId" required>
              <option v-for="lang in learningStore.languages" :key="lang.language_id" :value="lang.language_id">
                {{ lang.flag_emoji }} {{ lang.language_name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>内容</label>
            <textarea v-model="newPost.postContent" rows="6" placeholder="分享你的学习心得..." required></textarea>
          </div>
          <button type="submit" class="submit-btn">发布</button>
        </form>
      </div>
    </div>

    <div class="loading" v-if="loading">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import api from '../services/api';
import { useLearningStore } from '../stores/learning';

const learningStore = useLearningStore();

const posts = ref<any[]>([]);
const loading = ref(false);
const showCreateModal = ref(false);
const selectedLanguage = ref('');
const sortBy = ref('recent');
const newPost = ref({
  postTitle: '',
  postContent: '',
  languageId: null as number | null
});

async function loadPosts() {
  loading.value = true;
  try {
    const endpoint = selectedLanguage.value
      ? `/community?languageId=${selectedLanguage.value}&sort=${sortBy.value}`
      : `/community?sort=${sortBy.value}`;
    posts.value = await api.get(endpoint);
  } catch (err) {
    console.error('Failed to load posts:', err);
  } finally {
    loading.value = false;
  }
}

async function createPost() {
  try {
    await api.post('/community', {
      postTitle: newPost.value.postTitle,
      postContent: newPost.value.postContent,
      languageId: newPost.value.languageId
    });
    showCreateModal.value = false;
    newPost.value = { postTitle: '', postContent: '', languageId: null };
    await loadPosts();
  } catch (err) {
    console.error('Failed to create post:', err);
  }
}

async function likePost(post: any) {
  try {
    const result: any = await api.put(`/community/${post.post_id}/like`);
    post.likes_count = result.likesCount;
  } catch (err) {
    console.error('Failed to like post:', err);
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}

onMounted(async () => {
  await learningStore.fetchLanguages();
  await loadPosts();
});
</script>

<style scoped>
.community-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #666;
  font-size: 1.1rem;
}

.community-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.filters {
  display: flex;
  gap: 1rem;
}

.filters select {
  padding: 0.6rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
}

.create-btn {
  padding: 0.8rem 1.5rem;
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.3s;
}

.create-btn:hover {
  opacity: 0.9;
}

.posts-grid {
  display: grid;
  gap: 1.5rem;
}

.post-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
}

.post-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar {
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
}

.author-info h4 {
  font-size: 1rem;
  color: #333;
  margin-bottom: 0.2rem;
}

.level {
  font-size: 0.85rem;
  color: #666;
}

.language-tag {
  padding: 0.3rem 0.8rem;
  background: #f0f0f0;
  border-radius: 20px;
  font-size: 0.85rem;
}

.post-title {
  font-size: 1.3rem;
  margin-bottom: 0.8rem;
  color: #333;
}

.post-content {
  color: #666;
  line-height: 1.6;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.post-stats {
  display: flex;
  gap: 1.5rem;
}

.stat {
  color: #666;
  font-size: 0.95rem;
  cursor: pointer;
  transition: color 0.3s;
}

.stat:hover {
  color: #667eea;
}

.post-date {
  color: #999;
  font-size: 0.9rem;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.create-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  padding: 2rem;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  font-size: 1.5rem;
  color: #333;
}

.close-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #f5f5f5;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.9rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
}

.form-group textarea {
  resize: vertical;
}

.submit-btn {
  padding: 1rem;
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.loading {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #43e97b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
