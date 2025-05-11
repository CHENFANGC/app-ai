<template>
  <div class="k-text">
    <!-- <div class="markdown-body" v-html="toMarked(answer)"></div> -->
    <!-- <div class="markdown-body" v-html="htmlRef"></div> -->
    <van-collapse
      v-model="activeNames"
      class="deepseekR1-title"
      v-if="tjyDataType == 'deepseekR1'"
    >
      <van-collapse-item
        class="markdown-body"
        name="1"
        :title="deepseekTitle"
        :icon="require('../assets/img/deepseekr1.png')"
      >
        <template v-for="(item, index) in htmlRef" :key="index">
          <div :id="item.id" :class="item.className" v-html="item.html"></div>
        </template>
      </van-collapse-item>
    </van-collapse>
    <div v-else class="markdown-body">
      <template v-for="(item, index) in htmlRef" :key="index">
        <div :id="item.id" :class="item.className" v-html="item.html"></div>
      </template>
    </div>
  </div>
</template>
<script setup>
import { computed, ref } from "vue";
import { useMainStore } from "../store/index";
import markedData from "../utils/js/footnote-extension.js";
const activeNames = ref(["1"]);
const { answer, queryLocalId, tjyDataType } = defineProps([
  "answer",
  "queryLocalId",
  "tjyDataType",
]);
const mainStore = useMainStore();

let deepseekTitle = ref("DeepSeek-R1深度思考 ");
let deepseekTime = ref(0);
let deepseekInterval = ref(null);
if (tjyDataType == "deepseekR1") {
  deepseekInterval.value = setInterval(() => {
    if (answer.indexOf("</think>") != -1 || mainStore.isLoading == false) {
      console.log(deepseekTime.value, "deepseekTime");
      let time =
        deepseekTime.value > 0
          ? parseFloat(deepseekTime.value / 1000).toFixed(1) + "s"
          : "";
      deepseekTitle.value = "DeepSeek-R1已深度思考 " + time;
      clearInterval(deepseekInterval.value);
    } else {
      deepseekTime.value += 100;
      deepseekTitle.value =
        "DeepSeek-R1深度思考 " +
        parseFloat(deepseekTime.value / 1000).toFixed(1) +
        "s";
    }
    // deepseekTitle.value = '深度思考 (DeepSeek R1)' +parseFloat( deepseekTime.value/1000).toFixed(1) + 'S'
  }, 100);
}
// 修改 tKopenWebView 方法，使其能够调用 openSearchReference 方法
const tKopenWebView = (e, url, name) => {
  console.log("12312跳转", url);
  e.preventDefault();
  
  // 如果传入了 openSearchReference 方法，则使用它打开网页
  if (openSearchReference) {
    // 创建一个搜索结果对象，模拟 openSearchReference 的参数格式
    const webResult = {
      title: name || (e && e.target ? e.target.innerHTML : "网页内容"),
      url: url,
      passage: "正在查看网页内容...",
      site: url.includes('://') ? new URL(url).hostname : '未知来源',
      date: new Date().toLocaleDateString(),
      fromReference: true,  // 标记为引用打开，这样点击关闭时会直接关闭弹窗
      index: 0  // 默认索引，可能需要根据实际情况调整
    };
    
    // 调用 openSearchReference 方法
    openSearchReference(webResult);
  } else {
    // 如果没有传入 openSearchReference 方法，则使用原有的方式打开网页
    mainStore.openWebViewStore({ url, name: name || e.target.innerHTML });
  }
};

let htmlRef = computed(() => {
  return toMarked(answer);
});
function toMarked(markdown) {
  // console.log(markdown);
  if (!markdown) return;
  // return markdown;
  let div = document.createElement("div");
  let htmlArr = [];
  
  // 创建一个包含 openSearchReference 方法的对象
  const webViewHandler = {
    handler: tKopenWebView,
    openSearchReference: openSearchReference
  };
  
  div.innerHTML = markedData(
    markdown.replace("</think>", ""),
    queryLocalId + tjyDataType,
    webViewHandler
  );
  for (var i = 0; i < div.childNodes.length; i++) {
    let id = null,
      className = null,
      html = "";
    var node = div.childNodes[i];
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName == "DIV" && node.className == "footnote") {
        id = node.id;
        className = node.className;
        html = node.innerHTML;
      } else {
        // 如果是元素节点，添加其外部HTML
        html = node.outerHTML;
      }
    } else if (
      node.nodeType === Node.TEXT_NODE &&
      node.nodeValue.trim() !== ""
    ) {
      // 如果是文本节点且不为空，添加其文本内容
      html = node.nodeValue;
    }
    htmlArr[i] = {
      id,
      className,
      html,
    };
  }
  return htmlArr;
}
// 如果有其他图片引用，也需要移除或替换
</script>
<style lang="less" scoped>
.k-text {
  padding: 12px 0 14px;
  color: #433330;
  font-size: 1rem;
  line-height: 1.5625rem;
  :deep(img) {
    max-width: 100%;
  }
  :deep(a) {
    color: rgba(43, 104, 255, 0.95);
    line-height: 1.75rem;
    background: #f7f7f7;
    word-break: break-all;
    display: block;
    //padding: 0 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  :deep(.a-sup) {
    //color: rgba(43, 104, 255, 0.95);
    line-height: 1rem;
    font-size: 0.8rem;
    min-width: 1rem;
    line-height: 1rem;
    background: #fdd1bc;
    border-radius: 0.5rem;
    display: inline-block;
    text-align: center;
    vertical-align: text-top;
  }
  :deep(.markdown-body) {
    .footnote {
      display: flex;
      white-space: nowrap;
      color: rgba(43, 104, 255, 0.95);
      line-height: 1.75rem;
      background: #f7f7f7;
      padding-left: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      p {
        overflow: hidden;
      }
      &:is(:last-child) {
        padding-bottom: 10px;
      }
      &:not(:has(+ .footnote)) {
        padding-bottom: 10px;
      }
      &:not(.footnote ~ .footnote) {
        padding-top: 10px;
      }
    }
    .footnote-video {
      display: inline-block;
      width: 33.33%;
      padding: 0 6px;
      margin-top: 12px;
      vertical-align: top;
      color: rgba(43, 104, 255, 0.95);
      box-sizing: border-box;
      div {
        padding: 6px 6px;
        box-sizing: border-box;
        background: #f7f7f7;
      }
      p {
        overflow: hidden;
      }
    }
  }
  :deep(p) {
    white-space: unset !important;
  }
  :deep(ol) {
    margin: auto !important;
    padding: revert !important;
    li {
      list-style: decimal !important;
    }
  }
  :deep(ul) {
    margin: auto !important;
    padding: revert !important;
    li {
      list-style: disc !important;
    }
  }
  .deepseekR1-title {
    :deep(.van-collapse-item__title) {
      font-size: 1rem;
      font-weight: 600;
      background: #fbe2d0;
      color: #753100;
      border-radius: 4px;
      padding: 6px 8px 6px 12px;
      display: flex;
      align-items: center;
      .van-cell__left-icon {
        font-size: 1rem;
        height: 1rem;
      }
    }
    :deep(.van-collapse-item__wrapper) {
      .van-collapse-item__content {
        font-size: unset;
        line-height: unset;
        background-color: unset;
        color: #878787;
        border-left: 5px solid #e4e4e4;
        padding-left: 12px;
        margin-top: 12px;
      }
    }
  }
}
</style>