<template>
  <div class="chat-detail">
    <van-nav-bar
      :title="chatInfo.title || '聊天'"
      left-arrow
      @click-left="onClickLeft"
    >
      <!-- 添加右侧语音播报按钮 -->
      <template #right>
        <div class="voice-button" @click="toggleVoicePlayback">
          <van-icon
            :name="isVoiceEnabled ? 'volume' : 'volume-o'"
            size="20"
            :class="{ 'voice-active': isVoiceEnabled }"
          />
        </div>
      </template>
    </van-nav-bar>
    <!-- <Text
      :answer="children.answer"
      :tjyDataType="children.tjyDataType"
      :queryLocalId="item.queryLocalId"
      :openSearchReference="openSearchReference"
      v-if="
        children.tjyDataType == 'text' || children.tjyDataType == 'deepseekR1'
      "
    /> -->
    <div class="message-list" ref="messageListRef">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <div class="messages-container">
          <div
            v-for="(message, index) in messages"
            :key="index"
            :class="[
              'message-item',
              message.isMe ? 'message-right' : 'message-left',
            ]"
          >
            <van-image
              round
              width="40"
              height="40"
              :src="
                message.avatar ||
                'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
              "
            />
            <div class="message-content">
              <!-- 在非用户消息前添加联网搜索链接 -->
              <search-links
                v-if="
                  !message.isMe &&
                  message.searchResults &&
                  message.searchResults.length > 0
                "
                :content="message.content"
                @click="openPopup"
              />
              <div class="message-bubble">
                <div
                  v-if="message.videos && message.videos.length > 0"
                  class="message-videos"
                >
                  <div
                    v-for="(video, vIndex) in message.videos"
                    :key="vIndex"
                    class="video-item"
                  >
                    <div class="video-container">
                      <video
                        controls
                        :src="video.url"
                        :poster="
                          video.poster ||
                          'https://img.zcool.cn/community/01a9f55d145660a8012051cdb52093.png@1280w_1l_2o_100sh.png'
                        "
                        class="video-player"
                      ></video>
                      <div class="video-badge">{{ vIndex + 1 }}</div>
                    </div>
                    <div class="video-title">{{ video.title }}</div>
                  </div>
                </div>
                <div v-if="message.content || message.streamContent">
                  {{ message.streamContent || message.content }}
                  <span
                    v-if="message.videos && message.videos.length > 0"
                    class="video-references"
                  >
                    <span
                      v-for="(video, vIndex) in message.videos"
                      :key="vIndex"
                      class="video-reference"
                      @click="openVideoReference(video)"
                    >
                      [视频{{ vIndex + 1 }}]
                    </span>
                  </span>
                  <!-- 添加搜索结果引用角标 -->
                  <span
                    v-if="
                      message.searchResults && message.searchResults.length > 0
                    "
                    class="search-references"
                  >
                    <span
                      v-for="(result, rIndex) in message.searchResults"
                      :key="rIndex"
                      class="search-reference"
                      @click="openSearchReference(result)"
                    >
                      {{ result.badge || rIndex + 1 }}
                    </span>
                  </span>
                </div>
              </div>
              <!-- 为非用户消息添加语音朗读功能 -->
              <voice-reader
                v-if="!message.isMe"
                :text="message.content"
                :stream-mode="message.isStreaming"
                :stream-text="message.streamContent || message.content"
                :auto-play="message.autoPlay && isVoiceEnabled"
                :enabled="isVoiceEnabled"
              />
              <div class="message-time">{{ message.time }}</div>
            </div>
          </div>
        </div>
      </van-pull-refresh>
    </div>

    <!-- 修改 Popup 组件的使用 -->
    <popup
      :show="showPopup"
      @update:show="showPopup = $event"
      :search-data="searchData"
    />

    <div class="message-input">
      <van-field
        v-model="messageText"
        placeholder="请输入消息"
        :border="false"
        :autofocus="true"
        @keypress.enter.prevent="sendMessage"
      >
        <template #button>
          <van-button
            size="small"
            type="primary"
            :disabled="!messageText.trim()"
            @click="sendMessage"
          >
            发送
          </van-button>
        </template>
      </van-field>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { showToast } from "vant";
import Popup from "../components/Popup.vue";
import VoiceReader from "../components/VoiceReader.vue";
import SearchLinks from "../components/SearchLinks.vue";
import Text from "../components/Text.vue";
import searchResultsData from "../assets/searchResults.json";

const route = useRoute();
const router = useRouter();
const chatId = computed(() => route.params.id);
const chatInfo = ref({});
const messages = ref([]);
const messageText = ref("");
const refreshing = ref(false);
const messageListRef = ref(null);

// 添加 Popup 相关状态
const showPopup = ref(false);
const currentSearchText = ref("");
const currentSearchResult = ref(null);
// 添加当前使用的搜索结果数据
const currentSearchResultsData = ref(null);

// 打开 Popup 的方法
const openPopup = (data) => {
  console.log("Opening Popup with data:", data);
  // 如果传入的是字符串，直接使用
  if (typeof data === "string") {
    currentSearchText.value = data;
    // 使用全局搜索结果数据
    currentSearchResultsData.value = searchResultsData;
  } else {
    // 为了兼容性，如果仍然传入对象，也能处理
    currentSearchText.value = data;
    // 使用全局搜索结果数据
    currentSearchResultsData.value = searchResultsData;
  }
  currentSearchResult.value = null;
  showPopup.value = true;
};

// 打开视频引用的方法
const openVideoReference = (video) => {
  // 这里可以实现视频引用的详细展示逻辑
  showToast(`正在查看视频: ${video.title}`);
};

// 打开搜索结果引用的方法
const openSearchReference = (result) => {
  // 使用已导入的数据
  const fullResult = searchResultsData.search_results[result.index || 0];
  console.log("Opening Search Reference with data:", fullResult);
  
  if (fullResult) {
    // 设置完整的搜索结果对象
    currentSearchResult.value = fullResult;
    // 设置一个标记，表示这是从角标打开的
    currentSearchResult.value.fromReference = true;
    
    // 先设置搜索结果，再显示弹窗，确保弹窗显示时能正确处理搜索结果
    showPopup.value = true;
  } else {
    showToast("未找到相关搜索结果");
  }
};

const fetchChatDetail = async () => {
  try {
    // 实际项目中应该调用API
    // const { data } = await getChatDetail(chatId.value)
    // 模拟数据
    const data = {
      id: chatId.value,
      title: `聊天 ${chatId.value}`,
      messages: [
        {
          id: 1,
          content: "您好，有什么可以帮助您的？",
          isMe: false,
          time: "10:00",
          avatar: "",
        },
        {
          id: 2,
          content: "我想咨询一下产品信息",
          isMe: true,
          time: "10:01",
          avatar: "",
        },
        // 已移除 "好的，请问您想了解哪方面的信息呢？" 的消息
      ],
    };
    chatInfo.value = data;
    messages.value = data.messages;

    // 滚动到底部
    scrollToBottom();
  } catch (error) {
    showToast("获取聊天详情失败");
    console.error(error);
  } finally {
    refreshing.value = false;
  }
};

const onRefresh = () => {
  fetchChatDetail();
};

const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      const scrollElement = messageListRef.value;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  });
};

// 添加语音播报状态
const isVoiceEnabled = ref(false);

// 切换语音播报状态
const toggleVoicePlayback = () => {
  isVoiceEnabled.value = !isVoiceEnabled.value;
  if (isVoiceEnabled.value) {
    showToast("语音播报已开启");
  } else {
    showToast("语音播报已关闭");
    // 停止所有正在播放的语音
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  // 可以选择将用户偏好保存到本地存储
  localStorage.setItem(
    "voicePlaybackEnabled",
    isVoiceEnabled.value ? "1" : "0"
  );
};

// 在组件挂载时读取用户偏好
onMounted(() => {
  fetchChatDetail();

  // 从本地存储读取语音播报设置
  const savedVoicePreference = localStorage.getItem("voicePlaybackEnabled");
  if (savedVoicePreference !== null) {
    isVoiceEnabled.value = savedVoicePreference === "1";
  }
});

// 保持组件内方法名不变
const sendMessage = async () => {
  if (!messageText.value.trim()) return;

  const newMessage = {
    id: Date.now(),
    content: messageText.value,
    isMe: true,
    time: new Date().toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    avatar: "",
  };

  messages.value.push(newMessage);
  const sentMessage = messageText.value;
  messageText.value = "";

  // 滚动到底部
  scrollToBottom();

  try {
    // 创建模拟的搜索结果数据，包含随机数字的角标
    const searchResultsData = [
      {
        title: "搜索结果1",
        url: "https://example.com/result1",
        snippet: "这是第一个搜索结果的摘要内容...",
        index: 0,
        badge: Math.floor(Math.random() * 10) + 1,
        site: "example.com",
        date: new Date().toLocaleDateString(),
        passage: "这是第一个搜索结果的详细内容...",
      },
      {
        title: "搜索结果2",
        url: "https://example.com/result2",
        snippet: "这是第二个搜索结果的摘要内容...",
        index: 1,
        badge: Math.floor(Math.random() * 10) + 10,
        site: "example.com",
        date: new Date().toLocaleDateString(),
        passage: "这是第二个搜索结果的详细内容...",
      },
    ];

    // 创建一个回复消息对象，初始内容为空字符串而不是null或undefined
    const replyMessage = {
      id: Date.now() + 1,
      content: "", // 初始为空，稍后会通过流式更新
      streamContent: "", // 初始为空，稍后会通过流式更新
      isMe: false,
      isStreaming: true,
      autoPlay: true,
      time: new Date().toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      avatar: "",
      videos: [],
      // 先添加搜索结果数据，确保搜索链接立即显示
      searchResults: searchResultsData,
    };

    // 先添加消息到列表
    messages.value.push(replyMessage);
    scrollToBottom();

    // 模拟流式返回的完整内容
    const fullResponse = `您发送的是: "${sentMessage}"，我们会尽快处理您的请求。请查看以下相关视频：`;

    // 模拟视频数据
    const videoData = [
      {
        url: "https://media.w3.org/2010/05/sintel/trailer.mp4",
        title: "示例视频1 - Sintel预告片",
        poster:
          "https://img01.51jobcdn.com/im/images/2016/08/04/sunny_liqingping_1470285472.jpg",
      },
      {
        url: "https://media.w3.org/2010/05/bunny/trailer.mp4",
        title: "示例视频2 - Big Buck Bunny预告片",
        poster: "https://img95.699pic.com/photo/50055/5561.jpg_wh300.jpg",
      },
    ];

    // 短暂延迟后开始流式输出，确保搜索链接已经渲染
    setTimeout(() => {
      // 模拟流式返回
      let currentIndex = 0;
      const streamInterval = setInterval(() => {
        if (currentIndex < fullResponse.length) {
          // 每次添加一个字符
          currentIndex++;
          replyMessage.streamContent = fullResponse.substring(0, currentIndex);
          replyMessage.content = replyMessage.streamContent;

          // 强制更新视图
          messages.value = [...messages.value];
          scrollToBottom();
        } else {
          // 文本流完成后，添加视频
          clearInterval(streamInterval);
          replyMessage.isStreaming = false;
          replyMessage.content = fullResponse;
          replyMessage.videos = videoData;

          // 强制更新视图
          messages.value = [...messages.value];
          scrollToBottom();
        }
      }, 100); // 每100毫秒添加一个字符
    }, 300); // 延迟300毫秒开始流式输出
  } catch (error) {
    showToast("发送消息失败");
    console.error(error);
  }
};

const onClickLeft = () => {
  router.back();
};

onMounted(() => {
  fetchChatDetail();
});
</script>

<style scoped>
.chat-detail {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f7f8fa;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  margin-top: 46px;
  margin-bottom: 56px;
}

.messages-container {
  display: flex;
  flex-direction: column;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
  align-items: flex-start;
}

.message-left {
  align-self: flex-start;
}

.message-right {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message-content {
  margin: 0 12px;
  max-width: 70%;
}

.message-bubble {
  padding: 10px 12px;
  border-radius: 8px;
  word-break: break-word;
}

.message-left .message-bubble {
  background-color: #fff;
}

.message-right .message-bubble {
  background-color: #07c160;
  color: #fff;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  text-align: center;
}

.message-input {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 8px;
  border-top: 1px solid #eee;
}

/* 添加联网搜索链接样式 */
.search-links {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #ff6b00;
  background-color: #fff8f0;
  padding: 4px 8px;
  border-radius: 12px;
  margin-bottom: 4px;
  cursor: pointer;
}

.search-links .van-icon {
  margin-right: 4px;
}

.search-links .van-icon:last-child {
  margin-left: 4px;
  margin-right: 0;
}

/* 视频相关样式 */
.message-videos {
  margin-bottom: 10px;
}

.video-item {
  margin-bottom: 8px;
}

.video-container {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.video-player {
  width: 100%;
  border-radius: 8px;
  display: block;
  background-color: #000; /* 视频背景色 */
  object-fit: contain; /* 保持封面图片比例 */
}

.video-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.video-title {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.video-references {
  display: inline-block;
  margin-left: 5px;
}

.video-reference {
  color: #1989fa;
  font-size: 12px;
  margin-right: 5px;
  cursor: pointer;
  background-color: #f0f9ff;
  padding: 2px 5px;
  border-radius: 10px;
}

/* 添加搜索结果引用样式 */
.search-references {
  display: inline-block;
  margin-left: 5px;
}

.search-reference {
  color: #ff6b00;
  font-size: 12px;
  margin-right: 5px;
  cursor: pointer;
  background-color: #fff8f0;
  padding: 2px 5px;
  border-radius: 10px;
}

/* 语音按钮样式 */
.voice-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  cursor: pointer;
}

.voice-active {
  color: #1989fa;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}
</style>

// 添加一个统一的搜索数据对象
const searchData = ref({
  text: "",
  result: null,
  results: searchResultsData
});

// 简化 openPopup 方法
const openPopup = () => {
  console.log("Opening Popup");
  // 重置搜索结果，保留搜索结果集
  searchData.value = {
    text: "",
    result: null,
    results: searchResultsData
  };
  showPopup.value = true;
};

// 简化 openSearchReference 方法
const openSearchReference = (result) => {
  const fullResult = searchResultsData.search_results[result.index || 0];
  console.log("Opening Search Reference with data:", fullResult);
  
  if (fullResult) {
    // 设置完整的搜索结果对象
    searchData.value = {
      text: "",
      result: { ...fullResult, fromReference: true },
      results: searchResultsData
    };
    
    showPopup.value = true;
  } else {
    showToast("未找到相关搜索结果");
  }
};