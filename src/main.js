// Vue 3 Application with License Integration
import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index.js';

// Styles via NPM
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap'; // JS for modal/toast

// Custom CSS imports
import './asset/css/style.css';
import './asset/css/forest.css';

// Bootstrap accessibility
import * as bootstrap from 'bootstrap';
window.bootstrap = bootstrap;

// Legacy globals for existing components
import stateManager from './utils/stateManager.js';
import DataService from './utils/dataService.js';
import { getSupabase } from './lib/supabaseClient.js';

const supabaseClient = getSupabase();
window.supabase = window.supabase || { createClient: () => supabaseClient, __env: {} };
if (supabaseClient) {
  window.supabaseClient = supabaseClient;
  window.dataService = new DataService(supabaseClient, stateManager);
  window.stateManager = stateManager;
}

// Chart.js and html2pdf for legacy components
import Chart from 'chart.js/auto';
window.Chart = Chart;

import html2pdf from 'html2pdf.js';
window.html2pdf = html2pdf;

// Global data dan utilities
import './data/quotes.js';
import './utils/dateWita.js';
import './utils/sceneFor.js';
import './utils/toast.js';

// Create Vue 3 app
const app = createApp(App);

// Use router
app.use(router);

// Mount app
app.mount('#app');
