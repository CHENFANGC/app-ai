<template>
  <div class="voice-reader" v-if="enabled">
    <van-button 
      :class="['voice-btn', { 'playing': isPlaying }]" 
      size="small" 
      icon="volume-o" 
      @click="togglePlay"
    >
      {{ isPlaying ? '暂停朗读' : '朗读内容' }}
    </van-button>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  text: {
    type: String,
    default: ''
  },
  autoPlay: {
    type: Boolean,
    default: false
  },
  streamMode: {
    type: Boolean,
    default: false
  },
  streamText: {
    type: String,
    default: ''
  },
  enabled: {
    type: Boolean,
    default: true
  }
});

const isPlaying = ref(false);
const speechSynthesis = window.speechSynthesis;
let utterance = null;
let currentPosition = 0;

// 初始化语音合成
const initSpeech = (text) => {
  if (utterance) {
    speechSynthesis.cancel();
  }
  
  utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'zh-CN';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  
  utterance.onend = () => {
    isPlaying.value = false;
  };
  
  utterance.onerror = (event) => {
    console.error('语音合成错误:', event);
    isPlaying.value = false;
  };
};

// 播放/暂停切换
const togglePlay = () => {
  if (isPlaying.value) {
    pauseSpeech();
  } else {
    playSpeech();
  }
};

// 播放语音
const playSpeech = () => {
  if (!props.text && !props.streamText) return;
  
  if (props.streamMode) {
    // 流式模式下，从当前位置开始朗读
    const textToRead = props.streamText.substring(currentPosition);
    if (textToRead) {
      initSpeech(textToRead);
      speechSynthesis.speak(utterance);
      isPlaying.value = true;
      currentPosition = props.streamText.length;
    }
  } else {
    // 普通模式下，朗读全部文本
    initSpeech(props.text);
    speechSynthesis.speak(utterance);
    isPlaying.value = true;
  }
};

// 暂停语音
const pauseSpeech = () => {
  speechSynthesis.cancel();
  isPlaying.value = false;
};

// 监听流式文本变化
watch(() => props.streamText, (newText, oldText) => {
  if (props.streamMode && isPlaying.value && newText !== oldText) {
    // 如果正在播放且文本有更新，则朗读新增部分
    const newContent = newText.substring(currentPosition);
    if (newContent) {
      initSpeech(newContent);
      speechSynthesis.speak(utterance);
      currentPosition = newText.length;
    }
  }
});

// 监听普通文本变化
watch(() => props.text, (newText) => {
  if (!props.streamMode && newText) {
    initSpeech(newText);
    if (props.autoPlay) {
      speechSynthesis.speak(utterance);
      isPlaying.value = true;
    }
  }
});

// 监听 enabled 属性变化
watch(() => props.enabled, (newValue) => {
  if (!newValue && isPlaying.value) {
    pauseSpeech();
  }
});

// 组件挂载时
onMounted(() => {
  if (props.autoPlay && (props.text || props.streamText)) {
    playSpeech();
  }
});

// 组件卸载前
onBeforeUnmount(() => {
  if (speechSynthesis) {
    speechSynthesis.cancel();
  }
});
</script>

<style scoped>
.voice-reader {
  margin: 8px 0;
  display: flex;
  justify-content: flex-end;
}

.voice-btn {
  display: flex;
  align-items: center;
  background-color: #f0f9ff;
  color: #1989fa;
  border: 1px solid #d0e8ff;
}

.voice-btn.playing {
  background-color: #e6f7ff;
  color: #0076e4;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}
</style>