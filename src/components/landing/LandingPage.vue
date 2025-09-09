<template>
  <div class="landing-theme">
    <!-- Hero Section -->
    <section class="hero-section position-relative overflow-hidden">
      <div class="container">
        <div class="row align-items-center g-4">
          <div class="col-lg-6">
            <div class="hero-badge text-uppercase fw-bold mb-3">
              <i class="bi bi-stars me-2"></i>
              Tingkatkan produktivitas harian Anda
            </div>
            <h1 class="display-4 fw-bold lh-tight hero-title">
              Kelola Tugas, Raih Target, dan Pantau Perkembangan Anda
            </h1>
            <p class="lead text-light mt-3">
              Productivity Tracker membantu Anda membangun kebiasaan positif dengan checklist harian, sistem poin, dan laporan visual yang menawan.
            </p>

            <div class="d-flex flex-wrap gap-2 my-4">
              <button
                class="btn btn-gradient btn-lg px-4 shadow-lg"
                @click="$emit('show-auth')">
                Mulai Sekarang
              </button>
              <a href="#fitur" class="btn btn-outline-light btn-lg px-4 border-0 glass-btn text-white d-none d-md-inline-flex">
                Jelajahi Fitur
              </a>
            </div>
          </div>

          <div class="col-lg-6">
            <LandingVisual />
          </div>
        </div>
      </div>
      <!-- Decorative shapes -->
      <div class="hero-blur hero-blur-1"></div>
      <div class="hero-blur hero-blur-2"></div>
    </section>

    <!-- Features Section -->
    <section id="fitur" class="container-fluid px-5 my-5">
      <div class="text-center mb-4">
        <h2 class="fw-bold">Fitur yang Membantu Anda Konsisten</h2>
        <p class="text-muted">Dirancang agar fokus, rapi, dan menyenangkan digunakan setiap hari.</p>
      </div>

      <div class="row g-3 g-md-4">
        <div class="col-6 col-lg-3" v-for="feature in features" :key="feature.id">
          <div class="feature-card h-100">
            <div class="icon-bubble" :class="feature.iconClass">
              <i :class="feature.icon"></i>
            </div>
            <div>
              <h6 class="mt-3 mb-1">{{ feature.title }}</h6>
              <p class="text-muted small mb-0">{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="text-center mt-4 d-none d-md-flex justify-content-center">
        <button
          class="btn btn-gradient btn-lg px-4 shadow"
          @click="$emit('show-auth')">
          Login Sekarang
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LandingVisual from './LandingVisual.vue'

defineEmits(['show-auth'])

const features = ref([
  {
    id: 1,
    title: 'Template Tugas',
    description: 'Susun template checklist harian lalu otomatis dibuat setiap hari.',
    icon: 'bi bi-list-task',
    iconClass: 'text-primary bg-primary-subtle'
  },
  {
    id: 2,
    title: 'Sistem Poin',
    description: 'Dapatkan poin untuk tiap tugas selesai dan hindari penalti.',
    icon: 'bi bi-trophy-fill',
    iconClass: 'text-success bg-success-subtle'
  },
  {
    id: 3,
    title: 'Rutinitas Konsisten',
    description: 'Bangun kebiasaan baik dengan checklist yang mudah diikuti.',
    icon: 'bi bi-alarm-fill',
    iconClass: 'text-info bg-info-subtle'
  },
  {
    id: 4,
    title: 'Ringan & Cepat',
    description: 'Antarmuka gesit dan responsive di semua perangkat.',
    icon: 'bi bi-device-ssd-fill',
    iconClass: 'text-secondary bg-secondary-subtle'
  }
])
</script>