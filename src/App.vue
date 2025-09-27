<template>
  <div id="app">
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
      <AppHeader
        :user="user"
        @show-auth="showAuthModal"
        @set-view="setView"
        @toggle-notifications="handleToggleNotifications"
      />

      <AppSidebar
        :user="user"
        :current-view="currentView"
        :is-admin="isAdmin"
        @set-view="setView"
      />

      <BottomNavigation
        :user="user"
        :current-view="currentView"
        :is-admin="isAdmin"
        @set-view="setView"
        @show-auth="showAuthModal"
      />

      <main class="main-content" :class="{ 'with-sidebar': !!user }">
        <div class="container-fluid" :class="{ 'px-0': !user && currentView === 'dashboard' }">
          <LandingPage v-if="!user && currentView === 'dashboard'" @show-auth="showAuthModal" />

          <component
            v-if="user"
            :is="currentComponent"
            :user="user"
            :supabase="supabase"
            :daily-quote="dailyQuote"
            :plant="selectedPlant"
            :is-admin="isAdmin"
          />
        </div>
      </main>

      <AuthModal
        v-if="showAuth"
        @auth-success="handleAuthSuccess"
        @close-modal="handleCloseModal"
      />

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
import { ref, computed, watch, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue';
import { getSupabase } from '@/lib/supabaseClient';
import { DAILY_QUOTES } from '@/data/quotes';
import stateManager from '@/utils/stateManager.js';
import DataService from '@/utils/dataService.js';

const supabase = getSupabase();
const dataService = new DataService(supabase, stateManager);

import AppHeader from '@/components/layout/AppHeader.vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import BottomNavigation from '@/components/layout/BottomNavigation.vue';
import LandingPage from '@/components/landing/LandingPage.vue';
import AuthModal from '@/components/auth/AuthModal.vue';

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

const user = ref(null);
const session = ref(null);
const currentView = ref(localStorage.getItem('currentView') || 'dashboard');
const loading = ref(true);
const dailyQuote = ref('');
const selectedPlant = ref(localStorage.getItem('pt_plant') || 'forest');
const isAdmin = ref(false);
const showAuth = ref(false);

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
  showToast('Fitur notifikasi akan segera hadir!', 'info');
};

const setView = (view) => {
  const publicViews = ['dashboard'];
  if (!user.value && !publicViews.includes(view)) {
    showToast('Silakan login untuk mengakses menu ini', 'warning');
    currentView.value = 'dashboard';
    showAuth.value = true;
    return;
  }

  if (view === 'admin' && !isAdmin.value) {
    showToast('Akses admin diperlukan', 'danger');
    currentView.value = 'dashboard';
    return;
  }

  currentView.value = view;
};

const initializeApp = async () => {
  try {
    window.stateManager = stateManager;
    window.dataService = dataService;

    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();

    if (currentSession) {
      session.value = currentSession;
      user.value = currentSession.user;
      window.user = currentSession.user; // Expose for DataService

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
      // Start realtime listeners after login
      dataService.initRealtime(user.value.id);
      await postLoginBootstrap();
    } else {
      // Ensure LandingPage is visible when not authenticated
      currentView.value = 'dashboard';
    }

    supabase.auth.onAuthStateChange(async (event, newSession) => {
      const wasLoggedIn = !!user.value;
      const wasUserNull = !user.value;
      const prevUser = user.value;

      if (event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') {
        if (newSession?.user) {
          session.value = newSession;
          user.value = newSession.user;
          try {
            syncSelectedPlantFromProfile();
            const theme = user.value?.user_metadata?.theme;
            if (theme) applyTheme(theme);
          } catch (_) {}
        } else {
          session.value = session.value || null;
          user.value = prevUser;
        }
        return;
      }

      session.value = newSession;
      user.value = newSession?.user || null;
      window.user = newSession?.user || null; // Keep global user in sync

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

      if (event === 'SIGNED_IN' && user.value && wasUserNull && !wasLoggedIn) {
        syncSelectedPlantFromProfile();
        // Start realtime when signed in
        dataService.initRealtime(user.value.id);
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
        stateManager.clearCache();
        // Stop realtime listeners on logout
        dataService.teardownRealtime();
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
  try {
    const meta =
      document.querySelector('meta[name="theme-color"]') ||
      (() => {
        const m = document.createElement('meta');
        m.setAttribute('name', 'theme-color');
        document.head.appendChild(m);
        return m;
      })();
    const color = theme === 'dark' ? '#0b1220' : '#ffffff';
    meta.setAttribute('content', color);
  } catch (_) {}
};

const postLoginBootstrap = async () => {
  try {
    const key = `bootstrap_ran_${user.value.id}`;
    const lastRun = localStorage.getItem(key);
    const today = getToday();
    if (lastRun === today) return;

    await dataService.syncFromTemplates(user.value.id, today);
    await applyOverduePenalties();

    localStorage.setItem(key, today);
  } catch (e) {
    console.error('Bootstrap error:', e);
  }
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

  const penalty = Number.isFinite(parseFloat(window.userScorePenalty))
    ? parseFloat(window.userScorePenalty)
    : -0.5;

  for (const task of overdue) {
    try {
      await dataService.logScoreChange(user.value.id, penalty, `Terlambat: ${task.task_name}`);
    } catch (e) {
      console.warn('Penalty log failed:', e);
    }
  }

  try {
    await supabase
      .from('daily_tasks_instance')
      .update({ is_completed: true })
      .in(
        'id',
        overdue.map((t) => t.id),
      );
  } catch (e) {
    console.warn('Mark overdue as completed failed:', e);
  }
};

const setDailyQuote = () => {
  const today = getToday();
  const hash = today.split('').reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  const index = Math.abs(hash) % DAILY_QUOTES.length;
  dailyQuote.value = DAILY_QUOTES[index];
};

const getToday = () => {
  return window.WITA?.today?.() || new Date().toISOString().slice(0, 10);
};

const getISODateNDaysAgo = (n) => {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date.toISOString().slice(0, 10);
};

const showToast = (() => {
  let lastToastTime = 0;
  let lastToastMessage = '';
  const TOAST_COOLDOWN = 1000;
  const MESSAGE_COOLDOWN = 5000;

  return (message, variant = 'info', delay = 4000) => {
    const now = Date.now();

    if (lastToastMessage === message && now - lastToastTime < MESSAGE_COOLDOWN) {
      return;
    }

    if (now - lastToastTime < TOAST_COOLDOWN) {
      return;
    }

    lastToastTime = now;
    lastToastMessage = message;

    try {
      const container = document.getElementById('toastContainer');
      if (!container) return;

      const existingToasts = container.children.length;
      if (existingToasts >= 2) {
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

watch(currentView, (val) => {
  localStorage.setItem('currentView', val);
});

onMounted(() => {
  initializeApp();
  const onOffline = () => showToast('Koneksi internet terputus', 'warning');
  const onOnline = () => showToast('Kembali online', 'success');
  window.addEventListener('offline', onOffline);
  window.addEventListener('online', onOnline);
  window.__netListeners = { onOffline, onOnline };

  // PWA Update Detection & Auto-reload
  setupPWAUpdateListener();

  try {
    scheduleLocalReminders();
  } catch (_) {}

  try {
    const params = new URLSearchParams(window.location.search);
    const open = params.get('open');
    // Only honor deep-link for public view when logged out; otherwise require login
    if (open && (open === 'dashboard' || !!user.value)) setView(open);
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', (e) => {
        const v = e.data?.view;
        if (e.data?.type === 'open-view' && v) setView(v);
      });
    }
  } catch (_) {}
});

onBeforeUnmount(() => {
  try {
    dataService.teardownRealtime();
  } catch (_) {}
  try {
    if (window.__netListeners) {
      window.removeEventListener('offline', window.__netListeners.onOffline);
      window.removeEventListener('online', window.__netListeners.onOnline);
    }
  } catch (_) {}
});

function scheduleLocalReminders() {
  const scheduleAt = (h) => {
    const now = new Date();
    const tzOffsetMs = 8 * 60 * 60 * 1000; // WITA UTC+8 for reminders
    const witaNow = new Date(now.getTime() + tzOffsetMs);
    const target = new Date(witaNow);
    target.setHours(h, 0, 0, 0);
    let delay = target.getTime() - witaNow.getTime();
    if (delay < 0) delay += 24 * 60 * 60 * 1000;
    setTimeout(() => {
      fireLocalReminder(h);
      setInterval(() => fireLocalReminder(h), 24 * 60 * 60 * 1000);
    }, delay);
  };

  scheduleAt(6);
  scheduleAt(18);
}

function fireLocalReminder(hour) {
  const today = getToday();
  const key = `local_reminder_${hour}_${today}`;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');

  const title = hour === 6 ? 'Pengingat pagi' : 'Pengingat sore';
  const body =
    hour === 6 ? 'Mulai hari ini dengan menyelesaikan tugas.' : 'Cek tugas yang belum selesai.';

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: '/icons/icon-192.png' });
      return;
    } catch (_) {}
  }
  showToast(`${title}: ${body}`, 'info');
}

function setupPWAUpdateListener() {
  if (!('serviceWorker' in navigator)) return;

  let updateAvailable = false;
  let deferredReload = null;

  // Listen for service worker updates
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (updateAvailable) {
      showToast('🔄 Aplikasi telah diperbarui! Memuat ulang...', 'success', 2000);
      setTimeout(() => window.location.reload(), 2000);
    }
  });

  // Register update listener
  navigator.serviceWorker.ready.then((registration) => {
    // Check for updates every 10 minutes when app is active
    setInterval(
      () => {
        if (!document.hidden) {
          registration.update();
        }
      },
      10 * 60 * 1000,
    );

    // Listen for waiting service worker
    if (registration.waiting) {
      showUpdateToast(registration.waiting);
    }

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateToast(newWorker);
        }
      });
    });

    // Auto-check for updates on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        registration.update();
      }
    });
  });

  function showUpdateToast(worker) {
    updateAvailable = true;
    deferredReload = worker;

    // Auto-update after 5 seconds or user can click to update immediately
    showToast(
      '🆕 Versi baru tersedia! <button class="btn btn-sm btn-light ms-2" onclick="window.__immediateUpdate()">Update Sekarang</button>',
      'primary',
      8000,
    );

    // Auto-update after 8 seconds
    setTimeout(() => {
      if (updateAvailable && deferredReload) {
        triggerUpdate(deferredReload);
      }
    }, 8000);

    // Expose immediate update function
    window.__immediateUpdate = () => {
      if (deferredReload) {
        triggerUpdate(deferredReload);
      }
    };
  }

  function triggerUpdate(worker) {
    updateAvailable = false;
    worker.postMessage({ type: 'SKIP_WAITING' });
    showToast('🔄 Memperbarui aplikasi...', 'info', 3000);
  }
}
</script>

<style>
.main-content {
  padding-top: 76px;
  min-height: 100vh;
}

.main-content.with-sidebar {
  margin-left: 250px;
}

@media (max-width: 768px) {
  .main-content.with-sidebar {
    margin-left: 0;
    padding-bottom: 70px;
  }
}
</style>
