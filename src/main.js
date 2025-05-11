import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import {
  Button,
  NavBar,
  Cell,
  Image,
  Badge,
  List,
  PullRefresh,
  Dialog,
  Field,
  Toast,
  Popup,
  Icon
} from 'vant';
import 'vant/lib/index.css';

const app = createApp(App);

// 注册Vant组件
app.use(Button);
app.use(NavBar);
app.use(Cell);
app.use(Image);
app.use(Badge);
app.use(List);
app.use(PullRefresh);
app.use(Dialog);
app.use(Field);
app.use(Toast);
app.use(Popup);
app.use(Icon);

app.use(router);
app.mount('#app');
