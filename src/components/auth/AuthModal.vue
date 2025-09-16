<template>
  <div
    class="modal fade show"
    style="display: block; z-index: 1055"
    tabindex="-1"
    @click.self="closeModal"
    @keydown.esc="closeModal"
  >
    <div class="modal-backdrop fade show" style="z-index: 1050" @click="closeModal"></div>
    <div class="modal-dialog modal-dialog-centered modal-lg auth-modal" style="z-index: 1060">
      <div class="modal-content auth-modal-content overflow-hidden">
        <div class="row g-0">
          <!-- Left visual -->
          <div class="col-lg-5 d-none d-lg-flex align-items-stretch">
            <div class="auth-visual w-100 p-4 d-flex flex-column justify-content-end">
              <div class="mb-auto">
                <div class="badge bg-white text-primary rounded-pill mb-3 shadow-sm">
                  <i class="bi bi-stars me-1"></i> Selamat Datang
                </div>
                <h4 class="text-white fw-bold mb-2">
                  Satu langkah menuju hari yang lebih produktif
                </h4>
                <p class="text-white-50 mb-0">
                  Buat akun atau masuk untuk menyinkronkan data checklist, poin, dan laporan Anda.
                </p>
              </div>
              <ul class="list-unstyled mt-4 text-white-75 small">
                <li class="mb-2"><i class="bi bi-check2-circle me-2"></i>Desain modern & ringan</li>
                <li class="mb-2"><i class="bi bi-check2-circle me-2"></i>Sinkron otomatis</li>
              </ul>
            </div>
          </div>

          <!-- Right form -->
          <div class="col-lg-7">
            <div class="modal-header border-0 pb-0">
              <h5 class="modal-title">
                {{ authMode === 'login' ? 'Masuk ke Akun' : 'Buat Akun Baru' }}
              </h5>
              <button type="button" class="btn-close" @click="closeModal"></button>
            </div>
            <div class="modal-body pt-2">
              <!-- Login Form -->
              <div v-if="authMode === 'login'" class="auth-form">
                <h4 class="text-center mb-3">Masuk ke Akun</h4>

                <div v-if="authError" class="alert alert-danger">{{ authError }}</div>

                <form @submit.prevent="handleLogin">
                  <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input
                      v-model="loginForm.email"
                      type="email"
                      class="form-control"
                      placeholder="email@domain.com"
                      :disabled="authLoading"
                      required
                    />
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Password</label>
                    <div class="position-relative">
                      <input
                        v-model="loginForm.password"
                        :type="showPassword ? 'text' : 'password'"
                        class="form-control"
                        placeholder="Password"
                        :disabled="authLoading"
                        required
                      />
                      <button
                        type="button"
                        class="btn btn-link position-absolute end-0 top-0 pe-3"
                        @click="showPassword = !showPassword"
                        style="border: none; background: none; color: #6c757d"
                      >
                        <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                      </button>
                    </div>
                  </div>

                  <button type="submit" class="btn btn-primary w-100 mb-2" :disabled="authLoading">
                    <span v-if="authLoading">Masuk...</span>
                    <span v-else>Masuk</span>
                  </button>

                  <p class="text-center small text-muted mb-0">
                    Belum punya akun?
                    <a href="#" @click.prevent="switchAuthMode('register')" class="text-primary">
                      Daftar di sini
                    </a>
                  </p>
                </form>
              </div>

              <!-- Signup Form -->
              <div v-else class="auth-form">
                <h4 class="text-center mb-3">Daftar Akun Baru</h4>

                <div v-if="authError" class="alert alert-danger">{{ authError }}</div>

                <form @submit.prevent="handleRegister">
                  <!-- License Code -->
                  <div class="mb-3">
                    <label class="form-label">Kode Lisensi</label>
                    <input
                      v-model="registerForm.licenseCode"
                      type="text"
                      class="form-control"
                      placeholder="Masukkan kode lisensi dari admin"
                      :disabled="authLoading || verifyingLicense"
                      @input="onLicenseInput"
                      @blur="verifyLicense"
                      maxlength="12"
                      required
                    />
                    <div v-if="licenseStatus === 'valid'" class="small text-success mt-1">
                      <i class="bi bi-check-circle-fill me-1"></i> Kode lisensi valid
                    </div>
                    <div v-if="licenseStatus === 'invalid'" class="small text-danger mt-1">
                      <i class="bi bi-x-circle-fill me-1"></i>
                      {{ licenseError || 'Kode lisensi tidak valid' }}
                    </div>
                    <div v-if="verifyingLicense" class="small text-primary mt-1">
                      <i class="bi bi-arrow-repeat spin me-1"></i> Memverifikasi kode lisensi...
                    </div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Nama Lengkap</label>
                    <input
                      v-model="registerForm.name"
                      type="text"
                      class="form-control"
                      placeholder="Nama lengkap Anda"
                      :disabled="authLoading"
                      required
                    />
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input
                      v-model="registerForm.email"
                      type="email"
                      class="form-control"
                      placeholder="email@domain.com"
                      :disabled="authLoading"
                      required
                    />
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Password</label>
                    <div class="position-relative">
                      <input
                        v-model="registerForm.password"
                        :type="showPassword ? 'text' : 'password'"
                        class="form-control"
                        placeholder="Minimal 6 karakter"
                        :disabled="authLoading"
                        required
                      />
                      <button
                        type="button"
                        class="btn btn-link position-absolute end-0 top-0 pe-3"
                        @click="showPassword = !showPassword"
                        style="border: none; background: none; color: #6c757d"
                      >
                        <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                      </button>
                    </div>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Konfirmasi Password</label>
                    <div class="position-relative">
                      <input
                        v-model="registerForm.confirmPassword"
                        :type="showConfirmPassword ? 'text' : 'password'"
                        class="form-control"
                        placeholder="Ulangi password"
                        :disabled="authLoading"
                        required
                      />
                      <button
                        type="button"
                        class="btn btn-link position-absolute end-0 top-0 pe-3"
                        @click="showConfirmPassword = !showConfirmPassword"
                        style="border: none; background: none; color: #6c757d"
                      >
                        <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    class="btn btn-primary w-100 mb-2"
                    :disabled="submitDisabled"
                  >
                    <span v-if="authLoading">
                      <i class="bi bi-arrow-repeat spin me-2"></i> Mendaftarkan akun...
                    </span>
                    <span v-else> <i class="bi bi-person-plus me-2"></i> Daftar Sekarang </span>
                  </button>

                  <p class="text-center small text-muted mb-0">
                    Sudah punya akun?
                    <a href="#" @click.prevent="switchAuthMode('login')" class="text-primary">
                      Masuk di sini
                    </a>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuth } from '@/composables/useAuth.js';
import { LicenseService } from '@/services/licenseService.js';
import { validateSignUpForm, formatLicenseCode } from '@/utils/validation.js';

const props = defineProps({
  initialMode: { type: String, default: 'login' },
});

const emit = defineEmits(['auth-success', 'close-modal']);

// State
const authMode = ref(props.initialMode === 'register' ? 'register' : 'login');
const authLoading = ref(false);
const authError = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// Forms
const loginForm = ref({ email: '', password: '' });
const registerForm = ref({
  licenseCode: '',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
});

// License verification state
const verifyingLicense = ref(false);
const licenseStatus = ref(''); // 'valid' | 'invalid' | ''
const licenseError = ref('');

const { signIn, signUp } = useAuth();

const submitDisabled = computed(() => {
  return (
    authLoading.value ||
    verifyingLicense.value ||
    licenseStatus.value !== 'valid' ||
    !registerForm.value.name ||
    !registerForm.value.email ||
    !registerForm.value.password ||
    registerForm.value.password !== registerForm.value.confirmPassword
  );
});

const handleLogin = async () => {
  authError.value = '';
  authLoading.value = true;
  try {
    await signIn(loginForm.value.email, loginForm.value.password);
    closeModal();
    emit('auth-success');
  } catch (err) {
    authError.value = err.message || 'Gagal login';
  } finally {
    authLoading.value = false;
  }
};

const onLicenseInput = (e) => {
  registerForm.value.licenseCode = formatLicenseCode(e.target.value || '');
  if (licenseStatus.value) {
    licenseStatus.value = '';
    licenseError.value = '';
  }
};

const verifyLicense = async () => {
  const code = registerForm.value.licenseCode;
  if (!code || code.length < 6) {
    licenseStatus.value = '';
    return;
  }
  verifyingLicense.value = true;
  licenseError.value = '';
  try {
    const ok = await LicenseService.verifyLicense(code);
    licenseStatus.value = ok ? 'valid' : 'invalid';
    if (!ok) {
      licenseError.value = 'Kode lisensi tidak valid';
      showToast(licenseError.value, 'danger');
    }
  } catch (e) {
    licenseStatus.value = 'invalid';
    licenseError.value = e.message || 'Gagal memverifikasi kode lisensi';
    showToast(licenseError.value, 'danger');
  } finally {
    verifyingLicense.value = false;
  }
};

const handleRegister = async () => {
  authError.value = '';
  const { isValid, errors } = validateSignUpForm(registerForm.value);
  if (!isValid) {
    // tampilkan error ringkas
    authError.value = Object.values(errors)[0];
    return;
  }
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    authError.value = 'Konfirmasi password tidak sesuai';
    return;
  }
  if (licenseStatus.value !== 'valid') {
    authError.value = 'Kode lisensi belum diverifikasi atau tidak valid';
    showToast(authError.value, 'danger');
    return;
  }

  authLoading.value = true;
  try {
    const result = await signUp(
      registerForm.value.email,
      registerForm.value.password,
      registerForm.value.licenseCode,
      registerForm.value.name,
    );
    if (result?.needsConfirmation) {
      showToast('Verifikasi email telah dikirim. Silakan cek inbox/spam.', 'info', 6000);
    } else {
      showToast('Akun berhasil dibuat.', 'success');
    }
    emit('auth-success');
  } catch (err) {
    authError.value = err.message || 'Gagal mendaftarkan akun';
    showToast(authError.value, 'danger');
  } finally {
    authLoading.value = false;
  }
};

const switchAuthMode = (mode) => {
  authMode.value = mode === 'register' ? 'register' : 'login';
  authError.value = '';
};

const closeModal = () => {
  emit('close-modal');
};

const showToast = (message, variant = 'primary', delay = 3000) => {
  try {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toastEl = document.createElement('div');
    toastEl.className = `toast align-items-center text-bg-${variant} border-0`;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>`;
    container.appendChild(toastEl);
    const t = new window.bootstrap.Toast(toastEl, { delay });
    toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    t.show();
  } catch (_) {}
};
</script>
