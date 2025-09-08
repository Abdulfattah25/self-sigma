// Ensure Vue 2 global for legacy components
import './vue-global.js';

// Styles via NPM (replaces CDN links)
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap'; // JS for modal/toast attached to window via import side-effects

// Make bootstrap accessible as window.bootstrap for legacy code
import * as bootstrap from 'bootstrap';
window.bootstrap = bootstrap;

// Import State Manager and Data Service
import stateManager from '../js/utils/stateManager.js';
import DataService from '../js/utils/dataService.js';

// Libs via NPM (expose globals for legacy code that uses window.*)
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url);
const SUPABASE_ANON =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.anonKey);
window.supabase = {
  createClient: createSupabaseClient,
  __env: { url: SUPABASE_URL, anon: SUPABASE_ANON },
};

// Initialize DataService when supabase is ready
if (SUPABASE_URL && SUPABASE_ANON) {
  const supabaseClient = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON);
  window.dataService = new DataService(supabaseClient, stateManager);
  window.stateManager = stateManager;
}

import Chart from 'chart.js/auto';
window.Chart = Chart;

import html2pdf from 'html2pdf.js';
window.html2pdf = html2pdf;

// Global config/data
import '../js/config.js';
import '../data/quotes.js';
import '../js/utils/dateWita.js';
import '../js/utils/sceneFor.js';

// Load legacy global-registered components
(async () => {
  const [
    { default: PlantTile },
    { default: ForestGrid },
    { default: ForestPanel },
    { default: Dashboard },
    { default: Checklist },
    { default: TaskManager },
    { default: Report },
    { default: Profile },
    { default: Admin },
  ] = await Promise.all([
    import('./components/PlantTile.vue'),
    import('./components/ForestGrid.vue'),
    import('./components/ForestPanel.vue'),
    import('./components/Dashboard.vue'),
    import('./components/Checklist.vue'),
    import('./components/TaskManager.vue'),
    import('./components/Report.vue'),
    import('./components/Profile.vue'),
    import('./components/Admin.vue'),
  ]);
  window.Vue.component('plant-tile', PlantTile);
  window.Vue.component('forest-grid', ForestGrid);
  window.Vue.component('forest-panel', ForestPanel);
  window.Vue.component('dashboard', Dashboard);
  window.Vue.component('checklist', Checklist);
  window.Vue.component('task-manager', TaskManager);
  window.Vue.component('report', Report);
  window.Vue.component('profile', Profile);
  window.Vue.component('admin', Admin);

  // Start root app
  await import('../js/app.js');
})();
