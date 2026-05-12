<template>
  <div class="flashcards-page">
    <div class="page-header">
      <h1>单词卡练习</h1>
      <p>通过闪卡强化你的词汇记忆</p>
    </div>

    <div class="flashcard-controls">
      <div class="language-selector">
        <label>选择语言：</label>
        <select v-model="selectedLanguage" @change="loadFlashcards">
          <option v-for="lang in learningStore.languages" :key="lang.language_id" :value="lang.language_id">
            {{ lang.flag_emoji }} {{ lang.language_name }}
          </option>
        </select>
      </div>
      <div class="card-count">
        <label>卡片数量：</label>
        <select v-model="cardCount">
          <option :value="10">10 张</option>
          <option :value="20">20 张</option>
          <option :value="30">30 张</option>
        </select>
      </div>
      <button @click="loadFlashcards" class="load-btn">加载新卡片</button>
    </div>

    <div class="flashcard-container" v-if="currentCard" @click="flipCard">
      <div :class="['flashcard', { flipped: isFlipped }]">
        <div class="card-front">
          <div class="card-content">
            <p class="word">{{ currentCard.word }}</p>
            <p v-if="currentCard.pronunciation" class="pronunciation">{{ currentCard.pronunciation }}</p>
            <p class="hint">点击翻转查看答案</p>
          </div>
        </div>
        <div class="card-back">
          <div class="card-content">
            <p class="translation">{{ currentCard.translation }}</p>
            <p v-if="currentCard.part_of_speech" class="pos">{{ currentCard.part_of_speech }}</p>
            <div v-if="currentCard.example_sentences?.length" class="examples">
              <p class="example-title">例句：</p>
              <p v-for="(ex, idx) in currentCard.example_sentences" :key="idx" class="example">
                {{ ex }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="progress-indicator" v-if="flashcards.length > 0">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: ((currentIndex) / flashcards.length * 100) + '%' }"></div>
      </div>
      <p>{{ currentIndex }} / {{ flashcards.length }}</p>
    </div>

    <div class="navigation-buttons" v-if="flashcards.length > 0">
      <button @click="previousCard" :disabled="currentIndex === 0" class="nav-btn">← 上一张</button>
      <button @click="nextCard" class="nav-btn">下一张 →</button>
    </div>

    <div class="loading" v-if="loading">
      <div class="spinner"></div>
      <p>加载卡片中...</p>
    </div>

    <div class="empty-state" v-if="!loading && flashcards.length === 0">
      <p>选择语言开始练习</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useLearningStore } from '../stores/learning';

const learningStore = useLearningStore();

const selectedLanguage = ref<number | null>(null);
const cardCount = ref(20);
const flashcards = ref<any[]>([]);
const currentIndex = ref(0);
const isFlipped = ref(false);
const loading = ref(false);

const currentCard = computed(() => flashcards.value[currentIndex.value]);

async function loadFlashcards() {
  if (!selectedLanguage.value) return;

  loading.value = true;
  try {
    flashcards.value = await learningStore.fetchFlashcards(selectedLanguage.value, cardCount.value) as any[];
    currentIndex.value = 0;
    isFlipped.value = false;
  } catch (err) {
    console.error('Failed to load flashcards:', err);
  } finally {
    loading.value = false;
  }
}

function flipCard() {
  isFlipped.value = !isFlipped.value;
}

function nextCard() {
  if (currentIndex.value < flashcards.value.length - 1) {
    currentIndex.value++;
    isFlipped.value = false;
  }
}

function previousCard() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    isFlipped.value = false;
  }
}

onMounted(async () => {
  await learningStore.fetchLanguages();
  if (learningStore.languages.length > 0) {
    selectedLanguage.value = learningStore.languages[0].language_id;
    await loadFlashcards();
  }
});
</script>

<style scoped>
.flashcards-page {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 0.5rem;
}

.page-header p {
  color: #666;
  font-size: 1.1rem;
}

.flashcard-controls {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.language-selector,
.card-count {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.language-selector label,
.card-count label {
  font-weight: 500;
  color: #333;
}

select {
  padding: 0.6rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
}

.load-btn {
  padding: 0.7rem 1.5rem;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.3s;
}

.load-btn:hover {
  opacity: 0.9;
}

.flashcard-container {
  perspective: 1000px;
  margin-bottom: 2rem;
  cursor: pointer;
}

.flashcard {
  width: 100%;
  height: 400px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.6s;
}

.flashcard.flipped {
  transform: rotateY(180deg);
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.card-front {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-back {
  background: white;
  transform: rotateY(180deg);
  border: 2px solid #667eea;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  flex-direction: column;
  text-align: center;
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.word {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.pronunciation {
  font-size: 1.5rem;
  opacity: 0.9;
}

.hint {
  font-size: 1rem;
  opacity: 0.7;
  margin-top: 2rem;
}

.translation {
  font-size: 2.5rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 0.5rem;
}

.pos {
  font-size: 1.1rem;
  color: #666;
  font-style: italic;
}

.examples {
  margin-top: 1.5rem;
  text-align: left;
  width: 100%;
}

.example-title {
  font-weight: 600;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.example {
  color: #555;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 0.5rem;
}

.progress-indicator {
  margin-bottom: 1.5rem;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  transition: width 0.3s;
}

.progress-indicator p {
  text-align: center;
  color: #666;
  font-size: 0.95rem;
}

.navigation-buttons {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
}

.nav-btn {
  padding: 0.8rem 2rem;
  background: white;
  border: 2px solid #667eea;
  color: #667eea;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.nav-btn:hover:not(:disabled) {
  background: #667eea;
  color: white;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4facfe;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
