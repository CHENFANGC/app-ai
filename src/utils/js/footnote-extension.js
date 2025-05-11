import { marked } from 'marked';
import hljs from 'highlight.js';
import tkfn from '../lib/common';
// uglifyjs footnote-extension.js -m -o footnote-extension.min.js

let queryLocalId = null;
// 扩展的渲染器
const renderer = new marked.Renderer();
renderer.link = (args) => {
  let { href, text, raw, id } = args;
  if (href.match(/https?:\/\/[^\s]+type=(mp4|avi|mov|mkv|flv|wmv)/g)) {
    // 定义正则表达式，匹配中括号中的内容
    const regex1 = /\（([^)]+)\）/;
    // 使用正则表达式进行匹配
    const match1 = text.match(regex1);
    let extractedText = '';
    if (match1) {
      // 提取匹配到的内容
      extractedText = match1[1];
    }
    // 定义正则表达式，匹配括号前面的内容
    const regex2 = /^([^(]+)\（/;
    // 使用正则表达式进行匹配
    const match2 = text.match(regex2);
    let title = text;
    if (match2) {
      // 提取匹配到的内容
      title = match2[1].trim();
    }
    let html = '';
    html +=
      '<a style="display:none;" url="' +
      href +
      '" onclick="tKopenWebView(event,\'' +
      href +
      '\')" target="_blank" ></a>';
    html +=
      '<div onclick="tKopenWebView(event, \'' +
      href +
      '\')"><div style="display:inline-block;width:100%">' +
      '<img width="100%" src=\'' +
      extractedText +
      "' />" +
      // + + '<video width="100%" controls poster=\"'
      // + extractedText + '\")><source src=\'' + href + '\' type="video/' + href.split('.').pop()
      // + '\">Your browser does not support the video tag.</video>' +
      '</div><div style="font-size:0.8rem;line-height:0.8rem">' +
      id +
      '、' +
      title +
      '</div></div>';
    return html;
  }
  const regex = /[^0-9]*(\d+):/; // 匹配冒号前面的非数字字符，并捕获数字
  const result = text.replace(regex, '$1、'); // 只保留捕获的数字
  return (
    '<a href="" url="' +
    href +
    '" onclick="tKopenWebView(event,\'' +
    href +
    '\')" target="_blank">' +
    result +
    '</a>'
  );
  // console.log("header", args, href, text);
};
// 覆盖表格渲染方法，添加div
renderer.table = ({ header, rows }) => {
  let th = header.map((item) => '<th>' + marked(item.text) + '</th>').join('');
  th = '<tr>' + th + '</tr>';
  let td = rows
    .map((item) => {
      let tr = item.map((el) => '<td>' + marked(el.text) + '</td>').join('');
      tr = '<tr>' + tr + '</tr>';
      return tr;
    })
    .join('');
  return (
    '<div class="gbi-table"><table><thead>' + th + '</thead><tbody>' + td + '</tbody></table></div>'
  );
};
renderer.html = function ({ type, text }) {
  const language = hljs.getLanguage(type) ? type : 'html';
  return hljs.highlight(text, { language }).value;
  // let dataHtml = '<pre><div class="language-type">' + language + '\<div class="language-copy" onclick="copyCode(event)">复制</div></div></div><code class="hljs language-' + language + '">';
  // return dataHtml + hljs.highlight(text, { language }).value + "</code></pre>";
};
renderer.code = function ({ lang, text }) {
  // lang: "html"
  // raw: "'''html\n<video width=\"320\" height=\"240\" controls>\n  <source src=\"视频文件路径.mp4\" type=\"video/mp4\">\n  您的浏览器不支持 video 标签。\n</video>\n'''"
  // text: "<video width=\"320\" height=\"240\" controls>\n  <source src=\"视频文件路径.mp4\" type=\"video/mp4\">\n  您的浏览器不支持 video 标签。\n</video>"
  // type: "code"
  // 在这里调用 markedHighlight 来高亮代码
  const language = hljs.getLanguage(lang) ? lang : 'html';
  let dataHtml =
    '<pre><div class="language-type">' +
    language +
    '<span class="language-copy" onclick="copyCode(event)">复制</span></div><code class="hljs language-' +
    language +
    '">';
  return dataHtml + hljs.highlight(text, { language }).value + '</code></pre>';
};

// 定义脚注扩展-链接
const footnoteExtension = {
  name: 'footnote',
  level: 'block', // 处理级别为块级
  start(src) {
    return src.match(/\[\^/) && src.match(/\[\^/).index ? src.match(/\[\^/).index : undefined;
  },
  tokenizer(src, tokens) {
    const rule = /^\[\^([^\]]+)\]:\s*([\s\S]+?)(?=\n\n|\n*$)/;
    const match = rule.exec(src);
    if (match) {
      return {
        type: 'footnote',
        raw: match[0],
        identifier: match[1],
        text: match[2].trim(),
        tokens: this.lexer.blockTokens(match[2].trim())
      };
    }
  },
  renderer(token) {
    let id = token.identifier; //token.id || 1
    // let html = '<div id="'+queryLocalId}footsup'+token.identifier+'" class="footnote">['+token.identifier
    let html = "<div id='" + queryLocalId + 'footsup' + id + "' ";
    // token.tokens[0]["id"] = id
    // token.tokens[0]["tokens"][0]["id"] = id;
    if (token.tokens[0].text.match(/https?:\/\/[^\s]+type=(mp4|avi|mov|mkv|flv|wmv)/g)) {
      html += " class='footnote-video'> ";
    } else {
      html += " class='footnote'>" + id + '、';
    }
    html += this.parser.parse([token.tokens[0]]) + '</div>';
    if (token.tokens[1]) {
      // token.tokens[1]["id"] = token.identifier == token.tokens[1]["identifier"] ? id : id + 1;
      html += this.parser.parse([token.tokens[1]]);
    }
    return html;
  }
};

// 定义脚注引用扩展-引用序号
const footnoteRefExtension = {
  name: 'footnoteRef',
  level: 'inline', // 处理级别为行内
  start(src) {
    return src.match(/\[\^\d+/) && src.match(/\[\^\d+/).index
      ? src.match(/\[\^\d+/).index
      : undefined;
  },
  tokenizer(src, tokens) {
    const rule = /^\[\^(\d+.*?)\]/; ///^\[\^\d([^\]]+)\]/
    const match = rule.exec(src);
    let srcUrl = '';
    let match1;
    const pattern = /\((https?:\/\/[^\s)]+)\)/g;
    while ((match1 = pattern.exec(src)) !== null) {
      srcUrl = match1[0];
    }
    if (match) {
      // let filterArr = tokens.filter((item) => item.type === 'footnoteRef' && item.identifier!= null);
      // let id = 1
      // if (filterArr.length > 0) {
      //   let index = filterArr.findIndex((item) => item.identifier.match(/^\d+/)[0] == match[1].match(/^\d+/)[0]);
      //   if (index != -1) {
      //     id = filterArr[index].id;
      //   } else {
      //     id = filterArr[filterArr.length - 1].id + 1;
      //   }
      // };
      return {
        type: 'footnoteRef',
        raw: match[0],
        id: match[1], //id,
        identifier: match[1],
        srcUrl: srcUrl
      };
    }
  },
  renderer(token) {
    let match = String(token.identifier).match(/^\d+/);
    if (!match) {
      return token.raw;
    }
    // 匹配小括号外的数字
    const outsideNum = match[0];
    // 匹配小括号内的数字
    let arr = String(token.identifier).match(/\(t=(\d+)\)/);
    const insideNum = arr && arr[1] ? arr[1] : null;
    // return '<sup onclick="tKopenSup(event,''+queryLocalId}footsup'+token.id}')">['+token.identifier}]</sup>';
    return (
      '<span class="a-sup" onclick="tKopenSup(event,\'' +
      queryLocalId +
      'footsup' +
      outsideNum +
      "','" +
      insideNum +
      '\')">' +
      outsideNum +
      '</span>'
    );
  }
};
// 使用自定义渲染器
marked.setOptions({
  renderer: renderer
});
// 添加扩展到marked
marked.use({ extensions: [footnoteExtension, footnoteRefExtension] });

window.tKopenSup = (e, id, time) => {
  e.preventDefault();
  if (!document.getElementById(id).children[0].children[0]) return;
  console.log(id, time, 'id, time');
  if (time != 'null') {
    let url = document.getElementById(id).getElementsByTagName('a')[0].getAttribute('url');
    let name = document.getElementById(id).getElementsByTagName('a')[0].innerHTML;
    url += '&currentTime=' + time;
    tKopenWebView(e, url, name);
  } else {
    document.getElementById(id).children[0].children[0].click();
  }
};

// 修改 tKopenWebView 方法，使用 Popup 组件而不是打开新页面
window.tKopenWebView = (e, url, title) => {
  e && e.preventDefault();
  
  // 如果在全局范围内存在 openSearchReference 方法，则调用它
  if (window.openSearchReference) {
    // 创建一个搜索结果对象，模拟 openSearchReference 的参数格式
    const webResult = {
      title: title || "网页内容",
      url: url,
      passage: "正在查看网页内容...",
      site: url.includes('://') ? new URL(url).hostname : '未知来源',
      date: new Date().toLocaleDateString(),
      fromReference: true,  // 标记为引用打开，这样点击关闭时会直接关闭弹窗
      index: 0  // 默认索引，可能需要根据实际情况调整
    };
    
    // 调用全局的 openSearchReference 方法
    window.openSearchReference(webResult);
  } else {
    // 如果没有找到 openSearchReference 方法，则使用传统方式打开链接
    console.log('打开链接:', url, title);
    // 可以选择是否保留原始行为作为后备方案
    if (typeof tKopenWebView === 'function') {
      tKopenWebView(e, url, title);
    } else if (window.open) {
      window.open(url, '_blank');
    }
  }
};

// 复制代码
window.copyCode = (e) => {
  let innerText = e.target.parentElement.nextElementSibling.innerText;
  tkfn.clipboardWriteText(innerText);
};

const markedData = (text, id, tKopenWebViewParam) => {
  queryLocalId = id;
  
  // 如果传入了自定义的 tKopenWebView 对象
  if (tKopenWebViewParam) {
    // 如果传入的是对象，并且包含 openSearchReference 方法
    if (typeof tKopenWebViewParam === 'object' && tKopenWebViewParam.openSearchReference) {
      // 将 openSearchReference 方法暴露给全局，供 tKopenWebView 使用
      window.openSearchReference = tKopenWebViewParam.openSearchReference;
      
      // 如果还包含 handler 方法，则使用它替换全局的 tKopenWebView 方法
      if (tKopenWebViewParam.handler) {
        window.tKopenWebView = tKopenWebViewParam.handler;
      }
    } else if (typeof tKopenWebViewParam === 'function') {
      // 如果传入的是函数，则使用它替换全局的 tKopenWebView 方法
      window.tKopenWebView = tKopenWebViewParam;
    }
  }
  
  try {
    return marked(text);
  } catch (error) {
    console.log(error);
    return text;
  }
};

export default markedData;
