import { showToast } from 'vant';
//扩展Date格式化
Date.prototype.format = function (format) {
  var o = {
    'M+': this.getMonth() + 1, //月份
    'd+': this.getDate(), //日
    'h+': this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, //小时
    'H+': this.getHours(), //小时
    'm+': this.getMinutes(), //分
    's+': this.getSeconds(), //秒
    'q+': Math.floor((this.getMonth() + 3) / 3), //季度
    S: this.getMilliseconds().toString().padStart(3, '0') // 格式化毫秒
  };

  var week = ['\u65e5', '\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d'];

  // 预先编译正则表达式
  var regexes = [
    /(y+|Y+)/g,
    /(E+)/g
    // 添加更多预编译的正则表达式...
  ];

  // 替换年份
  format = format.replace(regexes[0], (_, y) =>
    this.getFullYear()
      .toString()
      .substr(4 - y.length)
  );

  // 替换星期
  format = format.replace(
    regexes[1],
    (_, e) => (e.length > 1 ? (e.length > 2 ? '\u661f\u671f' : '\u5468') : '') + week[this.getDay()]
  );

  // 替换其他格式
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(format)) {
      format = format.replace(new RegExp('(' + k + ')'), (match, p1) =>
        p1.length === 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
      );
    }
  }

  return format;
};
const tkfn = {
  openWebView(url) {
    let queryStringStart = url.indexOf('?');
    // 如果没有查询字符串，则返回空对象
    if (queryStringStart === -1) {
      url += '?isOpenByTopView=1';
    } else {
      let str = url.substr(queryStringStart + 1);
      let len = str.indexOf('#');
      if (len == -1) {
        url += '&isOpenByTopView=1';
      } else {
        url =
          url.substr(0, queryStringStart + 1) +
          str.split('#')[0] +
          '&isOpenByTopView=1' +
          '#' +
          str.split('#')[1];
      }
    }
    try {
      if (navigator.userAgent.toLowerCase().indexOf('tkim') != -1) {
        // eslint-disable-next-line no-undef
        TKJSSDKWebViewUI.openWebView({ url });
      } else {
        window.open(url);
      }
    } catch (e) {
      showToast.fail('地址打开失败');
    }
  },
  //判断是否为IE浏览器
  isIE() {
    let userAgent = navigator.userAgent;
    let ieStatus = 1;
    if (!!window.ActiveXObject || 'ActiveXObject' in window) {
      if (userAgent.indexOf('Trident') > -1 && userAgent.indexOf('rv:11.0') > -1) {
        ieStatus = 0;
      } else {
        ieStatus = 1;
      }
    }
    return ieStatus;
  },
  //格式化日期处理
  formatDate(val, formt) {
    formt = formt || 'yyyy-MM-dd';
    if (val != null && val != '') {
      if (typeof val == 'object') {
        try {
          return val.format(formt);
        } catch (err) {
          return '';
        }
      } else if (typeof val == 'number') {
        return new Date(val).format(formt);
      } else {
        try {
          val = val.indexOf('-') != -1 ? val.replace(/-/g, '/') : val;
          return new Date(val).format(formt);
        } catch (err) {
          return '';
        }
      }
    }
    return '';
  },
  getUrlParams(url, val) {
    let reg = /([^?&=]+)=([^?&=]*)/g;
    let obj = {};
    url.replace(reg, ($0, $1, $2) => {
      obj[$1] = $2;
    });
    return val ? obj[val] : obj;
  },
  openWebView2(url) {
    try {
      window.location.replace(url);
    } catch (error) {
      window.open(url);
    }
  },
  // 获取当前地域
  getLocation() {
    try {
      // eslint-disable-next-line no-undef
      TKJSSDKLocation.getLocation(function (info) {
        return info;
      });
    } catch (error) {
      console.log(error);
    }
  },
  isJSONString(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      // 解析失败，不是有效的JSON
      return false;
    }
  },
  getQuery(item, url) {
    // 如果没有提供URL，则使用当前页面的URL
    url = url || window.location.href;

    // 查找查询字符串的起始位置
    const queryStringStart = url.indexOf('?');

    // 如果没有查询字符串，则返回空对象
    if (queryStringStart === -1) {
      return item ? '' : {};
    }

    // 提取查询字符串部分
    let queryString = url.slice(queryStringStart + 1);
    if (queryString.indexOf('#') > -1) queryString = queryString.split('#')[0];

    // 创建一个空对象来存储参数
    const params = {};

    // 分割查询字符串为键值对数组
    queryString.split('&').forEach((pair) => {
      // 分割键值对
      const [key, value] = pair.split('=');

      // 去除键和值两端的空格
      const trimmedKey = key.trim();
      const trimmedValue = value ? decodeURIComponent(value.trim()) : '';

      // 如果键已存在且值为数组，则添加到数组中；否则，初始化为数组或单个值
      // eslint-disable-next-line no-prototype-builtins
      if (params.hasOwnProperty(trimmedKey)) {
        if (Array.isArray(params[trimmedKey])) {
          params[trimmedKey].push(trimmedValue);
        } else {
          params[trimmedKey] = [params[trimmedKey], trimmedValue];
        }
      } else {
        params[trimmedKey] = trimmedValue;
      }
    });
    if (item) return params[item] || '';
    return params;
  },
  clipboardReadText() {
    return new Promise((resolve, reject) => {
      if (navigator.clipboard) {
        navigator.clipboard
          .readText()
          .then((text) => {
            console.log(text);
            resolve({ text, code: 0 });
          })
          .catch((err) => {
            console.log(err);
            showToast('读取剪切板未授权');
            resolve({ text: '读取剪切板未授权', code: 1 });
          });
      } else {
        showToast('不支持读取剪切板内容');
        resolve({ text: '浏览器不支持读取剪切板内容', code: 2 });
      }
    });
  },
  async clipboardWriteText(data) {
    function execCommand(v) {
      const t = document.createElement('textarea'),
        n = document.activeElement;
      t.value = v;
      t.setAttribute('readonly', '');
      t.style.contain = 'strict';
      t.style.position = 'absolute';
      t.style.left = '-9999px';
      t.style.fontSize = '12pt';
      const s = document.getSelection(),
        r = s ? s.rangeCount > 0 && s.getRangeAt(0) : null;
      document.body.appendChild(t);
      t.select();
      t.selectionStart = 0;
      t.selectionEnd = v.length;
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          showToast('复制成功！');
        } else {
          showToast('复制失败！');
        }
      } catch (err) {
        showToast('复制失败！');
      }
      document.body.removeChild(t);
      r && (s.removeAllRanges(), s.addRange(r));
      n && n.focus();
    }
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(data)
        .then(() => {
          console.log('navigator.clipboard:s');
          showToast('复制成功！');
        })
        .catch((e) => {
          console.log('navigator.clipboard:error', e);
          execCommand(data);
        });
    } else {
      execCommand(data);
    }
    // if (navigator.userAgent.toLowerCase().indexOf("tkim") != -1 || !navigator.clipboard) {
    //   const textarea = document.createElement("textarea");
    //   textarea.value = innerText;
    //   textarea.style.position = "fixed"; // 防止滚动
    //   document.body.appendChild(textarea);
    //   textarea.select();
    //   try {
    //     const successful = document.execCommand("copy");
    //     if (successful) {
    //       showToast('复制成功！');
    //     } else {
    //       showToast('复制失败！');
    //     }
    //   } catch (err) {
    //     showToast('复制失败！');
    //   }
    //   document.body.removeChild(textarea);
    // } else {
    //   navigator.clipboard.writeText(innerText).then(() => {
    //     showToast('复制成功！');
    //   }).catch(() => {
    //     showToast('复制失败，请重试！');
    //   });
    // }
  }
};
// 示例用法
// console.log(getQueryParameters("https://example.com/page?name=John&age=30&color=blue&color=green"));
// 输出: { name: 'John', age: '30', color: ['blue', 'green'] }
// console.log(getQueryParameters("https://example.com/page?"));
// 输出: {}
// console.log(getQueryParameters());
// 假设当前URL是'https://example.com/page?user=guest'，则输出: { user: 'guest' }
// console.log(getQueryParameters(),user);
// 假设当前URL是'https://example.com/page?user=guest'，则输出: 'guest'
export default tkfn;
