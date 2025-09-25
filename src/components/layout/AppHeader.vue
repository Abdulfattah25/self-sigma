<template>
  <nav
    v-if="user"
    class="navbar navbar-dark app-navbar modern-navbar"
    :class="{ 'bg-elegant': !user, 'bg-primary': !!user }"
  >
    <div class="container-fluid d-flex align-items-center w-100 px-3">
      <a
        class="navbar-brand d-flex align-items-center"
        href="#"
        @click.prevent="$emit('set-view', 'dashboard')"
      >
        <span class="brand-badge">🌱</span>
        <span>Productivity Tracker</span>
      </a>

      <ul class="navbar-nav d-none flex-row ms-4"></ul>

      <ul class="navbar-nav ms-auto">
        <li v-if="!user" class="nav-item">
          <a
            class="nav-link btn btn-sm rounded-pill px-3 text-light fw-semibold shadow-sm d-none d-md-inline-flex"
            href="#"
            @click.prevent="$emit('show-auth')"
            >Masuk</a
          >
        </li>
        <li v-else class="nav-item">
          <div class="d-flex align-items-center gap-3">
            <a
              class="nav-link position-relative"
              href="#"
              @click.prevent="toggleBell"
              :title="bellTitle"
            >
              <i
                :class="[
                  'fs-5',
                  enabled ? 'bi bi-bell-fill text-warning' : 'bi bi-bell text-light',
                ]"
              ></i>
              <span
                v-if="hasUnreadNotifications"
                class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"
              >
                <span class="visually-hidden">Notifikasi baru</span>
              </span>
            </a>
          </div>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import {
  getPermissionStatus,
  requestPermission,
  subscribePush,
  unsubscribePush,
  hasActiveSubscription,
} from '@/services/pushService';

const props = defineProps({
  user: Object,
});

const emit = defineEmits(['show-auth', 'set-view', 'toggle-notifications']);

const hasUnreadNotifications = ref(true);
const enabled = ref(false);
const formatUserName = computed(() => {
  return props.user?.user_metadata?.full_name || props.user?.email?.split('@')[0] || 'User';
});

const toggleNotifications = () => {
  emit('toggle-notifications');
  hasUnreadNotifications.value = false;
};

const bellTitle = computed(() =>
  enabled.value ? 'Nonaktifkan notifikasi' : 'Aktifkan notifikasi',
);

function toast(msg, variant = 'info', delay = 3000) {
  try {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast align-items-center text-bg-${variant} border-0`;
    el.setAttribute('role', 'alert');
    el.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
    container.appendChild(el);
    const t = new window.bootstrap.Toast(el, { delay });
    el.addEventListener('hidden.bs.toast', () => el.remove());
    t.show();
  } catch (_) {}
}

async function toggleBell() {
  if (!props.user) return;
  const status = await getPermissionStatus();
  if (status === 'denied') {
    toast(
      'Notifikasi diblokir di browser. Buka Settings > Notifications untuk mengaktifkan.',
      'warning',
      6000,
    );
    return;
  }
  if (enabled.value) {
    try {
      await unsubscribePush(props.user.id);
      enabled.value = false;
      toast('Notifikasi dimatikan', 'secondary');
    } catch (e) {
      toast('Gagal menonaktifkan notifikasi', 'danger');
    }
    return;
  }
  const perm = status === 'default' ? await requestPermission() : status;
  if (perm !== 'granted') {
    toast('Izin notifikasi diperlukan untuk mengaktifkan.', 'warning');
    return;
  }
  try {
    await subscribePush(props.user.id);
    enabled.value = true;
    toast('Notifikasi diaktifkan', 'success');
  } catch (e) {
    const msg = e?.message?.includes('VAPID')
      ? 'VAPID key belum dikonfigurasi. Set VITE_VAPID_PUBLIC_KEY di .env.'
      : 'Gagal mengaktifkan notifikasi.';
    toast(msg, 'danger', 6000);
  }
}

onMounted(async () => {
  try {
    const status = await getPermissionStatus();
    if (status === 'granted') {
      enabled.value = await hasActiveSubscription();
    } else {
      enabled.value = false;
    }
  } catch (_) {}
});
</script>
