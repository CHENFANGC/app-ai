<template>
  <div class="search-links" @click="handleClick">
    <van-icon name="search" />
    <span>已搜索到 {{ searchCount }} 个网页</span>
    <van-icon name="arrow" />
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  content: {
    type: Array,
    default: () => [],
  },
});

const emits = defineEmits(["click"]);

// 返回从props传入的content数组的长度
const searchCount = computed(() => {
  return props.content ? props.content.length : 0;
});

const handleClick = () => {
  emits("click", props.content);
};
</script>

<style scoped>
.search-links {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #ff8c00;
  background-color: #fff5e6;
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
</style>