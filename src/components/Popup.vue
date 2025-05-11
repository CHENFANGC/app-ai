<template>
  <van-popup
    v-model:show="showPopup"
    position="bottom"
    :style="{ height: popupHeight }"
    round
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <div class="popup-container">
      <div class="popup-header" @touchstart.stop="handleTouchStart" @touchmove.stop="handleTouchMove" @touchend.stop="handleTouchEnd">
        <div class="popup-title">
          {{ detailMode ? "搜索详情" : "搜索结果" }}
        </div>
        <van-icon name="cross" @click="closePopup" />
      </div>

      <!-- 搜索结果列表 -->
      <div v-if="!detailMode" class="search-results">
        <template v-if="searchResults.length > 0">
          <div
            v-for="(result, index) in searchResults"
            :key="index"
            class="result-item"
            @click="showDetail(result)"
          >
            <div class="result-content">
              <div class="result-meta">
                <img
                  v-if="result.favicon"
                  :src="result.favicon"
                  class="site-favicon"
                />
                <span class="result-site">{{ result.site }}</span>
                <span class="result-date">{{ result.date }}</span>
              </div>
              <div class="result-title">{{ result.title }}</div>
              <div class="result-passage">{{ result.passage }}</div>
            </div>
            <div class="result-index">{{ index + 1 }}</div>
          </div>
        </template>
        <div v-else class="no-results">
          <van-empty description="暂无搜索结果" />
        </div>
      </div>

      <!-- 单个搜索结果详情 -->
      <div v-else class="search-result-detail">
        <!-- 当有URL时，使用iframe嵌入显示 -->
        <iframe
          v-if="currentDetail.url"
          :src="currentDetail.url"
          class="embedded-iframe"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>

        <!-- 当没有URL时，显示原有的详情内容 -->
        <template v-else>
          <div class="result-meta">
            <img
              v-if="currentDetail.favicon"
              :src="currentDetail.favicon"
              class="site-favicon"
            />
            <span class="result-site">{{ currentDetail.site }}</span>
            <span class="result-date">{{ currentDetail.date }}</span>
          </div>
          <div class="result-title">{{ currentDetail.title }}</div>
          <div class="result-passage">{{ currentDetail.passage }}</div>

          <!-- 显示图片 -->
          <div
            v-if="currentDetail.images && currentDetail.images.length > 0"
            class="result-images"
          >
            <img
              v-for="(image, imgIndex) in currentDetail.images"
              :key="imgIndex"
              :src="image"
              class="result-image"
              @click="previewImage(image)"
            />
          </div>
        </template>
      </div>
      <div class="result-url-container">
        <van-button
          type="primary"
          size="small"
          @click="openUrl(currentDetail.url)"
          class="open-url-button"
        >
          打开原网页
        </van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { showToast, showImagePreview } from "vant";

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  searchText: {
    type: String,
    default: "",
  },
  searchResult: {
    type: Object,
    default: null,
  },
  // 保留 searchResultsData prop，但简化其使用
  searchResultsData: {
    type: Object,
    default: () => ({ search_results: [] }),
  },
});

const emit = defineEmits(["update:show", "update:searchResult"]);

const showPopup = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value),
});

// 搜索结果数据
const searchResults = ref([]);
// 加载状态
const loading = ref(false);
// 详情模式标志
const detailMode = ref(false);
// 当前查看的详情
const currentDetail = ref({});

// 预览图片
const previewImage = (image) => {
  showImagePreview({
    images: [image],
    closeable: true,
  });
};

// 关闭弹窗
const closePopup = () => {
  // 如果在详情模式，且不是从引用打开的，则返回到结果列表
  if (detailMode.value && !currentDetail.value.fromReference) {
    backToResults();
  } else {
    // 否则关闭整个弹窗
    showPopup.value = false;
    // 重置状态
    resetState();
  }
};

// 重置状态
const resetState = () => {
  detailMode.value = false;
  currentDetail.value = {};
};

// 显示详情
const showDetail = (result) => {
  currentDetail.value = result;
  detailMode.value = true;
  showToast(`正在查看: ${result.title}`);
};

// 返回搜索结果列表
const backToResults = () => {
  // 如果是从引用打开的，则直接关闭弹窗
  if (currentDetail.value.fromReference) {
    showPopup.value = false;
    resetState();
  } else {
    // 否则返回到结果列表，但保持原来的高度状态
    detailMode.value = false;
    currentDetail.value = {};
    // 不重置 isExpanded，保持原来的高度状态
  }
};

// 打开URL
const openUrl = (url) => {
  // 在实际应用中，这里可以使用window.open或其他方式打开URL
  showToast(`正在打开: ${url}`);
  window.open(url, "_blank");
};

// 从JSON文件获取搜索结果
// const fetchSearchResults = async (query) => {
//   loading.value = true;
//   searchResults.value = []; // 清空现有结果

//   try {
//     // 直接使用传入的数据
//     const results = props.searchResultsData.search_results || [];

//     // 可以根据 query 进行过滤，如果需要的话
//     // const filteredResults = results.filter(result =>
//     //   result.title.includes(query) || result.passage.includes(query)
//     // );

//     searchResults.value = results;
//   } catch (error) {
//     console.error("获取搜索结果失败", error);
//   } finally {
//     loading.value = false;
//   }
// };

// 监听搜索文本变化
watch(
  () => props.searchText,
  (newVal) => {
    if (newVal) {
      // 重置状态
      resetState();
      // 获取搜索结果
      fetchSearchResults(newVal);
    }
  },
  { immediate: true }
);

// 监听searchResult变化
watch(
  () => props.searchResult,
  (newVal) => {
    if (newVal) {
      // 如果直接传入了搜索结果，则直接显示详情
      currentDetail.value = newVal;
      detailMode.value = true;

      // 确保currentDetail包含必要的字段
      if (!currentDetail.value.site && currentDetail.value.title) {
        currentDetail.value.site =
          currentDetail.value.title.split(" - ")[0] || "未知来源";
      }

      if (!currentDetail.value.date) {
        currentDetail.value.date = new Date().toLocaleDateString();
      }

      // 如果有snippet但没有passage，使用snippet作为passage
      if (!currentDetail.value.passage && currentDetail.value.snippet) {
        currentDetail.value.passage = currentDetail.value.snippet;
      }

      // 确保有URL
      if (!currentDetail.value.url && currentDetail.value.link) {
        currentDetail.value.url = currentDetail.value.link;
      }
    }
  },
  { immediate: true } // 添加 immediate: true，确保组件初始化时也会执行
);

// 删除以下 watch 函数，因为没有定义 searchData prop
// 监听搜索数据变化
// watch(
//   () => props.searchData,
//   (newVal) => {
//     if (newVal.result) {
//       // 如果有搜索结果，直接显示详情
//       currentDetail.value = newVal.result;
//       detailMode.value = true;

//       // 确保currentDetail包含必要的字段
//       if (!currentDetail.value.site && currentDetail.value.title) {
//         currentDetail.value.site =
//           currentDetail.value.title.split(" - ")[0] || "未知来源";
//       }

//       if (!currentDetail.value.date) {
//         currentDetail.value.date = new Date().toLocaleDateString();
//       }

//       // 如果有snippet但没有passage，使用snippet作为passage
//       if (!currentDetail.value.passage && currentDetail.value.snippet) {
//         currentDetail.value.passage = currentDetail.value.snippet;
//       }

//       // 确保有URL
//       if (!currentDetail.value.url && currentDetail.value.link) {
//         currentDetail.value.url = currentDetail.value.link;
//       }
//     } else if (newVal.text && !detailMode.value) {
//       // 当有搜索文本但不是详情模式时，获取搜索结果
//       fetchSearchResults(newVal.text);
//     } else if (newVal.results && newVal.results.search_results) {
//       // 直接使用提供的搜索结果
//       searchResults.value = newVal.results.search_results;
//     }
//   },
//   { deep: true, immediate: true }
// );

// 恢复原来的 fetchSearchResults 方法
const fetchSearchResults = async (query) => {
  loading.value = true;
  searchResults.value = []; // 清空现有结果

  try {
    // 直接使用传入的数据
    const results = props.searchResultsData?.search_results || [];

    // 添加调试信息
    console.log("搜索结果数据:", props.searchResultsData);
    console.log("处理后的搜索结果:", results);

    // 如果结果为空，添加一个测试数据以验证显示逻辑
    if (results.length === 0) {
      searchResults.value = [
        {
          title: "测试搜索结果",
          site: "测试网站",
          date: new Date().toLocaleDateString(),
          passage:
            "这是一个测试搜索结果，用于验证搜索结果显示功能是否正常工作。",
          url: "https://example.com",
        },
      ];
    } else {
      searchResults.value = results;
    }
  } catch (error) {
    console.error("获取搜索结果失败", error);
    // 添加错误处理，显示错误信息
    searchResults.value = [
      {
        title: "搜索出错",
        site: "错误信息",
        date: new Date().toLocaleDateString(),
        passage: `搜索过程中发生错误: ${error.message}`,
        url: "",
      },
    ];
  } finally {
    loading.value = false;
  }
};

// 监听show变化
watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      if (props.searchResult) {
        // 如果有传入的搜索结果，则直接显示详情
        currentDetail.value = props.searchResult;
        detailMode.value = true;

        // 确保currentDetail包含必要的字段
        if (!currentDetail.value.site && currentDetail.value.title) {
          currentDetail.value.site =
            currentDetail.value.title.split(" - ")[0] || "未知来源";
        }

        if (!currentDetail.value.date) {
          currentDetail.value.date = new Date().toLocaleDateString();
        }

        // 如果有snippet但没有passage，使用snippet作为passage
        if (!currentDetail.value.passage && currentDetail.value.snippet) {
          currentDetail.value.passage = currentDetail.value.snippet;
        }

        // 确保有URL
        if (!currentDetail.value.url && currentDetail.value.link) {
          currentDetail.value.url = currentDetail.value.link;
        }
      } else if (props.searchText && !detailMode.value) {
        // 当弹窗显示且有搜索文本但不是详情模式时，获取搜索结果
        console.log("弹窗显示，搜索文本:", props.searchText);
        fetchSearchResults(props.searchText);
      } else {
        // 如果没有搜索文本和搜索结果，但弹窗显示，也尝试获取搜索结果
        console.log("弹窗显示，但没有搜索文本和搜索结果");
        fetchSearchResults("");
      }
    }
  },
  { immediate: true } // 添加 immediate: true，确保组件初始化时也会执行
);

// 组件挂载时
onMounted(() => {
  if (props.searchResult) {
    // 如果有传入的搜索结果，则直接显示详情
    currentDetail.value = props.searchResult;
    detailMode.value = true;
  } else if (props.searchText) {
    // 如果有搜索文本，则获取搜索结果
    fetchSearchResults(props.searchText);
  }
});

// 添加弹窗高度相关逻辑
const isExpanded = ref(false);
const touchStartY = ref(0);
const popupHeightPercent = ref(60); // 初始高度百分比
const isDragging = ref(false);

// 计算弹窗高度
const popupHeight = computed(() => {
  // 详情模式固定为90%
  if (detailMode.value) {
    return "90%";
  }
  // 列表模式根据拖拽高度决定
  return `${popupHeightPercent.value}%`;
});

// 处理触摸开始事件
const handleTouchStart = (event) => {
  // 只在列表模式下处理
  if (detailMode.value) return;
  
  // 记录起始位置
  touchStartY.value = event.touches[0].clientY;
  isDragging.value = true;
};

// 处理触摸移动事件
const handleTouchMove = (event) => {
  // 只在列表模式下且正在拖拽时处理
  if (detailMode.value || !isDragging.value) return;

  // 获取当前触摸点的Y坐标
  const currentY = event.touches[0].clientY;
  
  // 计算移动距离（向上为正，向下为负）
  const deltaY = touchStartY.value - currentY;
  
  // 计算屏幕高度
  const screenHeight = window.innerHeight;
  
  // 计算移动距离对应的百分比变化（移动屏幕高度的10%对应弹窗高度变化10%）
  const percentChange = (deltaY / screenHeight) * 100;
  
  // 计算新的高度百分比，限制在60%到90%之间
  let newHeightPercent = popupHeightPercent.value + percentChange;
  newHeightPercent = Math.max(60, Math.min(90, newHeightPercent));
  
  // 更新高度百分比
  popupHeightPercent.value = newHeightPercent;
  
  // 更新起始位置，实现连续拖拽
  touchStartY.value = currentY;
};

// 处理触摸结束事件
const handleTouchEnd = () => {
  // 只在列表模式下处理
  if (detailMode.value) return;
  
  // 结束拖拽
  isDragging.value = false;
  
  // 根据当前高度决定是否展开
  isExpanded.value = popupHeightPercent.value > 75;
  
  // 根据是否展开，平滑过渡到60%或90%
  popupHeightPercent.value = isExpanded.value ? 90 : 60;
};

// 监听详情模式变化
watch(detailMode, (newVal) => {
  // 当进入详情模式时，保存当前的展开状态，而不是重置它
  if (newVal) {
    // 保存当前状态，不做修改
  }
});

// 监听弹窗显示状态
watch(showPopup, (newVal) => {
  // 当弹窗关闭时，重置所有状态
  if (!newVal) {
    isExpanded.value = false;
    touchStartY.value = 0;
    popupHeightPercent.value = 60;
    isDragging.value = false;
  }
});
</script>

<style scoped>
.popup-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px 16px 0;
}

.popup-title {
  font-size: 18px;
  font-weight: bold;
}

.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px;
}

.result-item {
  display: flex;
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  justify-content: space-between;
  align-items: flex-start;
}

.result-item:hover {
  background-color: #f9f9f9;
}

.result-index {
  color: #ff6b00;
  font-size: 12px;
  margin-left: 12px;
  flex-shrink: 0;
  background-color: #fff8f0;
  padding: 2px 5px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-content {
  flex: 1;
}

.result-title {
  font-weight: bold;
  margin-bottom: 4px;
  color: #000;
}

.result-meta {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.site-favicon {
  width: 16px;
  height: 16px;
  margin-right: 4px;
  border-radius: 2px;
}

.result-site {
  margin-right: 8px;
}

.result-date {
  color: #999;
}

.result-passage {
  font-size: 14px;
  color: #999;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.search-result-detail {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin: 0 16px;
  overflow-y: auto;
  flex: 1;
}

.search-result-detail .result-title {
  font-size: 18px;
  margin-bottom: 8px;
  color: #000;
}

.search-result-detail .result-passage {
  margin: 12px 0;
  line-height: 1.5;
  color: #333;
  display: block;
  -webkit-line-clamp: unset;
}

/* 添加嵌入iframe的样式 */
.embedded-iframe {
  width: 100%;
  height: 100%;
  border: none;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

/* 确保search-result-detail在有iframe时是相对定位 */
.search-result-detail {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin: 0 16px;
  overflow-y: auto;
  flex: 1;
  position: relative;
}

.result-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}

.result-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}

.search-result-detail .van-button {
  margin-top: 16px;
}

.result-url-container {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

.open-url-button {
  width: 100%;
}

.no-results {
  padding: 20px;
  text-align: center;
}

/* 添加平滑过渡效果 */
.van-popup {
  transition: height 0.3s ease;
}

/* 添加拖动指示器 */
.popup-header::before {
  content: '';
  display: block;
  width: 40px;
  height: 4px;
  background-color: #e0e0e0;
  border-radius: 2px;
  margin: 0 auto 10px;
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
}

/* 调整标题位置，为拖动指示器留出空间 */
.popup-header {
  position: relative;
  padding-top: 24px;
}
</style>