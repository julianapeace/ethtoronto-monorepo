import Vue from "vue";
import App from "./App.vue";
import { ethers } from "ethers";
import VueConfetti from 'vue-confetti'
import Buefy from 'buefy'
import 'buefy/dist/buefy.css'

Vue.use(Buefy)

Vue.use(VueConfetti)

Vue.use(ethers);

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount("#app");
