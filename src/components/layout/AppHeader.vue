<template>
  <div>
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
                role="button"
                @click.prevent="showNotificationModal"
                :title="bellTitle"
              >
                <i :class="bellIconClass"></i>
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

    <!-- Notification Modal -->
    <div class="modal fade" id="notificationModal" tabindex="-1" v-if="showModal">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">🔔 Notifikasi Harian</h5>
            <button type="button" class="btn-close" @click="closeModal"></button>
          </div>
          <div class="modal-body">
            <p>Aktifkan notifikasi untuk menerima pengingat setiap hari:</p>
            <ul class="mb-3">
              <li><strong>06:00 pagi</strong> - Pengingat memulai hari</li>
              <li><strong>18:00 sore</strong> - Pengingat tugas yang belum selesai</li>
            </ul>
            <div class="alert alert-info small">
              <i class="bi bi-info-circle me-1"></i>
              <strong>Catatan:</strong> Notifikasi push hanya berfungsi optimal saat aplikasi sudah
              ditambahkan ke home screen (diinstall sebagai PWA).
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="rejectNotification">
              Tolak
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="acceptNotification"
              :disabled="processing"
            >
              <span v-if="processing" class="spinner-border spinner-border-sm me-2"></span>
              Terima
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
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

const hasUnreadNotifications = ref(false);
const enabled = ref(false);
const processing = ref(false);
const showModal = ref(false);
const formatUserName = computed(() => {
  return props.user?.user_metadata?.full_name || props.user?.email?.split('@')[0] || 'User';
});

const toggleNotifications = () => {
  emit('toggle-notifications');
  hasUnreadNotifications.value = false;
};

const bellTitle = computed(() => {
  return enabled.value ? 'Nonaktifkan notifikasi' : 'Aktifkan notifikasi';
});

const bellIconClass = computed(() => {
  return [
    'fs-5',
    'bi',
    enabled.value ? 'bi-bell-fill' : 'bi-bell',
    enabled.value ? 'text-warning' : 'text-light',
  ];
});

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

function showNotificationModal() {
  if (!props.user) return;
  if (enabled.value) {
    // If already enabled, disable directly
    disableNotifications();
  } else {
    // Show modal to enable
    showModal.value = true;
    setTimeout(() => {
      const modalEl = document.getElementById('notificationModal');
      if (modalEl && window.bootstrap) {
        const modal = new window.bootstrap.Modal(modalEl);
        modal.show();
      }
    }, 100);
  }
}

function closeModal() {
  showModal.value = false;
  const modalEl = document.getElementById('notificationModal');
  if (modalEl && window.bootstrap) {
    const modal = window.bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();
  }
}

async function acceptNotification() {
  if (processing.value) return;
  processing.value = true;

  try {
    // Check if PWA is installed
    const isInstalled =
      window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;

    const status = await getPermissionStatus();
    if (status === 'denied') {
      toast(
        'Notifikasi diblokir di browser. Buka Settings > Notifications untuk mengaktifkan.',
        'warning',
        6000,
      );
      closeModal();
      return;
    }

    let perm = status;
    if (status === 'default') {
      perm = await requestPermission();
    }

    if (perm !== 'granted') {
      toast('Izin notifikasi diperlukan.', 'warning');
      closeModal();
      return;
    }

    await subscribePush(props.user.id);
    enabled.value = true;

    if (!isInstalled) {
      toast(
        'Notifikasi diaktifkan! Untuk hasil terbaik, install aplikasi ini ke home screen.',
        'success',
        6000,
      );
    } else {
      toast('Notifikasi diaktifkan!', 'success');
    }

    closeModal();
  } catch (e) {
    let msg = 'Gagal mengaktifkan notifikasi.';
    if (String(e?.message || '').includes('VAPID')) {
      msg = 'VAPID key belum dikonfigurasi.';
    }
    toast(msg, 'danger');
  } finally {
    processing.value = false;
  }
}

function rejectNotification() {
  closeModal();
  toast('Notifikasi tidak diaktifkan.', 'info');
}

async function disableNotifications() {
  if (processing.value) return;
  processing.value = true;

  try {
    await unsubscribePush(props.user.id);
    enabled.value = false;
    toast('Notifikasi dimatikan', 'secondary');
  } catch (e) {
    toast('Gagal menonaktifkan notifikasi', 'danger');
  } finally {
    processing.value = false;
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
  } catch (_) {
    enabled.value = false;
  }
});
</script>
