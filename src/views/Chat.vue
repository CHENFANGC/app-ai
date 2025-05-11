<template>
  <div class="chat-list">
    <van-nav-bar title="聊天列表" fixed />

    <div class="content">
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list
          :loading="loading"
          @update:loading="loading = $event"
          :finished="finished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <van-cell
            v-for="chat in chatList"
            :key="chat.id"
            :title="chat.title"
            :label="chat.lastMessage || '暂无消息'"
            is-link
            @click="goToChat(chat.id)"
          >
            <template #icon>
              <van-badge :content="chat.unreadCount || ''" :show-zero="false">
                <van-image
                  round
                  width="40"
                  height="40"
                  :src="
                    chat.avatar ||
                    'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
                  "
                />
              </van-badge>
            </template>
          </van-cell>
        </van-list>
      </van-pull-refresh>
    </div>

    <van-button
      type="primary"
      icon="plus"
      class="new-chat-btn"
      round
      @click="createNewChat"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { showToast, showDialog } from "vant";
import { getChatList, createChat } from "../api/chat";

const router = useRouter();
const chatList = ref([]);
const loading = ref(false);
const finished = ref(false);
const refreshing = ref(false);

const fetchChatList = async () => {
  try {
    // 实际项目中应该调用API
    // const { data } = await getChatList()
    // 模拟数据
    const data = [
      {
        id: 1,
        title: "客服小王",
        lastMessage: "您好，有什么可以帮助您的？",
        unreadCount: 2,
        avatar: "",
      },
      {
        id: 2,
        title: "技术支持",
        lastMessage: "问题已解决",
        unreadCount: 0,
        avatar: "",
      },
      {
        id: 3,
        title: "产品咨询",
        lastMessage: "感谢您的咨询",
        unreadCount: 1,
        avatar: "",
      },
    ];
    chatList.value = data;
    finished.value = true;
  } catch (error) {
    showToast("获取聊天列表失败");
    console.error(error);
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

const onLoad = () => {
  fetchChatList();
};

const onRefresh = () => {
  finished.value = false;
  loading.value = true;
  fetchChatList();
};

const goToChat = (chatId) => {
  router.push(`/chat/${chatId}`);
};

const createNewChat = () => {
  showDialog({
    title: "新建聊天",
    message: "请输入聊天标题",
    showCancelButton: true,
    confirmButtonText: "创建",
    // 移除 beforeClose 回调
    // beforeClose: (action, done) => {
    //   if (action === 'confirm') {
    //     // 实际项目中应该调用API
    //     // createChat(title).then(res => {
    //     //   router.push(`/chat/${res.data.id}`)
    //     //   done()
    //     // })

    //     // 模拟创建成功
    //     setTimeout(() => {
    //       router.push(`/chat/new-${Date.now()}`)
    //       // Check if done is a function before calling it
    //       if (typeof done === 'function') {
    //         done()
    //       }
    //     }, 500)
    //   } else {
    //     // Check if done is a function before calling it
    //     if (typeof done === 'function') {
    //       done()
    //     }
    //   }
    // }
    // 使用 Promise 方式处理确认和取消操作
  })
    .then((action) => {
      if (action === "confirm") {
        // 实际项目中应该调用API
        // createChat(title).then(res => {
        //   router.push(`/chat/${res.data.id}`)
        // })

        // 模拟创建成功
        setTimeout(() => {
          router.push(`/chat/new-${Date.now()}`);
        }, 500);
      }
    })
    .catch((err) => {
      console.error("Dialog error:", err);
    });
};

onMounted(() => {
  fetchChatList();
});
</script>

<style scoped>
.chat-list {
  padding-top: 46px;
  min-height: 100vh;
  background-color: #f7f8fa;
}

.content {
  padding-bottom: 80px;
}

.new-chat-btn {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 50px;
  height: 50px;
}
</style>