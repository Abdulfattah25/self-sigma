<template>
  <div id="app">
    <!-- Loading state -->
    <div v-if="loading" class="loading-container">
      <div class="loading-content">
        <div class="spinner"></div>
        <p>Memuat aplikasi...</p>
      </div>
    </div>

    <!-- Main app content -->
    <router-view v-else />

    <!-- Toast Container -->
    <div id="toastContainer" class="toast-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '@/composables/useAuth.js';
import { LicenseService } from '@/services/licenseService.js';

const router = useRouter();
const route = useRoute();
const { user, checkAuth } = useAuth();

const loading = ref(true);

// Auth pages yang tidak memerlukan redirect
const authPages = ['/signin', '/signup', '/test-license'];

const initializeApp = async () => {
  try {
    await checkAuth();

    if (user.value) {
      // User authenticated, check app access
      const hasAccess = await LicenseService.checkUserAccess();

      if (!hasAccess) {
        // User tidak punya akses, redirect ke signup
        if (!authPages.includes(route.path)) {
          router.push('/signup');
        }
        return;
      }

      // User punya akses, redirect ke dashboard jika di auth pages
      if (authPages.includes(route.path) && route.path !== '/test-license') {
        router.push('/dashboard');
      }
    } else {
      // User tidak authenticated, redirect ke signin
      if (!authPages.includes(route.path)) {
        router.push('/signin');
      }
    }
  } catch (error) {
    console.error('Auth initialization error:', error);
    // Fallback ke signin jika terjadi error
    if (!authPages.includes(route.path)) {
      router.push('/signin');
    }
  } finally {
    loading.value = false;
  }
};

// Watch route changes untuk handle navigation
watch(
  () => route.path,
  async (newPath) => {
    if (!loading.value && user.value && !authPages.includes(newPath)) {
      // Cek akses setiap kali navigasi ke halaman protected
      const hasAccess = await LicenseService.checkUserAccess();
      if (!hasAccess) {
        router.push('/signup');
      }
    }
  },
);

onMounted(initializeApp);
</script>

<style>
#app {
  min-height: 100vh;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
    'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.loading-content {
  text-align: center;
  color: white;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  pointer-events: none;
}

.toast-container > * {
  pointer-events: auto;
}

/* Responsive improvements */
@media (max-width: 768px) {
  .loading-content p {
    font-size: 0.9rem;
  }

  .spinner {
    width: 32px;
    height: 32px;
  }
}
</style>
