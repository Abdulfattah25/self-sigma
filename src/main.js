// Ensure Vue 2 global for legacy components
import './vue-global.js';

// Styles via NPM (replaces CDN links)
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap'; // JS for modal/toast attached to window via import side-effects

// Custom CSS imports
import './asset/css/style.css';
import './asset/css/forest.css';

// Make bootstrap accessible as window.bootstrap for legacy code
import * as bootstrap from 'bootstrap';
window.bootstrap = bootstrap;

// Supabase singleton helper
import { getSupabase } from './lib/supabaseClient.js';
import stateManager from './utils/stateManager.js';
import DataService from './utils/dataService.js';

// Score helper for hybrid score calculation
import './utils/scoreHelper.js';

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

// Global data
import './data/quotes.js';
import './utils/dateWita.js';
import './utils/sceneFor.js';

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
    import('./components/pages/PlantTile.vue'),
    import('./components/pages/ForestGrid.vue'),
    import('./components/pages/ForestPanel.vue'),
    import('./components/pages/Dashboard.vue'),
    import('./components/pages/Checklist.vue'),
    import('./components/pages/TaskManager.vue'),
    import('./components/pages/Report.vue'),
    import('./components/pages/Profile.vue'),
    import('./components/pages/Admin.vue'),
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

  // Initialize Vue app with App.vue as root component
  const { default: App } = await import('./App.vue');

  new window.Vue({
    el: '#app',
    render: (h) => h(App),
  });
})();

// PWA Service Worker registration
import { registerSW } from 'virtual:pwa-register';
const showToast = (message, variant = 'info', delay = 4000, action) => {
  try {
    const container =
      document.getElementById('toastContainer') ||
      (() => {
        const el = document.createElement('div');
        el.id = 'toastContainer';
        el.className = 'position-fixed top-0 end-0 p-3';
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-atomic', 'true');
        document.body.appendChild(el);
        return el;
      })();

    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-bg-${variant} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        ${action ? `<button type="button" class="btn btn-light btn-sm me-2 m-auto">${action.label}</button>` : ''}
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>`;

    const actionBtn = toastEl.querySelector('button.btn.btn-light');
    if (actionBtn && typeof action.onClick === 'function') {
      actionBtn.addEventListener('click', () => action.onClick());
    }

    container.appendChild(toastEl);
    const toast = new window.bootstrap.Toast(toastEl, { delay });
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    toast.show();
  } catch (_) {}
};

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    showToast('Versi baru tersedia', 'info', 8000, {
      label: 'Muat ulang',
      onClick: () => updateSW(true),
    });
  },
});
