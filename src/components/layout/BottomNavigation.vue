<template>
  <!-- Mobile Bottom Navigation -->
  <nav class="bottom-nav navbar navbar-light bg-white fixed-bottom d-md-none border-top">
    <div class="container-fluid">
      <div class="bottom-nav-items d-flex justify-content-around w-100">
        <router-link
          to="/dashboard"
          class="bottom-nav-link"
          :class="{ active: $route.name === 'Dashboard' }"
        >
          <i class="bi bi-speedometer2"></i>
          <span>Dashboard</span>
        </router-link>

        <router-link
          to="/checklist"
          class="bottom-nav-link"
          :class="{ active: $route.name === 'Checklist' }"
        >
          <i class="bi bi-check-square"></i>
          <span>Checklist</span>
        </router-link>

        <router-link
          to="/tasks"
          class="bottom-nav-link"
          :class="{ active: $route.name === 'TaskManager' }"
        >
          <i class="bi bi-list-task"></i>
          <span>Tasks</span>
        </router-link>

        <router-link
          v-if="user && isAdminUser"
          to="/admin"
          class="bottom-nav-link"
          :class="{ active: $route.name === 'Admin' }"
        >
          <i class="bi bi-shield-lock"></i>
          <span>Admin</span>
        </router-link>

        <router-link
          v-else
          to="/profile"
          class="bottom-nav-link"
          :class="{ active: $route.name === 'Profile' }"
        >
          <i class="bi bi-person"></i>
          <span>Profile</span>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const props = defineProps({
  user: Object,
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

// Computed untuk menentukan apakah user adalah admin
const isAdminUser = computed(() => {
  return (
    props.isAdmin ||
    props.user?.user_metadata?.role === 'admin' ||
    props.user?.app_metadata?.role === 'admin'
  );
});
</script>

<style scoped>
.bottom-nav {
  height: 70px;
  border-top: 1px solid #e0e0e0;
  z-index: 1030;
  background: white !important;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.bottom-nav-items {
  padding: 0.5rem 0;
}

.bottom-nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: #6c757d;
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  min-width: 60px;
  position: relative;
}

.bottom-nav-link i {
  font-size: 1.3rem;
  margin-bottom: 0.25rem;
  transition: all 0.2s ease;
}

.bottom-nav-link span {
  font-size: 0.7rem;
  line-height: 1;
  text-align: center;
}

.bottom-nav-link:hover {
  color: #0d6efd;
  text-decoration: none;
  background-color: rgba(13, 110, 253, 0.05);
}

.bottom-nav-link.active {
  color: #0d6efd;
  font-weight: 600;
  background-color: rgba(13, 110, 253, 0.1);
}

.bottom-nav-link.active::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 3px;
  background: #0d6efd;
  border-radius: 0 0 3px 3px;
}

.bottom-nav-link.active i {
  transform: scale(1.1);
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .bottom-nav-link {
    padding: 0.4rem 0.5rem;
    min-width: 50px;
  }

  .bottom-nav-link i {
    font-size: 1.1rem;
  }

  .bottom-nav-link span {
    font-size: 0.65rem;
  }
}

/* Animation for active state */
@keyframes bounce {
  0%,
  20%,
  60%,
  100% {
    transform: translateY(0) scale(1);
  }
  40% {
    transform: translateY(-3px) scale(1.05);
  }
  80% {
    transform: translateY(-1px) scale(1.02);
  }
}

.bottom-nav-link.active i {
  animation: bounce 0.6s ease;
}

/* Safe area for devices with home indicator */
@supports (padding: max(0px)) {
  .bottom-nav {
    padding-bottom: max(0.5rem, env(safe-area-inset-bottom));
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .bottom-nav {
    background: #1a1a1a !important;
    border-top-color: #333;
  }

  .bottom-nav-link {
    color: #adb5bd;
  }

  .bottom-nav-link:hover,
  .bottom-nav-link.active {
    color: #0d6efd;
  }
}
</style>
