import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';

export const useLearningStore = defineStore('learning', () => {
  const languages = ref<any[]>([]);
  const courses = ref<any[]>([]);
  const currentCourse = ref<any>(null);
  const lessons = ref<any[]>([]);
  const currentLesson = ref<any>(null);
  const exercises = ref<any[]>([]);
  const vocabulary = ref<any[]>([]);
  const progress = ref<any[]>([]);
  const progressSummary = ref<any>(null);
  const achievements = ref<any[]>([]);
  const leaderboard = ref<any[]>([]);
  const recommendations = ref<any[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchLanguages() {
    loading.value = true;
    try {
      languages.value = await api.get('/languages');
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCourses(languageId?: number) {
    loading.value = true;
    try {
      const endpoint = languageId ? `/courses?language=${languageId}` : '/courses';
      courses.value = await api.get(endpoint);
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchCourse(courseId: number) {
    loading.value = true;
    try {
      currentCourse.value = await api.get(`/courses/${courseId}`);
      await fetchLessons(courseId);
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function fetchLessons(courseId: number) {
    try {
      lessons.value = await api.get(`/courses/${courseId}/lessons`);
    } catch (err: any) {
      error.value = err.message;
    }
  }

  async function fetchLesson(lessonId: number) {
    loading.value = true;
    try {
      currentLesson.value = await api.get(`/lessons/${lessonId}`);
      exercises.value = await api.get(`/lessons/${lessonId}/exercises`);
    } catch (err: any) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  }

  async function submitExercise(exerciseId: number, userAnswer: any, timeTakenSeconds?: number) {
    try {
      return await api.post('/exercises/submit', { exerciseId, userAnswer, timeTakenSeconds });
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  }

  async function updateLessonProgress(lessonId: number, progressData: any) {
    try {
      return await api.post('/progress/lesson', {
        lessonId,
        courseId: currentCourse.value?.course_id,
        languageId: currentCourse.value?.language_id,
        ...progressData,
      });
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  }

  async function fetchProgress() {
    try {
      progress.value = await api.get('/progress');
      progressSummary.value = await api.get('/progress/summary');
    } catch (err: any) {
      error.value = err.message;
    }
  }

  async function fetchAchievements() {
    try {
      achievements.value = await api.get('/achievements/user');
    } catch (err: any) {
      error.value = err.message;
    }
  }

  async function checkAchievements() {
    try {
      return await api.post('/achievements/check');
    } catch (err: any) {
      error.value = err.message;
    }
  }

  async function fetchLeaderboard() {
    try {
      leaderboard.value = await api.get('/users/leaderboard');
    } catch (err: any) {
      error.value = err.message;
    }
  }

  async function fetchRecommendations() {
    try {
      recommendations.value = await api.get('/learning-path/recommendations');
    } catch (err: any) {
      error.value = err.message;
    }
  }

  async function fetchVocabulary(languageId: number, difficulty?: number) {
    try {
      const endpoint = difficulty
        ? `/vocabulary?languageId=${languageId}&difficulty=${difficulty}`
        : `/vocabulary?languageId=${languageId}`;
      vocabulary.value = await api.get(endpoint);
    } catch (err: any) {
      error.value = err.message;
    }
  }

  async function fetchFlashcards(languageId: number, count: number = 20) {
    try {
      return await api.get(`/vocabulary/flashcards/${languageId}?count=${count}`);
    } catch (err: any) {
      error.value = err.message;
      throw err;
    }
  }

  return {
    languages,
    courses,
    currentCourse,
    lessons,
    currentLesson,
    exercises,
    vocabulary,
    progress,
    progressSummary,
    achievements,
    leaderboard,
    recommendations,
    loading,
    error,
    fetchLanguages,
    fetchCourses,
    fetchCourse,
    fetchLessons,
    fetchLesson,
    submitExercise,
    updateLessonProgress,
    fetchProgress,
    fetchAchievements,
    checkAchievements,
    fetchLeaderboard,
    fetchRecommendations,
    fetchVocabulary,
    fetchFlashcards,
  };
});
