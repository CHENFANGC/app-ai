//这里是所有的请求
import tkfn from "@/utils/lib/common";
import request from "@/http/index.js";
import { useMainStore } from "@/store/index.js";
import { fetchEventSource } from "@microsoft/fetch-event-source";
// import { messagejs } from "../../utils/messagejs/index.js";
// export const test = () => axios.get("test");
let store = null;
//获取骨架屏列表
// export const getSkeletonList = (data) => axios.get('/appApi/v2/infor/manage/getNewList', data)

// 报错日志上传
export const sendWarning = (data) =>
  request.post("/simple/h5AppApi/v1/warn/sendWarning", data);
//判断应用中心权限
export const getAppsList = (data) =>
  request.post("/portal/h5AppApi/v1/query/apps/by/person", data);
// 获取会话id列表
export const getChatidList = (data) =>
  request.post("/search/h5AppApi/copilot/v1/agent/query/chat/list", data);
// 根据会话id 删除会话
export const deleteChat = (data) =>
  request.post("/search/h5AppApi/copilot/v1/agent/del/conversation", data);
// 获取历史消息
export const getHistoryInfo = (data) =>
  request.post("/search/h5AppApi/copilot/v1/agent/query/chat/msg", data);
// 停止生成答案
export const tjyAiStopStream = (data) =>
  request.post("/search/h5AppApi/copilot/v1/agent/stream/stop", data);
// 消息反馈
export const tjyAiFeedback = (data) =>
  request.post("/search/h5AppApi/copilot/v1/agent/msg/feedback", data);
// 获取下一轮建议问题
export const tjyAiSuggested = (data) =>
  request.post("/search/h5AppApi/copilot/v1/agent/get/suggested", data);
// 首次打开页面推荐
export const tjyAiAgentDetails = (data) =>
  request.post("/search/h5AppApi/copilot/v1/agent/get/details", data);
// 记录模型类型
export const tjyAiAgentChooseModel = (data) =>
  request.post("/search/h5AppApi/xt/conf/v1/user/choose/model", data);
// 查询所有模型类型
export const tjyAiAgentGetAllModel = (data) =>
  request.post("/search/h5AppApi/xt/conf/v1/get/all/models", data);
// 知识库链接存储
export const tjyAiKnowledgeSave = (data) =>
  request.post("/meet/h5AppApi/v1/knowledge/save", data);
let onlyMessage = false,
  appMessage = "",
  buffer = "",
  queryLocalId = "",
  tjyDataType = "";
let taskId = "";

let ctrl = null;
export const tjyAiStream = (searchObj) => {
  if (store == null) {
    store = useMainStore();
  }
  appMessage = "";
  tjyDataType = 'text';
  onlyMessage = false;
  ctrl = new AbortController();
  queryLocalId = searchObj.queryLocalId;
  let url = "/search/h5AppApi/copilot/v1/agent/stream/chat";
  if (process.env.VUE_APP_NODE_BUILD_R == "production") {
    url += "?forcePrePrd=1";
    let isPrivate = tkfn.getQuery("isPrivate");
    url += isPrivate != "" ? "&isPrivate=1" : "";
  }
  // console.log("进入chat接口了，searchObj", searchObj);
  // console.log("开始发送请求", new Date());
  store.saveUpdatedTime({
    k: new Date().getTime(),
    tool: '开始发'
  });
  fetchEventSource(url, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    timeout: 0,
    mode: "cors",
    credentials: "include",
    openWhenHidden: true,
    body: JSON.stringify(searchObj),
    signal: ctrl.signal,
    onmessage(event) {
      // console.log("成功1", new Date().getTime(), event);
      if (event && event.data) {
        let res = {};
        try {
          res = JSON.parse(event.data);
        } catch (e) {
          store.setStreamAI({
            tjyDataType: "text",
            answer: "当前访问人数较多，请您稍后再试！！", //event.data,
            queryLocalId: searchObj.queryLocalId,
          });
          // console.log("接口返回的数据解析String", e);
          return;
        }
        try {
          // console.log(res, "接口返回的数据");
          if (taskId != res.task_id) {
            // console.log("接收到第一条消息", new Date(), new Date(Number(res.updated_at)));
            store.typeProcess = '正在进行意图识别';
            taskId = res.task_id;
            store.taskId = taskId
            store.conversationId = res.conversation_id
            store.saveMessageId(res.message_id, res.conversation_id);
            store.saveUpdatedTime({
              cGetQuery: res.created_at ? Number(res.created_at * 1000) : null,
              t: res.updated_at ? Number(res.updated_at) : null,
              k: new Date().getTime(),
              tool: '首次-c'
            });
            store.needScroll = true;
          }
          // console.log("接收到消息", new Date(), new Date(res.updated_at ? Number(res.updated_at) : null));

          if (res.event == "agent_thought") {
            if (res.tool != "") {
              let tool = res.tool.replace(/CorrelationScoreJudgment/g, '意图识别')
                .replace(/current_time/g, '获取当前时间')
                .replace(/eval_expression/g, '计算工具')
                .replace(/gbi/g, '内部数据')
                .replace(/getResumeList/g, '人才简历')
                .replace(/SUPPLY_CHAIN/g, '供应链信息')
                .replace(/knowledgeCenter/g, '内部知识')
                .replace(/searxng_search/g, '联网搜索')
                .replace(/knowledgeSearch/g, '内部知识')
                .replace(/deepseekR1search/g, '联网搜索外部知识')
                .replace(/writing/g, '写作助手');
              store.saveReplyType(tool);
              let tooling = res.tool.replace(/CorrelationScoreJudgment/g, '进行相关性判断')
                .replace(/current_time/g, '获取当前时间')
                .replace(/eval_expression/g, '调用计算工具')
                .replace(/gbi/g, '查询内部数据')
                .replace(/getResumeList/g, '查询人才简历')
                .replace(/SUPPLY_CHAIN/g, '查询供应链信息')
                .replace(/knowledgeCenter/g, '查询内部知识')
                .replace(/searxng_search/g, '联网搜索')
                .replace(/knowledgeSearch/g, '查询内部知识')
                .replace(/deepseekR1search/g, '联网搜索外部知识')
                .replace(/writing/g, '调用写作助手');
              if (res.observation != "") {
                if (
                  res.tool.indexOf("gbi") != -1 ||
                  res.tool.indexOf("getResumeList") != -1 ||
                  res.tool.indexOf("knowledgeSearch") != -1 ||
                  res.tool.indexOf("deepseekR1search") != -1 ||
                  res.tool.indexOf("SUPPLY_CHAIN") != -1 ||
                  res.tool.indexOf("writing") != -1
                ) {
                  try {
                    // console.log("res.observation", res.observation);
                    let item = JSON.parse(res.observation);
                    // console.log("res.observationJSON", res.observation);
                    let { getResumeList, gbi, deepseekR1search, knowledgeSearch, SUPPLY_CHAIN, writing } = item;
                    // console.log("getResumeList", getResumeList);
                    // console.log("gbi", gbi);
                    if (getResumeList) {
                      let resumeList = JSON.parse(getResumeList).resumeList;
                      resumeList = JSON.parse(resumeList);
                      // console.log("resumeListJSON", resumeList);
                      if (resumeList.dataList && resumeList.dataList.length != 0) {
                        let dataList =
                          resumeList.dataList.length > 3
                            ? resumeList.dataList.slice(0, 3)
                            : resumeList.dataList;
                        resumeList.dataList = dataList;
                        resumeList["queryLocalId"] = searchObj.queryLocalId;
                        store.setStreamAI(resumeList);
                      } else {
                        store.setStreamAI({
                          tjyDataType: "text",
                          answer: "暂无相关简历",
                          queryLocalId: searchObj.queryLocalId,
                        });
                      }
                    }
                    if (gbi) {
                      if (typeof gbi !== "object") {
                        let list = JSON.parse(gbi);
                        if (typeof list == "object") {
                          if (list.sqlItems)
                            list.sqlItems = null;
                          // console.log("gbiresultJSON", list);
                          if (list.type == "notice") {
                            store.typeProcess = list.data;
                          } else {
                            store.setStreamAI({
                              dataList: [list],
                              tjyDataType: "GBI",
                              queryLocalId: searchObj.queryLocalId,
                            });
                          }
                        } else {
                          store.setStreamAI({
                            tjyDataType: "text",
                            answer: "GBI未返回相关数据信息",
                            queryLocalId: searchObj.queryLocalId,
                          });
                        }
                      }
                    }
                    if (deepseekR1search || knowledgeSearch || writing) {
                      let deepseekR1 = JSON.parse(deepseekR1search || knowledgeSearch || writing);
                      if (deepseekR1.data.node_type === "tool" && deepseekR1.data.hasOwnProperty('outputs') && deepseekR1.data.outputs.hasOwnProperty('text')) {
                        console.log("search_results--------", JSON.parse(deepseekR1.data.outputs.text))
                        store.setStreamAI({
                          tjyDataType: 'searchResults',
                          searchResults: JSON.parse(deepseekR1.data.outputs.text),
                          queryLocalId: searchObj.queryLocalId,
                        });
                      }
                      if (deepseekR1.event == 'text_chunk' && deepseekR1.data.text) {
                        let deepseekText = deepseekR1.data.text;
                        if (deepseekText.indexOf('<think>') > -1) {
                          let deepseekText0 = deepseekText.split('<think>')[0] || ''
                          store.setStreamAI({
                            tjyDataType: tjyDataType,
                            answer: deepseekText0,
                            queryLocalId: searchObj.queryLocalId,
                          });
                          deepseekText = deepseekText.split('<think>')[1] || ''
                          tjyDataType = 'deepseekR1'
                        }
                        if (deepseekText.indexOf('</think>') > -1) {
                          let deepseekText0 = deepseekText.split('</think>')[0] || ''
                          store.setStreamAI({
                            tjyDataType: tjyDataType,
                            answer: deepseekText0 + '</think>',
                            queryLocalId: searchObj.queryLocalId,
                          });
                          deepseekText = deepseekText.split('</think>')[1] || ''
                          tjyDataType = 'text'
                        }
                        store.setStreamAI({
                          tjyDataType: tjyDataType,
                          answer: deepseekText,
                          queryLocalId: searchObj.queryLocalId,
                        });
                      }
                    }
                    if (SUPPLY_CHAIN) {
                      let SUPPLY_CHAIN_TEXT = JSON.parse(SUPPLY_CHAIN);
                      if (SUPPLY_CHAIN_TEXT.event == 'agent_message') {
                        store.setStreamAI({
                          tjyDataType: "text",
                          answer: SUPPLY_CHAIN_TEXT.answer,
                          queryLocalId: searchObj.queryLocalId,
                        });
                        // buffer += SUPPLY_CHAIN_TEXT.answer
                        // tryParseJson(searchObj.queryLocalId);
                      }
                    }
                  } catch (e) {
                    console.log(e, "解析失败");
                    onerrorFn(e);
                  }
                } else {
                  store.saveUpdatedTime({
                    t: res.updated_at ? Number(res.updated_at) : null,
                    tool: tooling + '结束-c'
                  });
                }
              } else {
                store.typeProcess = '正在' + tooling;
                let aTtools = 'gbi;knowledgeSearch;getResumeList;deepseekR1search;SUPPLY_CHAIN;'
                if (aTtools.indexOf(res.tool) != -1) {
                  store.setStreamAI({
                    tjyDataType: "text",
                    answer: `${tooling}\n\n  `,
                    queryLocalId: searchObj.queryLocalId,
                  });
                }
                // - 调用gbi工具前，展示“正在查询内部数据”。
                // - 查询内搜knowledgeSearch工具前，展示“正在查询内部知识”。
                // - 查询人才简历getResumeList工具前，展示“正在查询人才简历”。
                // - 查询外部知识deepseekR1search工具前，展示“正在联网搜索外部知识”。

                store.saveUpdatedTime({
                  t: res.updated_at ? Number(res.updated_at) : null,
                  tool: tooling + '开始-c',
                });
              }
            }
          }
          if (res.event == "message" && res.answer && res.answer != "") {
            store.saveReplyType("标注答案");
            onlyMessage = onlyMessage
              ? onlyMessage
              : res.answer.indexOf("$") == 0;
            if (onlyMessage) {
              appMessage += res.answer || "";
              return;
            } else {
              store.setStreamAI({
                tjyDataType: "text",
                answer: res.answer,
                queryLocalId: searchObj.queryLocalId,
              });
            }
          }
          // 返回的数据
          if (res.event == "agent_message" && res.answer) {
            store.saveReplyType("智能体总结");
            // console.log("onmessage", JSON.parse(res.answer));

            // 追加新的数据块到缓冲区
            // 不断尝试解析JSON，直到缓冲区中没有更多的JSON
            buffer += res.answer;
            tryParseJson(searchObj.queryLocalId);
          }
          if (res.event == "message_end") {
            store.saveUpdatedTime({
              t: res.updated_at ? Number(res.updated_at) : null,
              tool: "回答结束-c",
            });
          }
        } catch (error) {
          // console.log("接口返回的数据解析String", error);
          onerrorFn(error);
        }
      }
    },
    onerror(event) {
      console.log("报错", event);
      onerrorFn(event);
      throw new Error(event);
    },
    onclose() {
      store.saveUpdatedTime({
        k: new Date().getTime(),
        tool: '关闭-客'
      });
      // console.log("主动关闭", new Date());
      store.typeProcess = "";
      if (onlyMessage && appMessage != "") {
        store.saveReplyType("应用跳转");
        setTimeout(() => {
          store.click_cxo_XT_answer();
        }, 500);
        store.appsList({
          appMessage: appMessage.replace(/^\$*/, ""),
          queryLocalId: queryLocalId,
          queryStr: searchObj.queryStr,
        });
      } else {
        if (buffer != "") {
          store.setStreamAI({
            tjyDataType: "text",
            answer: buffer,
            queryLocalId: queryLocalId,
          });
          buffer = "";
        }
        // 如果没有返回message, 那么不显示加载动态
        setTimeout(() => {
          store.checkIfResult(queryLocalId);
          store.isLoading = false;
          store.stopResult = false;
          store.getSuggested({
            queryLocalId: queryLocalId,
          });
        }, 1000);
        store.click_cxo_XT_answer();
      }
    },
  });
};
export const stopResultFn = () => {
  onlyMessage = false;
  appMessage = "";
  store.isLoading = false;
  store.stopResult = false;
  ctrl.abort();
  store.saveUpdatedTime({
    k: new Date().getTime(),
    tool: '主动关闭-客'
  });
  store.setStreamAI({
    tjyDataType: "text",
    answer: `\n\n 用户停止`,
    queryLocalId: queryLocalId,
  });
  store.click_cxo_XT_answer();
  // throw new Error(JSON.stringify({ code: 1, msg: "停止回答" }));
};

function onerrorFn(event) {
  try {
    sendWarning({
      title: "智能助手",
      content: event.message,
      reqTime: new Date().getTime().toString(),
    }).catch((e) => {
      console.log(e, "智能助手");
    });
  } catch (e) {
    console.log(e, "sendWarning");
  }
  store.typeProcess = "";
  // if (
  //   event.message.indexOf(
  //     "content-type to be text/event-stream, Actual: application/json"
  //   ) != -1
  // ) {
  //   messagejs.error({
  //     message: "用户登录失效，即将重新登录！",
  //     duration: 3000,
  //   });
  //   setTimeout(() => {
  //     window.location.href = "/simple/sso/redirect/h/tjyAppAI/index";
  //   }, 3800);
  // }
  let item = {
    tjyDataType: "text",
    answer: "当前访问人数较多，请您稍后再试！！！",
    queryLocalId: queryLocalId,
  };
  store.isLoading = false;
  store.stopResult = false;
  store.setStreamAI(item);
  ctrl.abort();
  // throw event;
}

function tryParseJson(queryLocalId) {
  // console.log("buffer", buffer, queryLocalId);
  let jsonStartIndex = buffer.indexOf("{"); // 查找JSON开始位置
  if (jsonStartIndex === -1) {
    if (buffer != "") {
      store.setStreamAI({
        tjyDataType: "text",
        answer: buffer,
        queryLocalId: queryLocalId,
      });
    }
    buffer = ""; // 重置缓冲区
    return; // 如果没有找到'{'，则继续等待数据
  }
  // 如果有非JSON文本，并且JSON之前还有文本，则将其添加到jsonData中
  if (jsonStartIndex >= 0 && buffer.slice(0, jsonStartIndex) != "") {
    store.setStreamAI({
      tjyDataType: "text",
      answer: buffer.slice(0, jsonStartIndex),
      queryLocalId: queryLocalId,
    });
    buffer = buffer.slice(jsonStartIndex); // 保留可能的JSON开头的大括号
  }

  // 查找JSON结束位置
  let jsonEndIndex = buffer.indexOf("}");
  // 如果没有找到'}'，则继续等待数据
  if (jsonEndIndex === -1) return;
  tryJson(jsonEndIndex, queryLocalId);
}

function tryJson(jsonEndIndex, queryLocalId) {
  try {
    // 提取JSON字符串并解析
    let jsonString = buffer.slice(0, jsonEndIndex + 1);
    // console.log("jsonString", jsonString);
    let json = JSON.parse(jsonString);
    // console.log("Parsed JSON:", json);
    if (json.tjyDataType) {
      if (json.tjyDataType == "score") {
        store.setStreamAI({
          tjyDataType: "score",
          dataTitle: json.dataTitle,
          dataList: json.dataList,
          queryLocalId: queryLocalId,
        });
      } else {
        json["queryLocalId"] = queryLocalId;
        store.setStreamAI(json);
      }
    }
    // 移除已解析的JSON字符串，并保留剩余部分
    buffer = buffer.slice(jsonEndIndex + 1);
    if (buffer.length > 0) {
      tryParseJson(queryLocalId);
    }
  } catch (e) {
    if (jsonEndIndex != buffer.lastIndexOf("}")) {
      jsonEndIndex = buffer.indexOf("}", jsonEndIndex + 1);
      // console.log("jsonEndIndex", jsonEndIndex, buffer);
      tryJson(jsonEndIndex, queryLocalId);
    }
    // 解析失败，可能是因为JSON不完整，继续等待数据
    // console.error("Failed to parse JSON:", e);
  }
}