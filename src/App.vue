<template>
  <div id="app">
    <!-- Loading -->
    <div
      v-if="loading"
      class="d-flex justify-content-center align-items-center"
      style="height: 100vh"
    >
      <div class="text-center">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p>Memuat aplikasi...</p>
      </div>
    </div>

    <div v-else>
      <!-- Header Component -->
      <AppHeader
        :user="user"
        @show-auth="showAuthModal"
        @set-view="setView"
        @toggle-notifications="handleToggleNotifications"
      />

      <!-- Sidebar Component -->
      <AppSidebar
        :user="user"
        :current-view="currentView"
        :is-admin="isAdmin"
        @set-view="setView"
      />

      <!-- Bottom Navigation Component -->
      <BottomNavigation
        :user="user"
        :current-view="currentView"
        :is-admin="isAdmin"
        @set-view="setView"
        @show-auth="showAuthModal"
      />

      <!-- Main content area -->
      <main class="main-content" :class="{ 'with-sidebar': !!user }">
        <div class="container-fluid" :class="{ 'px-0': !user && currentView === 'dashboard' }">
          <!-- Landing Page Component -->
          <LandingPage v-if="!user && currentView === 'dashboard'" @show-auth="showAuthModal" />

          <!-- Dynamic Components (Other Views) -->
          <component
            v-if="user"
            :is="currentComponent"
            :user="user"
            :supabase="supabase"
            :daily-quote="dailyQuote"
            :plant="selectedPlant"
            :is-admin="isAdmin"
          >
            <!-- Loading fallback handled by defineAsyncComponent automatically -->
          </component>
        </div>
      </main>

      <!-- Auth Modal Component -->
      <AuthModal
        v-if="showAuth"
        @auth-success="handleAuthSuccess"
        @close-modal="handleCloseModal"
      />

      <!-- Toast Container -->
      <div
        id="toastContainer"
        aria-live="polite"
        aria-atomic="true"
        class="position-fixed top-0 end-0 p-3"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, defineAsyncComponent } from 'vue';
import { getSupabase } from '@/lib/supabaseClient';
import { DAILY_QUOTES } from '@/data/quotes';

const supabase = getSupabase();

// Layout Components (Immediate Load)
import AppHeader from '@/components/layout/AppHeader.vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import BottomNavigation from '@/components/layout/BottomNavigation.vue';
import LandingPage from '@/components/landing/LandingPage.vue';
import AuthModal from '@/components/auth/AuthModal.vue';

// Lazy Load Page Components with loading states
const Dashboard = defineAsyncComponent({
  loader: () => import('@/components/pages/Dashboard.vue'),
  loading: {
    template:
      '<div class="d-flex justify-content-center p-4"><div class="spinner-border text-primary" role="status"></div></div>',
  },
  delay: 200,
});

const Checklist = defineAsyncComponent({
  loader: () => import('@/components/pages/Checklist.vue'),
  loading: {
    template:
      '<div class="d-flex justify-content-center p-4"><div class="spinner-border text-primary" role="status"></div></div>',
  },
  delay: 200,
});

const TaskManager = defineAsyncComponent({
  loader: () => import('@/components/pages/TaskManager.vue'),
  loading: {
    template:
      '<div class="d-flex justify-content-center p-4"><div class="spinner-border text-primary" role="status"></div></div>',
  },
  delay: 200,
});

const Report = defineAsyncComponent({
  loader: () => import('@/components/pages/Report.vue'),
  loading: {
    template:
      '<div class="d-flex justify-content-center p-4"><div class="spinner-border text-primary" role="status"></div></div>',
  },
  delay: 200,
});

const Admin = defineAsyncComponent({
  loader: () => import('@/components/pages/Admin.vue'),
  loading: {
    template:
      '<div class="d-flex justify-content-center p-4"><div class="spinner-border text-primary" role="status"></div></div>',
  },
  delay: 200,
});

const Profile = defineAsyncComponent({
  loader: () => import('@/components/pages/Profile.vue'),
  loading: {
    template:
      '<div class="d-flex justify-content-center p-4"><div class="spinner-border text-primary" role="status"></div></div>',
  },
  delay: 200,
});

// Reactive State
const user = ref(null);
const session = ref(null);
const currentView = ref(localStorage.getItem('currentView') || 'dashboard');
const loading = ref(true);
const dailyQuote = ref('');
const selectedPlant = ref(localStorage.getItem('pt_plant') || 'forest');
const isAdmin = ref(false);
const showAuth = ref(false);

// Computed
const currentComponent = computed(() => {
  const componentMap = {
    dashboard: Dashboard,
    checklist: Checklist,
    tasks: TaskManager,
    report: Report,
    admin: Admin,
    profile: Profile,
  };
  return componentMap[currentView.value] || Dashboard;
});

// Methods
const showAuthModal = () => {
  showAuth.value = true;
};

const handleAuthSuccess = () => {
  showAuth.value = false;
};

const handleCloseModal = () => {
  showAuth.value = false;
};

const handleToggleNotifications = () => {
  // TODO: Implement notification system
  // For now, just show a toast
  showToast('Fitur notifikasi akan segera hadir!', 'info');
};

const setView = (view) => {
  if (view === 'admin' && !isAdmin.value) {
    showToast('Akses admin diperlukan', 'danger');
    currentView.value = 'dashboard';
    return;
  }
  currentView.value = view;
};

// Initialize App (menggunakan logika yang sama dari app.js asli)
const initializeApp = async () => {
  try {
    // Check active session
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    if (currentSession) {
      session.value = currentSession;
      user.value = currentSession.user;

      // Verify account is active
      const active = await ensureAccountActive();
      if (!active) {
        await supabase.auth.signOut();
        showToast('Akun Anda dinonaktifkan: tidak dapat mengakses aplikasi.', 'danger', 6000);
        user.value = null;
        session.value = null;
        isAdmin.value = false;
        loading.value = false;
        return;
      }

      await refreshAdminFlag();
      syncSelectedPlantFromProfile();
      await postLoginBootstrap();
    }

    // Auth state listener (sama dengan app.js asli)
    supabase.auth.onAuthStateChange(async (event, newSession) => {
      const wasLoggedIn = !!user.value;
      const wasUserNull = !user.value;
      const prevUser = user.value;

      // 1) Event yang disebabkan oleh update profil/password/token refresh
      //    Jangan reset user ke null jika newSession tidak tersedia.
      if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        if (newSession?.user) {
          session.value = newSession;
          user.value = newSession.user;
          // Sinkronkan preferensi dari metadata bila diperlukan
          try {
            syncSelectedPlantFromProfile();
            const theme = user.value?.user_metadata?.theme;
            if (theme) applyTheme(theme);
          } catch (_) {}
        } else {
          // Keep previous session/user to avoid component unmount
          session.value = session.value || null;
          user.value = prevUser; // pertahankan user agar komponen tidak unmount
        }
        // Tidak perlu lanjut ke logika SIGNED_IN/OUT
        return;
      }

      // 2) Event normal SIGNED_IN / SIGNED_OUT
      session.value = newSession;
      user.value = newSession?.user || null;

      if (user.value) {
        const active = await ensureAccountActive();
        if (!active) {
          await supabase.auth.signOut();
          showToast('Akun Anda dinonaktifkan: tidak dapat mengakses aplikasi.', 'danger', 6000);
          user.value = null;
          session.value = null;
          isAdmin.value = false;
          return;
        }
        await refreshAdminFlag();
      } else {
        isAdmin.value = false;
      }

      // Tampilkan toast hanya ketika benar-benar fresh login
      if (event === 'SIGNED_IN' && user.value && wasUserNull && !wasLoggedIn) {
        syncSelectedPlantFromProfile();
        await postLoginBootstrap();
        currentView.value = 'dashboard';
        showAuth.value = false;
        setTimeout(() => {
          showToast('Login berhasil', 'success');
        }, 100);
      }

      if (event === 'SIGNED_OUT') {
        currentView.value = 'dashboard';
        selectedPlant.value = localStorage.getItem('pt_plant') || 'forest';
        isAdmin.value = false;
        applyTheme('light');
      }
    });

    setDailyQuote();
    initializeTheme();

    let plantChangeTimeout;
    let themeChangeTimeout;

    window.addEventListener('plant-type-changed', (event) => {
      clearTimeout(plantChangeTimeout);
      plantChangeTimeout = setTimeout(() => {
        selectedPlant.value = event.detail.plantType;
        localStorage.setItem('pt_plant', selectedPlant.value);
      }, 100);
    });

    window.addEventListener('theme-changed', (event) => {
      clearTimeout(themeChangeTimeout);
      themeChangeTimeout = setTimeout(() => {
        const theme = event.detail?.theme || 'light';
        applyTheme(theme);
      }, 100);
    });
  } catch (error) {
    console.error('App initialization error:', error);
  } finally {
    loading.value = false;
  }
};

// Helper functions (menggunakan logika yang sama dari app.js asli)
const refreshAdminFlag = async () => {
  try {
    if (!user.value) {
      isAdmin.value = false;
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.value.id)
      .single();

    if (error) {
      console.warn('refreshAdminFlag: profiles select failed:', error);
      const metaRole = user.value?.user_metadata?.role;
      isAdmin.value = metaRole === 'admin';
      return;
    }

    isAdmin.value = data?.role === 'admin' && data?.is_active !== false;
  } catch (e) {
    console.warn('refreshAdminFlag error:', e);
    isAdmin.value = user.value?.user_metadata?.role === 'admin';
  }
};

const ensureAccountActive = async () => {
  try {
    if (!user.value) return true;
    const { data, error } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', user.value.id)
      .single();
    if (error) {
      console.warn('ensureAccountActive: profiles select failed:', error);
      return true;
    }
    return data?.is_active !== false;
  } catch (e) {
    console.warn('ensureAccountActive error:', e);
    return true;
  }
};

const syncSelectedPlantFromProfile = () => {
  try {
    const metaPlant = user.value?.user_metadata?.plant_type;
    if (typeof metaPlant === 'string' && metaPlant.trim()) {
      selectedPlant.value = metaPlant.trim();
      localStorage.setItem('pt_plant', selectedPlant.value);
    } else {
      selectedPlant.value = localStorage.getItem('pt_plant') || 'forest';
    }
  } catch (_) {
    selectedPlant.value = localStorage.getItem('pt_plant') || 'forest';
  }
};

const initializeTheme = () => {
  try {
    let theme = 'light';
    if (user.value && user.value.user_metadata) {
      theme = user.value.user_metadata.theme || 'light';
    } else {
      theme = localStorage.getItem('app-theme') || 'light';
    }
    applyTheme(theme);
  } catch (error) {
    console.error('Error initializing theme:', error);
    applyTheme('light');
  }
};

const applyTheme = (theme) => {
  document.documentElement.removeAttribute('data-bs-theme');
  document.body.className = document.body.className.replace(/theme-\w+/g, '');

  if (theme === 'dark') {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    document.body.classList.add('theme-dark');
  } else {
    document.documentElement.setAttribute('data-bs-theme', 'light');
    document.body.classList.add('theme-light');
  }

  localStorage.setItem('app-theme', theme);
};

const postLoginBootstrap = async () => {
  try {
    const key = `bootstrap_ran_${user.value.id}`;
    const lastRun = localStorage.getItem(key);
    const today = getToday();
    if (lastRun === today) return;

    await ensureUserRow();
    await materializeTodayTasksFromTemplate();
    await applyOverduePenalties();

    localStorage.setItem(key, today);
  } catch (e) {
    console.error('Bootstrap error:', e);
  }
};

const ensureUserRow = async () => {
  try {
    const payload = [
      { id: user.value.id, email: user.value.email, created_at: new Date().toISOString() },
    ];
    const { error } = await supabase.from('users').upsert(payload, { onConflict: 'id' });
    if (error && error.code !== '23505') throw error;
  } catch (e) {
    console.warn('ensureUserRow skipped/failed:', e.message);
  }
};

const materializeTodayTasksFromTemplate = async () => {
  const today = getToday();
  const { data: templates, error: tErr } = await supabase
    .from('daily_tasks_template')
    .select('id, task_name, priority, category')
    .eq('user_id', user.value.id);
  if (tErr) {
    console.warn('Load templates failed', tErr.message);
    return;
  }
  if (!templates || templates.length === 0) return;

  const { data: instances, error: iErr } = await supabase
    .from('daily_tasks_instance')
    .select('task_id')
    .eq('user_id', user.value.id)
    .eq('date', today);
  if (iErr) {
    console.warn('Load instances failed', iErr.message);
    return;
  }

  const existingIds = new Set((instances || []).map((i) => i.task_id).filter(Boolean));
  const toInsert = templates
    .filter((t) => !existingIds.has(t.id))
    .map((t) => ({
      user_id: user.value.id,
      task_id: t.id,
      task_name: t.task_name,
      priority: t.priority || 'sedang',
      category: t.category || null,
      date: today,
      is_completed: false,
    }));
  if (toInsert.length === 0) return;
  const { error: insErr } = await supabase.from('daily_tasks_instance').insert(toInsert);
  if (insErr) console.warn('Insert instances failed', insErr.message);
};

const applyOverduePenalties = async () => {
  const today = getToday();
  const startDate = getISODateNDaysAgo(30);
  const { data: overdue, error: oErr } = await supabase
    .from('daily_tasks_instance')
    .select('id, task_name, date')
    .eq('user_id', user.value.id)
    .lt('date', today)
    .gte('date', startDate)
    .eq('is_completed', false);
  if (oErr) {
    console.warn('Load overdue failed', oErr.message);
    return;
  }
  if (!overdue || overdue.length === 0) return;

  const reasons = overdue.map((i) => `penalty:${i.id}`);
  const { data: existingLogs, error: lErr } = await supabase
    .from('score_log')
    .select('reason')
    .eq('user_id', user.value.id)
    .in('reason', reasons);
  if (lErr) {
    console.warn('Load score_log failed', lErr.message);
  }
  const existingReasons = new Set((existingLogs || []).map((l) => l.reason));

  const rawPenalty = user.value?.user_metadata?.score_penalty_overdue;
  const parsedPenalty = parseFloat(rawPenalty);
  const penaltyDelta = Number.isFinite(parsedPenalty) ? parsedPenalty : -2;

  const toLog = overdue
    .filter((i) => !existingReasons.has(`penalty:${i.id}`))
    .map((i) => ({
      user_id: user.value.id,
      date: i.date,
      score_delta: penaltyDelta,
      reason: `penalty:${i.id}`,
    }));
  if (toLog.length === 0) return;
  const { error: insLogErr } = await supabase.from('score_log').insert(toLog);
  if (insLogErr) console.warn('Insert penalties failed', insLogErr.message);
};

const setDailyQuote = () => {
  if (!DAILY_QUOTES.length) return;
  try {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today - start;
    const dayOfYear = Math.floor(diff / 86400000);
    dailyQuote.value = DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
  } catch (_) {
    dailyQuote.value = DAILY_QUOTES[0] || '';
  }
};

const getToday = () => {
  return new Date().toISOString().slice(0, 10);
};

const getISODateNDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

// Optimized toast function dengan rate limiting
const showToast = (() => {
  let lastToastTime = 0;
  let lastToastMessage = '';
  const TOAST_COOLDOWN = 2000; // Increased to 2 seconds
  const MESSAGE_COOLDOWN = 5000; // Same message cooldown

  return (message, variant = 'primary', delay = 3000) => {
    const now = Date.now();

    // Prevent same message within 5 seconds
    if (lastToastMessage === message && now - lastToastTime < MESSAGE_COOLDOWN) {
      return;
    }

    // General rate limiting
    if (now - lastToastTime < TOAST_COOLDOWN) {
      return;
    }

    lastToastTime = now;
    lastToastMessage = message;

    try {
      const container = document.getElementById('toastContainer');
      if (!container) return;

      // Limit to 2 toasts maximum
      const existingToasts = container.children.length;
      if (existingToasts >= 2) {
        // Remove oldest toast
        while (container.children.length >= 2) {
          container.removeChild(container.firstChild);
        }
      }

      const toastEl = document.createElement('div');
      toastEl.className = `toast align-items-center text-bg-${variant} border-0`;
      toastEl.setAttribute('role', 'alert');
      toastEl.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>`;

      container.appendChild(toastEl);
      const toast = new window.bootstrap.Toast(toastEl, { delay });
      toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
      toast.show();
    } catch (error) {
      console.error('Toast error:', error);
    }
  };
})();

// Watchers
watch(currentView, (val) => {
  localStorage.setItem('currentView', val);
});

// Lifecycle
onMounted(() => {
  initializeApp();
});
</script>
