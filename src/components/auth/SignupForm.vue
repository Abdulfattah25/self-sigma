<template>
  <form @submit.prevent="handleSubmit" class="auth-form">
    <div v-if="authError" class="alert alert-danger">{{ authError }}</div>

    <div class="mb-3 field">
      <i class="bi bi-person icon"></i>
      <input 
        type="text" 
        class="form-control form-control-modern" 
        v-model="form.fullName" 
        placeholder="Nama Lengkap" 
        required>
    </div>

    <div class="mb-3 field">
      <i class="bi bi-envelope icon"></i>
      <input 
        type="email" 
        class="form-control form-control-modern" 
        v-model="form.email" 
        placeholder="Email" 
        required>
    </div>

    <!-- License Code -->
    <div class="mb-3 field">
      <i class="bi bi-upc icon"></i>
      <input 
        type="text"
        class="form-control form-control-modern"
        v-model="form.licenseCode"
        placeholder="Kode Lisensi"
        required
        pattern="[A-Za-z0-9]{6}"
        maxlength="6">
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

    <div class="mb-3 field">
      <i class="bi bi-lock-fill icon"></i>
      <input 
        :type="showConfirmPassword ? 'text' : 'password'" 
        class="form-control form-control-modern" 
        v-model="form.confirmPassword" 
        placeholder="Konfirmasi Password" 
        required>
      <button 
        type="button" 
        class="toggle-password" 
        @click="showConfirmPassword = !showConfirmPassword" 
        :aria-label="showConfirmPassword ? 'Sembunyikan konfirmasi' : 'Tampilkan konfirmasi'">
        <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
      </button>
    </div>

    <button type="submit" class="btn btn-gradient w-100 py-2 mb-2" :disabled="authLoading">
      <span v-if="!authLoading">Daftar Sekarang</span>
      <span v-else>Memproses...</span>
    </button>

    <div class="text-center small text-muted">
      Sudah punya akun?
      <a href="#" @click.prevent="$emit('switch-mode')" class="fw-semibold">
        Login di sini
      </a>
    </div>

    <div class="mt-3 small text-muted text-center d-none">
      Dengan melanjutkan, Anda menyetujui Ketentuan & Kebijakan Privasi.
    </div>
  </form>
</template>

<script setup>
import { ref, reactive } from 'vue'

defineProps({
  authError: String,
  authLoading: Boolean
})

const emit = defineEmits(['register', 'switch-mode'])

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const form = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  licenseCode: ''
})

const handleSubmit = () => {
  emit('register', { ...form })
}
</script>