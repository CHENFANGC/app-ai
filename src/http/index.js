import axios from 'axios';
import tkfn from '@/utils/lib/common';

let baseURL = ''; //解决本地跨域根据当前环境配置 => config/index.js
const token = '';
let dhrURL1 = '',
  gbiUrl1 = '',
  gbiControls1 = '';
//根据环境配置不同的路径
// if (process.env.VUE_APP_NODE_BUILD == 'production') {
if (false) {
  dhrURL1 = 'tksim://tjy/bigsearch/search?tab=dhr';
  gbiUrl1 = 'https://sim.mobile.taikang.com/moa/m/s?s=gOid3yo1F8YJb5+wpWAP0KOpqHiUkMB7';
  // "https://gbi.taikang.com/gbi/static/padChatBI2/index.html?channel=fstyb";
  //https://tkhome.mobile.taikang.com/office/auth/sso/redirect/padChatBI2/index?channel=tjyapp
  gbiControls1 = 'https://gbi.taikang.com/gbi/static/padChatBI2/index.html?channel=fstyb#/controls';
} else {
  dhrURL1 = 'tksimtest://tjy/bigsearch/search?tab=dhr';
  gbiUrl1 = 'https://gbitest.taikang.com/gbi/static/padChatBI2/index.html?channel=fstyb';
  gbiControls1 =
    'https://gbitest.taikang.com/gbi/static/padChatBI2/index.html?channel=fstyb#/controls';
}

export const dhrURL = dhrURL1;
export const gbiUrl = gbiUrl1;
export const gbiControls = gbiControls1;

class HttpRequest {
  constructor() {
    this.baseURL = baseURL;
    this.timeout = 30000;
    this.quenue = {}; //将请求放在这个队列
  }
  setInterceptor(instance, url) {
    instance.interceptors.request.use(
      (config, url) => {
        if (!process.env.VUE_APP_NODE_BUILD == 'production') {
          config.headers['AuthToken'] = token;
        }
        this.quenue[url] = true;
        return config;
      },
      (e) => Promise.reject(e)
    );
    instance.interceptors.response.use(
      (res) => {
        delete this.quenue[url];
        //根据code码响应不同内容；
        // if (res.data.code === 200) {
        //   return res.data
        // } else {
        //   return Promise.reject(res.data) //可修改
        // };
        if (res.data.code == '0') {
          return res.data;
        } else if (res.data.code == '3000') {
          // window.location.href = "/simple/sso/redirect/h/tjyAppAI/index";
        } else {
          // console.log(res.data);
          // throw new Error(res.data);
          return Promise.reject(res.data); //可修改
        }
      },
      (e) => Promise.reject(e)
    );
  }
  request(options) {
    const instance = axios.create();
    const config = {
      baseURL: this.baseURL,
      timeout: this.timeout,
      ...options
    };
    if (process.env.VUE_APP_NODE_BUILD_R == 'production') {
      config.url += '?forcePrePrd=1';
      let isPrivate = tkfn.getQuery('isPrivate');
      config.url += isPrivate != '' ? '&isPrivate=1' : '';
    }
    this.setInterceptor(instance, config.url);
    return instance(config);
  }
  get(url, data = {}) {
    return this.request({
      url,
      method: 'get',
      ...data
    });
  }
  post(url, data = {}) {
    return this.request({
      url,
      method: 'post',
      data
    });
  }
}

export default new HttpRequest();
