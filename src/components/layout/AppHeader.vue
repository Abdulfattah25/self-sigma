<template>
  <header class="app-header navbar navbar-expand-lg navbar-dark bg-primary fixed-top">
    <div class="container-fluid">
      <!-- Brand -->
      <router-link to="/dashboard" class="navbar-brand fw-bold">
        🌱 Productivity Tracker
      </router-link>

      <!-- Mobile menu toggle -->
      <button class="navbar-toggler d-lg-none" type="button" @click="$emit('toggle-sidebar')">
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Center Navigation (Desktop) -->
      <ul class="navbar-nav d-none d-lg-flex mx-auto">
        <li class="nav-item">
          <router-link to="/dashboard" class="nav-link">
            <i class="bi bi-grid-3x3-gap me-1"></i>
            Dashboard
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/tasks" class="nav-link">
            <i class="bi bi-check-square me-1"></i>
            Tasks
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/forest" class="nav-link">
            <i class="bi bi-tree me-1"></i>
            Forest
          </router-link>
        </li>
      </ul>

      <!-- Right: Notifications & User menu -->
      <div class="navbar-nav ms-auto">
        <!-- Notifications -->
        <div v-if="user" class="nav-item me-2">
          <a
            class="nav-link position-relative"
            href="#"
            @click.prevent="toggleNotifications"
            title="Notifikasi"
          >
            <i class="bi bi-bell fs-5"></i>
            <span
              v-if="hasUnreadNotifications"
              class="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle"
            >
              <span class="visually-hidden">Notifikasi baru</span>
            </span>
          </a>
        </div>

        <!-- User Menu -->
        <div v-if="user" class="nav-item dropdown">
          <a
            class="nav-link dropdown-toggle d-flex align-items-center"
            href="#"
            id="userDropdown"
            role="button"
            data-bs-toggle="dropdown"
          >
            <div class="user-avatar me-2">
              {{ (user?.user_metadata?.name || user?.email || 'U')[0].toUpperCase() }}
            </div>
            <span class="d-none d-md-inline">
              {{ formatUserName }}
            </span>
          </a>
          <ul class="dropdown-menu dropdown-menu-end">
            <li>
              <router-link to="/profile" class="dropdown-item">
                <i class="bi bi-person me-2"></i>
                Profil
              </router-link>
            </li>
            <li><hr class="dropdown-divider" /></li>
            <li>
              <a href="#" class="dropdown-item text-danger" @click.prevent="$emit('logout')">
                <i class="bi bi-box-arrow-right me-2"></i>
                Keluar
              </a>
            </li>
          </ul>
        </div>

        <!-- Auth Button (when not logged in) -->
        <div v-else class="nav-item">
          <router-link to="/signin" class="btn btn-outline-light btn-sm rounded-pill px-3">
            Masuk
          </router-link>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  user: Object,
});

const emit = defineEmits(['toggle-sidebar', 'logout', 'toggle-notifications']);

// Notification state
const hasUnreadNotifications = ref(true);

const formatUserName = computed(() => {
  return (
    props.user?.user_metadata?.name ||
    props.user?.user_metadata?.full_name ||
    props.user?.email?.split('@')[0] ||
    'User'
  );
});

const toggleNotifications = () => {
  emit('toggle-notifications');
  // Mark as read when clicked
  hasUnreadNotifications.value = false;
};
</script>

<style scoped>
.app-header {
  height: 60px;
  z-index: 1050;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.navbar-brand {
  font-size: 1.25rem;
  font-weight: 700;
  text-decoration: none;
}

.navbar-brand:hover {
  color: rgba(255, 255, 255, 0.9) !important;
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.2s ease;
}

.user-avatar:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.dropdown-toggle::after {
  display: none;
}

.nav-link {
  border-radius: 6px;
  margin: 0 2px;
  transition: all 0.2s ease;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9) !important;
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.15);
  font-weight: 600;
}

.dropdown-menu {
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  margin-top: 8px;
}

.dropdown-item {
  padding: 8px 16px;
  transition: all 0.2s ease;
}

.dropdown-item:hover {
  background-color: rgba(0, 123, 255, 0.1);
}

.btn-outline-light {
  border-color: rgba(255, 255, 255, 0.5);
  transition: all 0.2s ease;
}

.btn-outline-light:hover {
  background-color: white;
  color: var(--bs-primary);
  border-color: white;
}

/* Mobile responsiveness */
@media (max-width: 991.98px) {
  .navbar-nav.mx-auto {
    display: none !important;
  }

  .navbar-brand {
    font-size: 1.1rem;
  }

  .user-avatar {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
}

/* Notification badge */
.position-relative .rounded-circle {
  width: 8px;
  height: 8px;
  border-width: 1px !important;
}

/* Smooth animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-menu {
  animation: fadeIn 0.2s ease;
}
</style>
