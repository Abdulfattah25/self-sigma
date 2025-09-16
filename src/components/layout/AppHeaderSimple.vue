<template>
  <header class="app-header navbar navbar-expand-lg navbar-dark bg-primary fixed-top">
    <div class="container-fluid">
      <!-- Brand -->
      <router-link to="/dashboard" class="navbar-brand fw-bold"> 🌱 Productivity </router-link>

      <!-- Mobile menu toggle -->
      <button class="navbar-toggler d-lg-none" type="button" @click="$emit('toggle-sidebar')">
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- User menu -->
      <div class="navbar-nav ms-auto">
        <div class="nav-item dropdown">
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
              {{ user?.user_metadata?.name || user?.email }}
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
      </div>
    </div>
  </header>
</template>

<script setup>
defineProps({
  user: Object,
});

defineEmits(['toggle-sidebar', 'logout']);
</script>

<style scoped>
.app-header {
  height: 60px;
  z-index: 1050;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
}

.navbar-brand {
  font-size: 1.25rem;
}

.dropdown-toggle::after {
  display: none;
}
</style>
