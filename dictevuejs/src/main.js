import Vue from 'vue'
import App from './App.vue'
import VueTypedJs from 'vue-typed-js'

import 'jquery/src/jquery.js';
import 'popper.js/dist/popper.min.js';
import 'bootstrap/dist/js/bootstrap.min.js';

Vue.config.productionTip = false

Vue.use(VueTypedJs)

new Vue({
  render: h => h(App),
}).$mount('#app')
