<template>
  <div class="app-layout">
    <!-- Header -->
    <AppHeader :user="user" @toggle-sidebar="toggleSidebar" @logout="handleLogout" />

    <!-- Sidebar -->
    <AppSidebar
      :user="user"
      :is-open="sidebarOpen"
      :is-admin="isAdmin"
      @close="sidebarOpen = false"
    />

    <!-- Main Content -->
    <main class="main-content" :class="{ 'sidebar-open': sidebarOpen }">
      <div class="container-fluid p-4">
        <router-view />
      </div>
    </main>

    <!-- Bottom Navigation (Mobile) -->
    <BottomNavigation :user="user" :is-admin="isAdmin" class="d-md-none" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth.js';
import AppHeader from './AppHeader.vue';
import AppSidebar from './AppSidebar.vue';
import BottomNavigation from './BottomNavigation.vue';

const route = useRoute();
const router = useRouter();
const { user, signOut } = useAuth();

const sidebarOpen = ref(false);

const currentRoute = computed(() => route.name);

const isAdmin = computed(() => {
  return user.value?.user_metadata?.role === 'admin' || user.value?.app_metadata?.role === 'admin';
});

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value;
};

const handleLogout = async () => {
  try {
    await signOut();
    router.push({ path: '/', query: { auth: 'login' } });
  } catch (error) {
    console.error('Logout error:', error);
  }
};
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  margin-top: 60px; /* Header height */
  margin-left: 0;
  transition: margin-left 0.3s ease;
  background-color: #f8f9fa;
}

/* Desktop: Always show sidebar */
@media (min-width: 992px) {
  .main-content {
    margin-left: 280px;
  }
}

/* Mobile: Overlay sidebar */
@media (max-width: 991.98px) {
  .main-content {
    margin-left: 0 !important;
    margin-bottom: 70px; /* Space for bottom navigation */
  }
}
</style>
