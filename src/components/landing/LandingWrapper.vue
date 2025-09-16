<template>
  <div>
    <LandingPage @show-auth="openAuth('login')" />

    <AuthModal
      v-if="showAuth"
      :initial-mode="initialMode"
      @close-modal="closeAuth"
      @auth-success="onAuthSuccess"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import LandingPage from './LandingPage.vue';
import AuthModal from '@/components/auth/AuthModal.vue';

const showAuth = ref(false);
const initialMode = ref('login');
const router = useRouter();
const route = useRoute();

const openAuth = (mode = 'login') => {
  initialMode.value = mode;
  showAuth.value = true;
};

const closeAuth = () => {
  showAuth.value = false;
  // hapus query auth saat modal ditutup
  if (route.query.auth) {
    router.replace({ query: { ...route.query, auth: undefined } });
  }
};

const onAuthSuccess = () => {
  closeAuth();
  router.push('/dashboard');
};

// Buka modal berdasar query ?auth=login|signup
const parseAuthQuery = () => {
  const q = String(route.query.auth || '').toLowerCase();
  if (q === 'login' || q === 'signin') {
    openAuth('login');
  } else if (q === 'signup' || q === 'register') {
    openAuth('register');
  }
};

watch(
  () => route.query.auth,
  () => parseAuthQuery(),
);

parseAuthQuery();
</script>

<style scoped>
/* Optional: wrapper-specific styles */
</style>
