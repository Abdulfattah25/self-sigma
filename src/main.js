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

// Supabase singleton helper
import { getSupabase } from './lib/supabaseClient.js';

// Initialize a single Supabase client and reuse it everywhere
const supabaseClient = getSupabase();
// Provide a tiny shim for legacy code expecting window.supabase.createClient
window.supabase = window.supabase || { createClient: () => supabaseClient, __env: {} };
if (supabaseClient) {
  window.supabaseClient = supabaseClient;
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
