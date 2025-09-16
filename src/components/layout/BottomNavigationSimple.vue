<template>
  <nav class="bottom-nav navbar navbar-light bg-light fixed-bottom d-md-none">
    <div class="container-fluid">
      <div class="bottom-nav-items d-flex justify-content-around w-100">
        <router-link
          to="/dashboard"
          class="bottom-nav-link"
          :class="{ active: currentRoute === 'Dashboard' }"
        >
          <i class="bi bi-speedometer2"></i>
          <span>Dashboard</span>
        </router-link>

        <router-link
          to="/checklist"
          class="bottom-nav-link"
          :class="{ active: currentRoute === 'Checklist' }"
        >
          <i class="bi bi-check-square"></i>
          <span>Checklist</span>
        </router-link>

        <router-link
          to="/tasks"
          class="bottom-nav-link"
          :class="{ active: currentRoute === 'TaskManager' }"
        >
          <i class="bi bi-list-task"></i>
          <span>Tasks</span>
        </router-link>

        <router-link
          to="/forest"
          class="bottom-nav-link"
          :class="{ active: currentRoute === 'ForestPanel' }"
        >
          <i class="bi bi-tree"></i>
          <span>Forest</span>
        </router-link>

        <router-link
          to="/profile"
          class="bottom-nav-link"
          :class="{ active: currentRoute === 'Profile' }"
        >
          <i class="bi bi-person"></i>
          <span>Profile</span>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
defineProps({
  currentRoute: String,
});
</script>

<style scoped>
.bottom-nav {
  height: 60px;
  border-top: 1px solid #e0e0e0;
  z-index: 1030;
}

.bottom-nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: #666;
  font-size: 0.75rem;
  padding: 0.5rem;
  transition: color 0.2s ease;
}

.bottom-nav-link i {
  font-size: 1.2rem;
  margin-bottom: 0.25rem;
}

.bottom-nav-link:hover,
.bottom-nav-link.active {
  color: #0d6efd;
  text-decoration: none;
}
</style>
