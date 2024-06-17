import { createApp } from 'vue'
import './index.css'
import { vuetify } from "./plugins/vuetify";
import App from './App.vue'


createApp(App).use(vuetify).mount("#app");