<template>
  <div class="course-detail" v-if="course">
    <div class="course-hero" :style="getHeroStyle()">
      <div class="hero-overlay">
        <router-link to="/courses" class="back-btn">← 返回课程列表</router-link>
        <div class="course-info">
          <span class="course-flag">{{ course.flag_emoji }}</span>
          <h1>{{ course.course_name }}</h1>
          <p>{{ course.description }}</p>
          <div class="course-meta">
            <span class="meta-item">
              <span class="icon">📚</span>
              {{ course.total_lessons }} 课时
            </span>
            <span class="meta-item">
              <span class="icon">⏱️</span>
              {{ course.estimated_hours }} 小时
            </span>
            <span :class="['level-badge', course.level]">
              {{ getLevelText(course.level) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="course-body">
      <div class="lessons-section">
        <h2>课程内容</h2>
        <div class="lessons-list">
          <div
            v-for="(lesson, index) in lessons"
            :key="lesson.lesson_id"
            :class="['lesson-card', { completed: isLessonCompleted(lesson.lesson_id), locked: lesson.is_locked }]"
          >
            <div class="lesson-number">{{ index + 1 }}</div>
            <div class="lesson-content">
              <h3>{{ lesson.lesson_name }}</h3>
              <div class="lesson-meta">
                <span class="lesson-type">{{ getLessonTypeText(lesson.lesson_type) }}</span>
                <span class="lesson-duration">{{ lesson.duration_minutes }} 分钟</span>
                <span class="lesson-xp">+{{ lesson.xp_reward }} XP</span>
              </div>
            </div>
            <div class="lesson-status">
              <button
                v-if="!lesson.is_locked"
                @click="startLesson(lesson)"
                class="start-lesson-btn"
              >
                {{ isLessonCompleted(lesson.lesson_id) ? '复习' : '开始' }}
              </button>
              <span v-else class="locked-icon">🔒</span>
            </div>
          </div>
        </div>
      </div>

      <div class="sidebar">
        <div class="skills-card">
          <h3>涵盖技能</h3>
          <div class="skills-list">
            <div v-for="skill in course.skills_covered" :key="skill" class="skill-item">
              <span class="skill-icon">{{ getSkillIcon(skill) }}</span>
              <span>{{ skill }}</span>
            </div>
          </div>
        </div>

        <div class="progress-card">
          <h3>学习进度</h3>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: courseProgress + '%' }"></div>
          </div>
          <p>{{ completedLessons }} / {{ lessons.length }} 已完成</p>
        </div>

        <router-link to="/flashcards" class="flashcard-cta">
          <span>🎴</span>
          <div>
            <h4>单词卡练习</h4>
            <p>用闪卡强化记忆</p>
          </div>
        </router-link>
      </div>
    </div>

    <div v-if="showLessonModal" class="modal-overlay" @click.self="closeLesson">
      <div class="lesson-modal">
        <div class="modal-header">
          <h2>{{ currentLesson?.lesson_name }}</h2>
          <button @click="closeLesson" class="close-btn">×</button>
        </div>
        <div class="modal-content">
          <div v-if="!lessonCompleted">
            <div v-if="currentExerciseIndex < exercises.length" class="exercise-container">
              <div class="exercise-progress">
                练习 {{ currentExerciseIndex + 1 }} / {{ exercises.length }}
              </div>

              <div class="exercise-card">
                <p class="question">{{ exercises[currentExerciseIndex]?.question?.question }}</p>

                <div v-if="exercises[currentExerciseIndex]?.exercise_type === 'multiple_choice'" class="options">
                  <button
                    v-for="(option, idx) in exercises[currentExerciseIndex]?.options"
                    :key="idx"
                    @click="selectAnswer(idx)"
                    :class="{ selected: selectedOption === idx }"
                    class="option-btn"
                  >
                    {{ option.text }}
                  </button>
                </div>

                <div v-else-if="exercises[currentExerciseIndex]?.exercise_type === 'fill_blank'" class="fill-blank">
                  <input
                    v-model="fillBlankAnswer"
                    type="text"
                    :placeholder="exercises[currentExerciseIndex]?.question?.context || '输入答案'"
                    @keyup.enter="submitAnswer"
                  />
                </div>

                <div v-if="showFeedback" class="feedback" :class="{ correct: isCorrect, wrong: !isCorrect }">
                  <p v-if="isCorrect">✓ 正确！</p>
                  <p v-else>✗ 再试一次</p>
                  <p v-if="exercises[currentExerciseIndex]?.explanation" class="explanation">
                    {{ exercises[currentExerciseIndex].explanation }}
                  </p>
                </div>

                <div class="exercise-actions">
                  <button v-if="!showFeedback" @click="submitAnswer" class="submit-btn" :disabled="!canSubmit">
                    提交答案
                  </button>
                  <button v-else @click="nextExercise" class="next-btn">
                    {{ currentExerciseIndex < exercises.length - 1 ? '下一题' : '完成课程' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="completion-screen">
            <div class="completion-icon">🎉</div>
            <h3>太棒了！</h3>
            <p>你已经完成了本课时的学习</p>
            <p class="xp-earned">获得 {{ earnedXP }} XP</p>
            <button @click="closeLesson" class="continue-btn">继续学习</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="loading">
    <div class="spinner"></div>
    <p>加载课程中...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useLearningStore } from '../stores/learning';

const route = useRoute();
const router = useRouter();
const learningStore = useLearningStore();

const course = computed(() => learningStore.currentCourse);
const lessons = computed(() => learningStore.lessons);
const exercises = computed(() => learningStore.exercises);

const showLessonModal = ref(false);
const currentLesson = ref<any>(null);
const currentExerciseIndex = ref(0);
const selectedOption = ref<number | null>(null);
const fillBlankAnswer = ref('');
const showFeedback = ref(false);
const isCorrect = ref(false);
const lessonCompleted = ref(false);
const earnedXP = ref(0);

const completedLessons = computed(() => {
  return lessons.value.filter(l => isLessonCompleted(l.lesson_id)).length;
});

const courseProgress = computed(() => {
  if (lessons.value.length === 0) return 0;
  return Math.round((completedLessons.value / lessons.value.length) * 100);
});

const canSubmit = computed(() => {
  if (exercises.value[currentExerciseIndex.value]?.exercise_type === 'fill_blank') {
    return fillBlankAnswer.value.trim() !== '';
  }
  return selectedOption.value !== null;
});

function getHeroStyle() {
  const colors = getCourseColors(course.value?.language_code);
  return {
    background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`
  };
}

function getCourseColors(langCode?: string) {
  const colors: Record<string, string[]> = {
    en: ['#667eea', '#764ba2'],
    ja: ['#f093fb', '#f5576c'],
    ko: ['#4facfe', '#00f2fe'],
    fr: ['#43e97b', '#38f9d7'],
    es: ['#fa709a', '#fee140'],
    de: ['#667eea', '#764ba2']
  };
  return colors[langCode || 'en'] || ['#667eea', '#764ba2'];
}

function getLevelText(level: string) {
  const map: Record<string, string> = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级'
  };
  return map[level] || level;
}

function getLessonTypeText(type: string) {
  const map: Record<string, string> = {
    phonetics: '发音',
    vocabulary: '词汇',
    grammar: '语法',
    listening: '听力',
    speaking: '口语',
    reading: '阅读'
  };
  return map[type] || type;
}

function getSkillIcon(skill: string) {
  const map: Record<string, string> = {
    听力: '👂',
    口语: '🗣️',
    阅读: '📖',
    写作: '✍️',
    词汇: '📝',
    语法: '📐'
  };
  return map[skill] || '📚';
}

function isLessonCompleted(lessonId: number) {
  return learningStore.progress.some(
    p => p.lesson_id === lessonId && p.completion_status === 'completed'
  );
}

async function startLesson(lesson: any) {
  currentLesson.value = lesson;
  await learningStore.fetchLesson(lesson.lesson_id);
  showLessonModal.value = true;
  resetExerciseState();
}

function resetExerciseState() {
  currentExerciseIndex.value = 0;
  selectedOption.value = null;
  fillBlankAnswer.value = '';
  showFeedback.value = false;
  isCorrect.value = false;
  lessonCompleted.value = false;
  earnedXP.value = 0;
}

function selectAnswer(index: number) {
  selectedOption.value = index;
}

async function submitAnswer() {
  const exercise = exercises.value[currentExerciseIndex.value];
  let userAnswer: any;

  if (exercise.exercise_type === 'fill_blank') {
    userAnswer = { answer: fillBlankAnswer.value };
  } else {
    userAnswer = { selectedIndex: selectedOption.value };
  }

  const result: any = await learningStore.submitExercise(exercise.exercise_id, userAnswer);

  isCorrect.value = result.isCorrect;
  showFeedback.value = true;

  if (result.isCorrect) {
    earnedXP.value += exercise.points;
  }
}

function nextExercise() {
  if (currentExerciseIndex.value < exercises.value.length - 1) {
    currentExerciseIndex.value++;
    resetExerciseState();
  } else {
    completeLesson();
  }
}

async function completeLesson() {
  await learningStore.updateLessonProgress(currentLesson.value.lesson_id, {
    completionStatus: 'completed',
    score: Math.round((earnedXP.value / (exercises.value.length * 10)) * 100),
    timeSpentMinutes: currentLesson.value.duration_minutes
  });

  await learningStore.checkAchievements();
  lessonCompleted.value = true;
}

function closeLesson() {
  showLessonModal.value = false;
  currentLesson.value = null;
  resetExerciseState();
}

onMounted(async () => {
  const courseId = parseInt(route.params.id as string);
  await learningStore.fetchCourse(courseId);
  await learningStore.fetchProgress();
});
</script>

<style scoped>
.course-detail {
  min-height: 100vh;
}

.course-hero {
  padding: 3rem 2rem;
  color: white;
  position: relative;
}

.hero-overlay {
  max-width: 1200px;
  margin: 0 auto;
}

.back-btn {
  display: inline-block;
  color: white;
  text-decoration: none;
  margin-bottom: 2rem;
  opacity: 0.9;
  transition: opacity 0.3s;
}

.back-btn:hover {
  opacity: 1;
}

.course-info h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.course-info p {
  font-size: 1.1rem;
  opacity: 0.9;
  margin-bottom: 1.5rem;
  max-width: 700px;
}

.course-meta {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
}

.icon {
  font-size: 1.2rem;
}

.level-badge {
  padding: 0.4rem 1rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-weight: 600;
}

.course-body {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2rem;
}

.lessons-section h2 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #333;
}

.lessons-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.lesson-card {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s, box-shadow 0.3s;
}

.lesson-card:hover:not(.locked) {
  transform: translateX(5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.lesson-card.completed {
  background: #f0fdf4;
  border: 2px solid #22c55e;
}

.lesson-card.locked {
  opacity: 0.6;
}

.lesson-number {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
}

.lesson-card.completed .lesson-number {
  background: #22c55e;
}

.lesson-content {
  flex: 1;
}

.lesson-content h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.lesson-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: #666;
}

.lesson-type {
  color: #667eea;
  font-weight: 500;
}

.lesson-xp {
  color: #f59e0b;
  font-weight: 600;
}

.start-lesson-btn {
  padding: 0.7rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.3s;
}

.start-lesson-btn:hover {
  opacity: 0.9;
}

.locked-icon {
  font-size: 1.5rem;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.skills-card,
.progress-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.skills-card h3,
.progress-card h3 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: #333;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.skill-item {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.skill-icon {
  font-size: 1.5rem;
}

.progress-bar {
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.8rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 6px;
  transition: width 0.3s;
}

.flashcard-cta {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border-radius: 16px;
  text-decoration: none;
  color: white;
  transition: transform 0.3s;
}

.flashcard-cta:hover {
  transform: translateY(-3px);
}

.flashcard-cta span {
  font-size: 2.5rem;
}

.flashcard-cta h4 {
  font-size: 1.1rem;
  margin-bottom: 0.3rem;
}

.flashcard-cta p {
  font-size: 0.9rem;
  opacity: 0.9;
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

.lesson-modal {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
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
  transition: background 0.3s;
}

.close-btn:hover {
  background: #e5e5e5;
}

.modal-content {
  padding: 2rem;
  overflow-y: auto;
}

.exercise-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.exercise-progress {
  text-align: center;
  color: #666;
  font-size: 0.95rem;
}

.exercise-card {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.question {
  font-size: 1.3rem;
  color: #333;
  text-align: center;
  line-height: 1.6;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-btn {
  padding: 1rem;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
}

.option-btn:hover {
  border-color: #667eea;
}

.option-btn.selected {
  border-color: #667eea;
  background: #f0f0ff;
}

.fill-blank input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1.1rem;
  text-align: center;
}

.fill-blank input:focus {
  outline: none;
  border-color: #667eea;
}

.feedback {
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
}

.feedback.correct {
  background: #d4edda;
  color: #155724;
}

.feedback.wrong {
  background: #f8d7da;
  color: #721c24;
}

.explanation {
  margin-top: 0.8rem;
  font-size: 0.95rem;
  opacity: 0.9;
}

.exercise-actions {
  display: flex;
  justify-content: center;
}

.submit-btn,
.next-btn {
  padding: 1rem 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s;
}

.submit-btn:hover:not(:disabled),
.next-btn:hover {
  opacity: 0.9;
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.completion-screen {
  text-align: center;
  padding: 3rem 2rem;
}

.completion-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.completion-screen h3 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 0.8rem;
}

.completion-screen p {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.xp-earned {
  color: #f59e0b;
  font-weight: 600;
  font-size: 1.3rem;
  margin: 1rem 0;
}

.continue-btn {
  margin-top: 2rem;
  padding: 1rem 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 968px) {
  .course-body {
    grid-template-columns: 1fr;
  }

  .sidebar {
    order: -1;
  }
}
</style>
