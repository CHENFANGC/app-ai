import axios from 'axios';
import * as $sensors from 'sa-sdk-javascript';
import { defineStore } from 'pinia';
import { reactive } from 'vue';

export const useSensorsStore = defineStore('sensors', () => {
  let $userInfo = reactive({});
  function shenceInit(groupId, productLine, businessLine) {
    if (process.env.VUE_APP_NODE_BUILD_R) {
      return;
    }
    //神策埋点
    // "dependencies": {  //在package中添加依赖
    //     "sa-sdk-javascript": "1.25.21"
    //   },
    var url =
      process.env.VUE_APP_NODE_BUILD != 'production'
        ? 'https://domtest.taikanglife.com/sa?project=taihome'
        : 'https://dom.taikanglife.com/sa?project=taihome';

    $sensors.init({
      server_url: url, //泰家园租户数据接收地址
      // is_track_single_page:false, // 单页面配置，默认开启，若页面中有锚点设计，需要将该配置删除，否则触发锚点会多触发 $pageview 事件
      use_client_time: false, //是否使用客户端本地时间
      send_type: 'beacon', //image  or  beacon
      show_log: false, //process.env.VUE_APP_NODE_BUILD != "production", //控制台是否打印log
      heatmap: {
        // 是否开启点击图，default 表示开启，自动采集 $WebClick 事件，可以设置 "not_collect" 表示关闭。
        clickmap: 'default', //开关点击事件$WebClick统计
        // 是否开启触达图，not_collect 表示关闭，不会自动采集 $WebStay 事件，可以设置 "default" 表示开启。
        scroll_notice_map: 'not_collect' //开关触达事件$WebStay统计
      }
    });
    // $sensors.quick("autoTrackSinglePage");//用于单页面
    $sensors.registerPage({
      groupId: groupId,
      productLine: productLine,
      businessLine: businessLine
    });
    $sensors.quick('autoTrack'); //用于采集 $pageview 事件，用于多页面。
    $sensors.use('PageLeave', { heartbeat_interval_time: 5 }); // 设置页面浏览时长心跳记录刷新时间为 5 秒。
    // $sensors.use("PageLeave", { custom_props: { page_name: "停留时长-会议列表" }, heartbeat_interval_time: 5 }) // 设置页面浏览时长自定义属性 page_title 为 "我的标题"，并设置页面浏览时长心跳记录刷新时间为 5 秒。
    $sensors.use('PageLoad'); //页面加载时长
    shenceInfo();
  }
  async function shenceInfo() {
    var infoURL =
      process.env.VUE_APP_NODE_BUILD == 'production'
        ? 'https://tkhome.mobile.taikang.com/simple/h5AppApi'
        : '/simple/h5AppApi';
    var name = 'XXXOOO',
      userID = 'XXXOOO',
      department = 'XXXOOO',
      orgidPath = 'XXXOOO';
    await new Promise((resolve) => {
      if (
        navigator.userAgent.toLowerCase().indexOf('tkim') > -1 &&
        process.env.VUE_APP_NODE_BUILD !== 'development'
      ) {
        // eslint-disable-next-line no-undef
        TKJSSDKCommon.getUserInfo((info) => {
          var val = JSON.parse(info);
          if (val.data) {
            name = val.data.name;
            userID =
              val.data.userId && val.data.userId != null && val.data.userId != ''
                ? val.data.userId
                : 'XXXOOO';
            department = val.data.orgName;
            orgidPath = val.data.orgId;
          }
          resolve();
        });
      } else {
        // 获取用户权限
        axios
          .post(
            infoURL + '/v1/info/getUserInfo',
            {},
            {
              timeout: 30000
            }
          )
          .then((result) => {
            // console.log("/v1/info/getUserInfo");
            if (result.data.code == '0' && result.data.data) {
              // 设置用户属性，注册用户画像
              name = result.data.data.personName;
              userID =
                result.data.data.personEname &&
                result.data.data.personEname != null &&
                result.data.data.personEname != ''
                  ? result.data.data.personEname
                  : 'XXXOOO';
              department = result.data.data.parentOrgNamePath;
              orgidPath = result.data.data.parentOrgIdPath;
              resolve();
            } else {
              throw new Error('个人信息获取失败！');
            }
          })
          .catch((err) => {
            console.log(err);
            // alert("个人信息获取失败！")
            // location.reload()
          });
      }
    });
    $userInfo = {
      name: name,
      userID: userID,
      department: department,
      orgidPath: orgidPath // 机构id
    };
    $sensors.setProfile($userInfo);
    $sensors.registerPage({
      tkuserid: userID
    });
    // $sensors.setProfile({
    //     userID: res.userId,
    //     org: res.orgId,
    //     orgidPath: res.orgName
    // })

    // $sensors.registerPage({
    //     tkuserid: res.userId
    // })
  }

  function sensorsTrack(event, data) {
    if (!process.env.VUE_APP_NODE_BUILD_R) {
      $sensors.track(event, data);
    }
  }
  return { shenceInit, sensorsTrack };
});

//神策埋点初始化

//获取用户信息并设置用户属性
