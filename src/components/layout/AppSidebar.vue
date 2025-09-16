<template>
  <aside class="app-sidebar" :class="{ 'is-open': isOpen }">
    <div class="sidebar-content">
      <!-- Navigation Menu -->
      <nav class="sidebar-nav">
        <ul class="nav flex-column">
          <li class="nav-item">
            <router-link
              to="/dashboard"
              class="nav-link"
              :class="{ active: $route.name === 'Dashboard' }"
              @click="handleNavClick"
            >
              <i class="bi bi-speedometer2 me-2"></i>
              Dashboard
            </router-link>
          </li>

          <li class="nav-item">
            <router-link
              to="/checklist"
              class="nav-link"
              :class="{ active: $route.name === 'Checklist' }"
              @click="handleNavClick"
            >
              <i class="bi bi-check-square me-2"></i>
              Checklist
            </router-link>
          </li>

          <li class="nav-item">
            <router-link
              to="/tasks"
              class="nav-link"
              :class="{ active: $route.name === 'TaskManager' }"
              @click="handleNavClick"
            >
              <i class="bi bi-list-task me-2"></i>
              Task Manager
            </router-link>
          </li>

          <li class="nav-item">
            <router-link
              to="/report"
              class="nav-link"
              :class="{ active: $route.name === 'Report' }"
              @click="handleNavClick"
            >
              <i class="bi bi-graph-up me-2"></i>
              Laporan
            </router-link>
          </li>

          <!-- Divider -->
          <li class="sidebar-divider"></li>

          <!-- Account Section -->
          <li class="nav-item">
            <router-link
              to="/profile"
              class="nav-link"
              :class="{ active: $route.name === 'Profile' }"
              @click="handleNavClick"
            >
              <i class="bi bi-person-circle me-2"></i>
              Profil Saya
            </router-link>
          </li>

          <li v-if="user && isAdmin" class="nav-item">
            <router-link
              to="/admin"
              class="nav-link"
              :class="{ active: $route.name === 'Admin' }"
              @click="handleNavClick"
            >
              <i class="bi bi-shield-lock me-2"></i>
              Admin Panel
            </router-link>
          </li>
        </ul>
      </nav>

      <!-- User Info Footer (Mobile only) -->
      <div v-if="user" class="sidebar-footer d-lg-none">
        <div class="user-info">
          <div class="user-avatar">
            {{ (user?.user_metadata?.name || user?.email || 'U')[0].toUpperCase() }}
          </div>
          <div class="user-details">
            <div class="user-name">{{ formatUserName }}</div>
            <div class="user-email">{{ user?.email }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Backdrop for mobile -->
    <div v-if="isOpen" class="sidebar-backdrop d-lg-none" @click="closeSidebar"></div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const props = defineProps({
  user: Object,
  isOpen: Boolean,
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close']);

const formatUserName = computed(() => {
  return (
    props.user?.user_metadata?.name ||
    props.user?.user_metadata?.full_name ||
    props.user?.email?.split('@')[0] ||
    'User'
  );
});

const handleNavClick = () => {
  // Close sidebar on mobile after navigation
  if (window.innerWidth < 992) {
    emit('close');
  }
};

const closeSidebar = () => {
  emit('close');
};
</script>

<style scoped>
.app-sidebar {
  position: fixed;
  top: 60px; /* Header height */
  left: -280px;
  width: 280px;
  height: calc(100vh - 60px);
  background: #fff;
  border-right: 1px solid #e0e0e0;
  z-index: 1040;
  transition: left 0.3s ease;
  overflow-y: auto;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
}

.app-sidebar.is-open {
  left: 0;
}

.sidebar-content {
  padding: 1rem 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-nav {
  flex: 1;
}

.sidebar-nav .nav-link {
  color: #666;
  padding: 0.875rem 1.5rem;
  border-radius: 0;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
  font-weight: 500;
}

.sidebar-nav .nav-link:hover {
  background-color: #f8f9fa;
  color: #0d6efd;
  border-left-color: #0d6efd;
}

.sidebar-nav .nav-link.active {
  background-color: rgba(13, 110, 253, 0.1);
  color: #0d6efd;
  border-left-color: #0d6efd;
  font-weight: 600;
}

.sidebar-nav .nav-link i {
  width: 20px;
  text-align: center;
  font-size: 1.1rem;
}

/* Sidebar Divider */
.sidebar-divider {
  border-top: 1px solid #e0e0e0;
  margin: 1rem 1.5rem;
  padding: 0;
}

/* User Info Footer */
.sidebar-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e0e0e0;
  background-color: #f8f9fa;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.8rem;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Backdrop */
.sidebar-backdrop {
  position: fixed;
  top: 60px;
  left: 0;
  width: 100vw;
  height: calc(100vh - 60px);
  background: rgba(0, 0, 0, 0.5);
  z-index: 1030;
  backdrop-filter: blur(2px);
}

/* Desktop styles */
@media (min-width: 992px) {
  .app-sidebar {
    left: 0;
    box-shadow: none;
    border-right: 1px solid #dee2e6;
  }

  .sidebar-backdrop {
    display: none !important;
  }

  .sidebar-footer {
    display: none;
  }
}

/* Smooth animations */
@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

.app-sidebar.is-open {
  animation: slideIn 0.3s ease;
}

/* Custom scrollbar */
.app-sidebar::-webkit-scrollbar {
  width: 4px;
}

.app-sidebar::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.app-sidebar::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.app-sidebar::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Focus states for accessibility */
.nav-link:focus {
  outline: 2px solid #0d6efd;
  outline-offset: -2px;
}
</style>
