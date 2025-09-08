// Expose Vue 2 (from NPM) as a global so legacy scripts using Vue.component/new Vue still work
import Vue from 'vue';
window.Vue = Vue;
