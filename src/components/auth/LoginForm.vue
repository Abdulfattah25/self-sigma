<template>
  <form @submit.prevent="handleSubmit" class="auth-form">
    <div v-if="authError" class="alert alert-danger">{{ authError }}</div>

    <div class="mb-3 field">
      <i class="bi bi-envelope icon"></i>
      <input 
        type="email" 
        class="form-control form-control-modern" 
        v-model="form.email" 
        placeholder="Email" 
        required>
    </div>

    <div class="mb-3 field">
      <i class="bi bi-shield-lock icon"></i>
      <input 
        :type="showPassword ? 'text' : 'password'" 
        class="form-control form-control-modern" 
        v-model="form.password" 
        placeholder="Password" 
        required>
      <button 
        type="button" 
        class="toggle-password" 
        @click="showPassword = !showPassword" 
        :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'">
        <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
      </button>
    </div>

    <button type="submit" class="btn btn-gradient w-100 py-2 mb-2" :disabled="authLoading">
      <span v-if="!authLoading">Masuk</span>
      <span v-else>Memproses...</span>
    </button>

    <div class="text-center small text-muted">
      Belum punya akun?
      <a href="#" @click.prevent="$emit('switch-mode')" class="fw-semibold">
        Daftar di sini
      </a>
    </div>
  </form>
</template>

<script setup>
import { ref, reactive } from 'vue'

defineProps({
  authError: String,
  authLoading: Boolean
})

const emit = defineEmits(['login', 'switch-mode'])

const showPassword = ref(false)
const form = reactive({
  email: '',
  password: ''
})

const handleSubmit = () => {
  emit('login', { ...form })
}
</script>