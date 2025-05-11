import { tjyAiAgentChooseModel } from '../http/apis/index';
import { gbiControls, gbiUrl } from '../http/index';
import { defineStore } from 'pinia';
import { useSensorsStore } from './shence';

import { getAppsList, tjyAiSuggested, tjyAiAgentDetails } from '@/http/apis/index';
// 替换 require 为 import
// import notepng from '../assets/img/notes.png';
// import deepseekr1Img from '../assets/img/deepseek.png';
import { showConfirmDialog, closeDialog, showToast } from 'vant';

export const useMainStore = defineStore('main', {
  state: () => ({
    initObj: {
      userQuestion: '',
      messageId: '',
      replyType: '',
      like: false,
      unlike: false,
      taskId: 'init',
      suggestedQuestions: null,
      queryLocalId: 'init',
      newDialogue: true,
      result: [
        {
          tjyDataType: 'text',
          // 替换图片引用为纯文本
          answer: `欢迎使用泰康AI助手`
        }
      ],
      suggestedQuestions: {
        dataList: [],
        dataTitle: ''
      }
    },
    isPhone: true,
    errorCode: {
      '-999': '系统开了小差，泰康GBI奋力抢修中...',
      '-998': '参数错误',
      '-997': '签名验证失败',
      '-996': `如需申请，请见<a style='color: #fa7414' onclick="tKopenWebViewGbi(event,'${gbiControls}', 'GBI权限申请'})">权限申请</a>或者重新调整问题，再查询试试。`,
      '-995': '查询中含有指标不支持的维度',
      '-102': `该数据暂未对业务方名单外用户开放。如需申请，请见<a style='color: #fa7414' onclick="tKopenWebViewGbi(event,'${gbiControls}', 'GBI权限申请')">权限申请</a>`,
      '-101': '该数据暂未接入',
      '-100': `该数据暂未对业务方名单外用户开放。如需申请，请见<a style='color: #fa7414' onclick="tKopenWebViewGbi(event,'${gbiControls}', 'GBI权限申请')">权限申请</a>`,
      '-3': '该问题暂无对应有效业务数据。以下原因可能导致该情况发生：<br>1.数据是还未到更新时间<br>2.查询时间段内无实际业务发生<br>可以尝试调整查询条件重新查询，谢谢',
      '-1': '抱歉，该数据暂未接入GBI。我会记下来，尽快接入。'
    },
    stopResult: false,
    conversationId: '',
    isLoading: false,
    commonAnswer: [],
    taskId: '',
    typeProcess: '正在为您查询',
    sendType: 'input',
    newDialogue: false,
    needScroll: true,
    showHistory: false,
    scrollFinished: true,
    deepSeekModel1: 'R1',
    deepSeekModel2: 'V3-快速问答',
    deepSeekModelShowName: {
      R1: ['R1', 'R1-深度思索'],
      V3: ['V3', 'V3-快速问答']
    },
    deepSeekOption: [
      // 移除图片引用
      { text: 'R1-深度思索', value: 'R1', icon: '' },
      { text: 'V3-快速问答', value: 'V3', icon: '' }
    ],
    activeAIOption: [
      // 移除图片引用
      { text: '泰康GBI', icon: '' },
      { text: '财务智能助手', disabled: true, icon: '' },
      { text: 'DHR', disabled: true, icon: '' }
    ]
  }),
  getters: {},
  actions: {
    setHello(data) {
      // 修改为不依赖图片的方式
      this.commonAnswer[0].result[0].answer = `欢迎使用泰康AI助手`;
    },
    deepSeekSelect(action, index) {
      this.deepSeekModel1 = this.deepSeekModelShowName[action.value][0];
      this.deepSeekModel2 = this.deepSeekModelShowName[action.value][1];
      tjyAiAgentChooseModel({ modelType: action.value });
    },
    OpenActiveAI(action, index) {
      switch (index) {
        case 0:
          this.openWebViewStore({ url: gbiUrl, name: '打开GBI智能助手' });
          break;
        default:
          showToast('正在开发中，敬请期待！');
          break;
      }
    },
    setStreamAI(data) {
      // console.log("进入setStreamAI了,data", data);
      // console.log(length, "length");
      if (data.userQuestion) {
        let item = {};
        item.userQuestion = data.userQuestion;
        item.replyType = data.replyType || '';
        item.queryLocalId = data.queryLocalId;
        item.conversationId = data.conversationId || '';
        item.like = data.like || false;
        item.unlike = data.unlike || false;
        item.taskId = this.taskId || '';
        item.messageId = data.messageId || '';
        item.result = [];
        item.updatedTime = [];
        item.suggestedQuestions = null;
        this.commonAnswer.push(item);
        // console.log(this.commonAnswer, "是answer的数据");
      } else {
        let length = this.commonAnswer.findIndex((item) => item.queryLocalId == data.queryLocalId);
        if (length == -1) {
          return;
        }
        let resultLast =
          this.commonAnswer[length].result[this.commonAnswer[length].result.length - 1];
        // console.log("是answer,长度不一定是0");
        if (
          this.commonAnswer[length].result.length > 0 &&
          resultLast.tjyDataType == data.tjyDataType
        ) {
          switch (resultLast.tjyDataType) {
            case 'text':
              resultLast.answer += data.answer;
              break;
            case 'deepseekR1':
              resultLast.answer += data.answer;
              break;
            // case "appCenter":
            //   resultLast.dataList.push(...data.dataList);
            //   break;
            // case "DHR":
            //   resultLast.dataList.push(...data.dataList);
            //   break;
            // case "score":
            //   resultLast.dataList.push(...data.dataList);
            //   break;
            case 'DHR':
              if (resultLast.dataList.findIndex((item) => item.tjyDataType == 'DHR') == -1) {
                resultLast.dataList.push(...data.dataList);
              }
              break;
            case 'appCenter':
            case 'score':
              resultLast.dataList.push(...data.dataList);
              break;
            case 'GBI':
              for (let i = 0; i < data.dataList.length; i++) {
                if (
                  resultLast.dataList[resultLast.dataList.length - 1].type == 'text' &&
                  data.dataList[i].type == 'text'
                ) {
                  resultLast.dataList[resultLast.dataList.length - 1].data += data.dataList[i].data;
                } else {
                  if (data.dataList[i].rtcode == '0') {
                    let dataList = sortGbiData(data.dataList[i]);
                    resultLast.dataList.push(dataList);
                  } else {
                    resultLast.dataList.push(data.dataList[i]);
                  }
                }
              }
              break;
            default:
              break;
          }
        } else {
          if (data.tjyDataType == 'GBI') {
            data.dataList.forEach((item) => {
              if (item.type !== 'text' && item.rtcode == '0') {
                item = sortGbiData(item);
              }
            });
          }
          this.commonAnswer[length].result.push(data);
        }
      }
      if (this.commonAnswer.length) {
        window.sessionStorage.setItem('commonAnswers', JSON.stringify(this.commonAnswer));
        // console.log("222", this.commonAnswer.slice(-6));
      } else {
        window.sessionStorage.setItem('commonAnswers', '');
        // console.log("11111");
      }
      // console.log("this.commonAnswer", this.commonAnswer);
    },
    saveMessageId(messageId, conversationId) {
      this.commonAnswer[this.commonAnswer.length - 1]['messageId'] = messageId;
      this.commonAnswer[this.commonAnswer.length - 1]['conversationId'] = conversationId;
    },
    saveUpdatedTime(updatedTime) {
      this.commonAnswer[this.commonAnswer.length - 1]['updatedTime'].push(updatedTime);
    },
    saveReplyType(data) {
      let type = this.commonAnswer[this.commonAnswer.length - 1]['replyType'];
      data.split(';').forEach((item) => {
        if (type.indexOf(item) == -1) {
          type += item + ';';
        }
      });
      this.commonAnswer[this.commonAnswer.length - 1]['replyType'] = type;
    },
    saveReplyTypeByQueryLocalId(data) {
      for (var i = 0; i < this.commonAnswer.length; i++) {
        if (this.commonAnswer[i].queryLocalId === data.queryLocalId) {
          let type = this.commonAnswer[i]['replyType'];
          data.replyType.split(';').forEach((item) => {
            if (type.indexOf(item) == -1) {
              type += item + ';';
            }
          });
          this.commonAnswer[i]['replyType'] = type;
          break;
        }
      }
    },
    getAgentDetails() {
      tjyAiAgentDetails()
        .then((res) => {
          this.setSuggestedQuestions({
            suggestedQuestions: {
              dataList: res.data.agentDetails.suggestedQuestions,
              dataTitle: ''
            },
            queryLocalId: 'init'
          });
          this.initObj['suggestedQuestions'] = {
            dataList: res.data.agentDetails.suggestedQuestions,
            dataTitle: ''
          };
        })
        .catch((err) => {
          console.log(err);
        });
    },
    setSuggestedQuestions(data) {
      let length = this.commonAnswer.findIndex((item) => item.queryLocalId == data.queryLocalId);
      if (length !== -1) {
        this.commonAnswer[length]['suggestedQuestions'] = data.suggestedQuestions;
        window.sessionStorage.setItem('commonAnswers', JSON.stringify(this.commonAnswer));
      }
    },
    setStreamAIunshift(data) {
      let item = {};
      item.userQuestion = data.userQuestion;
      item.queryLocalId = data.queryLocalId;
      item.replyType = data.replyType;
      item.conversationId = data.conversationId || '';
      item.like = data.like || false;
      item.unlike = data.unlike || false;
      item.taskId = this.taskId || '';
      item.messageId = data.messageId || '';
      item.result = [];
      item.updatedTime = [];
      item.suggestedQuestions = null;
      this.commonAnswer.unshift(item);
      if (data.scrollHeight) {
        // document.getElementById("dialogsMain").children[0].scrollIntoView();
        setTimeout(() => {
          document.getElementById('mainContent').scrollTop =
            document.getElementById('dialogs').scrollHeight - data.scrollHeight;
        }, 10);
      }
    },
    click_cxo_XT_answer() {
      let sensorsStore = useSensorsStore();
      sensorsStore.sensorsTrack('click_cxo_XT_answer', {
        buttonName: this.commonAnswer[this.commonAnswer.length - 1].replyType,
        contentId: this.commonAnswer[this.commonAnswer.length - 1].userQuestion,
        num: this.commonAnswer[this.commonAnswer.length - 1].messageId,
        contentType: JSON.stringify(this.commonAnswer[this.commonAnswer.length - 1].updatedTime)
      });
    },
    appsList(data) {
      getAppsList({ appCodes: data.appMessage })
        .then((res) => {
          if (res.data.appList && res.data.appList.length > 0) {
            if (res.data.appList.length == 1 && this.isPhone) {
              let timeout = setTimeout(() => {
                closeDialog();
                this.openWebViewStore({
                  url: res.data.appList[0].website,
                  name: 'appCenter: ' + res.data.appList[0].appName
                });
              }, 2000);
              showConfirmDialog({
                className: 'dialog-confirm-app',
                message: `正在前往 ${
                  res.data.appList[0].appName
                } <img src="${require('../assets/img/loading.gif')}" width="30px" height="16px" style="vertical-align:text-bottom;">`,
                showConfirmButton: false,
                allowHtml: true
              }).catch(() => {
                let sensorsStore = useSensorsStore();
                sensorsStore.sensorsTrack('click_cxo_XT_cancelSkip', {
                  buttonName: res.data.appList[0].appName,
                  contentId: data.queryStr
                });
                clearTimeout(timeout);
              });
            }
            this.setStreamAI({
              tjyDataType: res.data.dataType,
              dataList: res.data.appList,
              queryLocalId: data.queryLocalId
            });
          } else {
            setTimeout(() => {
              this.setStreamAI({
                queryLocalId: data.queryLocalId,
                tjyDataType: 'text',
                answer: '没有找到相关应用'
              });
            }, 50);
          }
          this.isLoading = false;
          this.stopResult = false;
        })
        .catch((err) => {
          // console.log("没有找到相关应用", JSON.stringify(err));
          this.setStreamAI({
            queryLocalId: data.queryLocalId,
            tjyDataType: 'text',
            answer: err.msg
          });
          this.isLoading = false;
          this.stopResult = false;
        });
    },
    openWebViewStore({ url, name }) {
      if (this.isLoading) {
        showToast('正在查询中...');
        return false;
      }
      let queryStringStart = url.indexOf('?');
      // 如果没有查询字符串，则返回空对象
      if (queryStringStart === -1) {
        url += '?isOpenByTopView=1&iPadFullScreenDisplay=1';
      } else {
        let str = url.substr(queryStringStart + 1);
        let len = str.indexOf('#');
        if (len == -1) {
          url += '&isOpenByTopView=1&iPadFullScreenDisplay=1';
        } else {
          url =
            url.substr(0, queryStringStart + 1) +
            str.split('#')[0] +
            '&isOpenByTopView=1&iPadFullScreenDisplay=1' +
            '#' +
            str.split('#')[1];
        }
      }
      let sensorsStore = useSensorsStore();
      // 神策埋点
      sensorsStore.sensorsTrack('click_cxo_XT_reply', {
        buttonName: name,
        result: url
      });
      try {
        if (
          navigator.userAgent.toLowerCase().indexOf('tkim') != -1 &&
          process.env.VUE_APP_NODE_BUILD !== 'development'
        ) {
          // console.log("TKJSSDKWebViewUI", url)
          // eslint-disable-next-line no-undef
          TKJSSDKWebViewUI.openWebView({ url });
        } else {
          window.open(url);
        }
      } catch (e) {
        showToast.fail('地址打开失败');
      }
    },
    checkIfResult(data) {
      if (this.commonAnswer[this.commonAnswer.length - 1].result.length == 0) {
        this.commonAnswer[this.commonAnswer.length - 1].result.push({
          tjyDataType: 'text',
          answer: '对不起，暂时无法回答您的问题。',
          queryLocalId: data
        });
      }
    },
    getSuggested(data) {
      let arr = this.commonAnswer.filter((item) => item.queryLocalId == data.queryLocalId);
      if (!arr || arr.length == 0) {
        return;
      } else {
        if (arr[0].result.length == 0) {
          return;
        }
        let score = arr[0].result.filter(
          (item) => item.tjyDataType == 'score' || item.tjyDataType == 'DHR'
        );
        if (score.length != 0) {
          return;
        }

        let GBI = arr[0].result.filter((item) => item.tjyDataType == 'GBI');
        let gbiDataList = [];
        GBI.forEach((item) => {
          gbiDataList.push(...item.dataList);
        });
        let rtcodeLength = gbiDataList.findIndex((item) => item.rtcode == 2);
        if (rtcodeLength != -1) {
          return;
        }

        let answer =
          arr[0].result[arr[0].result.length - 1].tjyDataType == 'text'
            ? arr[0].result[arr[0].result.length - 1].answer
            : '';
        if (answer.indexOf('用户停止') != -1) {
          return;
        }
      }
      tjyAiSuggested({
        messageId: arr[0].messageId
      })
        .then((res) => {
          if (res.data.suggestedQuestions.length == 0) return;
          this.setSuggestedQuestions({
            suggestedQuestions: {
              dataList: res.data.suggestedQuestions,
              dataTitle: ''
            },
            queryLocalId: data.queryLocalId
          });
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }
});

function sortGbiData(data) {
  let arri = [];
  data.dimension.forEach((el) => {
    arri.push(el.name);
  });
  data.indicator.forEach((el) => {
    arri.push(el.name);
  });
  if (arri[0] == '起始日期') {
    let a0 = data.data[0][arri[0]];
    let flg0 = data.data.findIndex((el) => el['起始日期'] != a0);
    let flg01 = flg0 != -1 ? data.data[flg0]['起始日期'] == '总计' : true;
    let obj = null;
    if (flg01) {
      obj = {
        definition: a0,
        name: '起始日期',
        typeNote: true
      };
      arri.splice(0, 1);
    }
    if (arri[0] == '截止日期') {
      let a1 = data.data[0][arri[0]];
      let flg1 = data.data.findIndex((el) => el['截止日期'] != a1);
      let flg11 = flg1 != -1 ? data.data[flg1]['截止日期'] == '总计' : true;
      if (flg11) {
        obj = {
          definition:
            a0 != a1
              ? a0.replace(/-/g, '/') + ' - ' + a1.replace(/-/g, '/')
              : a0.replace(/-/g, '/'),
          name: '统计时间',
          typeNote: true
        };
      }
    }
    if (obj != null) {
      data.indicator.unshift(obj);
      arri.splice(0, 1);
    }
    let clearFlag = false;
    for (let i = 0; i < arri.length; i++) {
      if (clearFlag && data.data[data.data.length - 1][arri[i]] == '总计') {
        data.data[data.data.length - 1][arri[i]] = '';
      }
      if (data.data[data.data.length - 1][arri[i]] == '总计') {
        clearFlag = true;
      }
    }
  }
  data.sortKey = arri;
  return data;
}
