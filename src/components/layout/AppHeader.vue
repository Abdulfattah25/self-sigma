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
              @click.prevent="toggleNotifications"
              title="Notifikasi"
            >
              <i class="bi bi-bell-fill fs-5 text-light"></i>
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
import { computed, ref } from 'vue';

const props = defineProps({
  user: Object,
});

const emit = defineEmits(['show-auth', 'set-view', 'toggle-notifications']);

const hasUnreadNotifications = ref(true);
const formatUserName = computed(() => {
  return props.user?.user_metadata?.full_name || props.user?.email?.split('@')[0] || 'User';
});

const toggleNotifications = () => {
  emit('toggle-notifications');
  hasUnreadNotifications.value = false;
};
</script>
