<template>
  <div class="courses-page">
    <div class="page-header">
      <h1>探索课程</h1>
      <p>选择你感兴趣的语言，开始学习之旅</p>
    </div>

    <div class="filters">
      <div class="language-filter">
        <button
          :class="{ active: selectedLanguage === null }"
          @click="selectedLanguage = null"
        >
          全部
        </button>
        <button
          v-for="lang in learningStore.languages"
          :key="lang.language_id"
          :class="{ active: selectedLanguage === lang.language_id }"
          @click="selectedLanguage = lang.language_id"
        >
          {{ lang.flag_emoji }} {{ lang.language_name }}
        </button>
      </div>

      <div class="level-filter">
        <select v-model="selectedLevel">
          <option value="">所有级别</option>
          <option value="beginner">初级</option>
          <option value="intermediate">中级</option>
          <option value="advanced">高级</option>
        </select>
      </div>
    </div>

    <div class="courses-grid" v-if="!loading">
      <div v-for="course in filteredCourses" :key="course.course_id" class="course-card">
        <div class="course-banner" :style="getCourseBannerStyle(course)">
          <div class="course-overlay">
            <span class="course-flag">{{ course.flag_emoji }}</span>
            <span :class="['course-level-badge', course.level]">
              {{ getLevelText(course.level) }}
            </span>
          </div>
        </div>

        <div class="course-content">
          <h3>{{ course.course_name }}</h3>
          <p class="course-description">{{ course.description }}</p>

          <div class="course-stats">
            <div class="stat">
              <span class="stat-icon">📚</span>
              <span>{{ course.total_lessons }} 课时</span>
            </div>
            <div class="stat">
              <span class="stat-icon">⏱️</span>
              <span>{{ course.estimated_hours }} 小时</span>
            </div>
          </div>

          <div class="course-skills" v-if="course.skills_covered">
            <span v-for="skill in course.skills_covered" :key="skill" class="skill-tag">
              {{ skill }}
            </span>
          </div>

          <router-link :to="`/course/${course.course_id}`" class="course-btn">
            开始学习
          </router-link>
        </div>
      </div>
    </div>

    <div v-else class="loading">
      <div class="spinner"></div>
      <p>加载课程中...</p>
    </div>

    <div v-if="filteredCourses.length === 0 && !loading" class="empty-state">
      <p>没有找到符合条件的课程</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useLearningStore } from '../stores/learning';

const learningStore = useLearningStore();

const selectedLanguage = ref<number | null>(null);
const selectedLevel = ref('');
const loading = computed(() => learningStore.loading);

const filteredCourses = computed(() => {
  let courses = learningStore.courses;

  if (selectedLanguage.value) {
    courses = courses.filter(c => c.language_id === selectedLanguage.value);
  }

  if (selectedLevel.value) {
    courses = courses.filter(c => c.level === selectedLevel.value);
  }

  return courses;
});

const courseBannerColors: Record<string, string[]> = {
  en: ['#667eea', '#764ba2'],
  ja: ['#f093fb', '#f5576c'],
  ko: ['#4facfe', '#00f2fe'],
  fr: ['#43e97b', '#38f9d7'],
  es: ['#fa709a', '#fee140'],
  de: ['#667eea', '#764ba2'],
};

function getCourseBannerStyle(course: any) {
  const colors = courseBannerColors[course.language_code] || ['#667eea', '#764ba2'];
  return {
    background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`
  };
}

function getLevelText(level: string) {
  const levelMap: Record<string, string> = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级'
  };
  return levelMap[level] || level;
}

onMounted(async () => {
  await Promise.all([
    learningStore.fetchLanguages(),
    learningStore.fetchCourses()
  ]);
});
</script>

<style scoped>
.courses-page {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #666;
  font-size: 1rem;
}

.filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.language-filter {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.language-filter button {
  padding: 0.5rem 1rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.9rem;
}

.language-filter button:hover {
  border-color: #667eea;
}

.language-filter button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.level-filter select {
  padding: 0.5rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  min-width: 120px;
}

.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.course-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
}

.course-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}

.course-banner {
  height: 120px;
  position: relative;
}

.course-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.8rem;
}

.course-flag {
  font-size: 2.5rem;
}

.course-level-badge {
  padding: 0.3rem 0.8rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 600;
}

.course-level-badge.beginner {
  color: #4caf50;
}

.course-level-badge.intermediate {
  color: #ff9800;
}

.course-level-badge.advanced {
  color: #f44336;
}

.course-content {
  padding: 1.2rem;
}

.course-content h3 {
  font-size: 1.15rem;
  margin-bottom: 0.6rem;
  color: #333;
}

.course-description {
  color: #666;
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 0.8rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-stats {
  display: flex;
  gap: 1.2rem;
  margin-bottom: 0.8rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #666;
  font-size: 0.85rem;
}

.stat-icon {
  font-size: 1.1rem;
}

.course-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1.2rem;
}

.skill-tag {
  padding: 0.25rem 0.6rem;
  background: #f0f0f0;
  border-radius: 12px;
  font-size: 0.75rem;
  color: #555;
}

.course-btn {
  display: block;
  width: 100%;
  padding: 0.8rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  transition: opacity 0.3s;
}

.course-btn:hover {
  opacity: 0.9;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

@media (max-width: 1024px) {
  .courses-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1.2rem;
  }
}

@media (max-width: 768px) {
  .courses-page {
    padding: 1rem;
  }

  .page-header h1 {
    font-size: 1.8rem;
  }

  .filters {
    flex-direction: column;
    align-items: stretch;
  }

  .language-filter {
    justify-content: flex-start;
  }

  .language-filter button {
    flex-shrink: 0;
  }

  .courses-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .course-banner {
    height: 100px;
  }

  .course-flag {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: 1.5rem;
  }

  .course-content {
    padding: 1rem;
  }

  .course-content h3 {
    font-size: 1rem;
  }

  .course-stats {
    gap: 0.8rem;
  }

  .course-btn {
    padding: 0.7rem;
    font-size: 0.9rem;
  }
}
</style>
