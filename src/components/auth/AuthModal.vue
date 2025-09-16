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

                  <button type="submit" class="btn btn-primary w-100 mb-3" :disabled="authLoading">
                    <span v-if="authLoading">Masuk...</span>
                    <span v-else>Masuk</span>
                  </button>
                </form>

                <div class="text-center">
                  <p class="small text-muted mb-2">
                    Belum punya akun?
                    <a href="#" @click.prevent="switchAuthMode" class="text-primary">
                      Daftar di sini
                    </a>
                  </p>
                  <p class="small text-muted">
                    Atau gunakan
                    <router-link to="/signin" class="text-primary" @click="$emit('close-modal')">
                      halaman login lengkap
                    </router-link>
                  </p>
                </div>
              </div>

              <!-- Signup Form -->
              <div v-else class="auth-form">
                <h4 class="text-center mb-3">Daftar Akun Baru</h4>
                <p class="text-center text-muted small mb-4">
                  Gunakan halaman signup untuk registrasi dengan kode lisensi
                </p>
                <div class="text-center">
                  <router-link to="/signup" class="btn btn-primary" @click="$emit('close-modal')">
                    Buka Halaman Signup
                  </router-link>
                </div>
                <div class="text-center mt-3">
                  <a href="#" @click.prevent="switchAuthMode" class="small text-muted">
                    Sudah punya akun? Masuk di sini
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { getSupabase } from '@/lib/supabaseClient';

const supabase = getSupabase();
const authMode = ref('login');
const authLoading = ref(false);
const authError = ref('');
const showPassword = ref(false);

// Form data
const loginForm = ref({
  email: '',
  password: '',
});

const emit = defineEmits(['auth-success', 'close-modal']);

const handleLogin = async () => {
  authError.value = '';
  authLoading.value = true;
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.value.email,
      password: loginForm.value.password,
    });
    if (error) throw error;
    closeModal();
    emit('auth-success');
  } catch (err) {
    authError.value = err.message;
    console.error('Login error:', err);
  } finally {
    authLoading.value = false;
  }
};

const handleRegister = async (userData) => {
  authError.value = '';
  authLoading.value = true;
  try {
    // Validasi password
    if (userData.password !== userData.confirmPassword) {
      showToast('Password tidak cocok', 'danger');
      throw new Error('Password tidak cocok');
    }

    // Validasi lisensi: tepat 6 karakter alfanumerik
    const rawCode = (userData.licenseCode || '').trim();
    const upperCode = rawCode.toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(upperCode)) {
      showToast('Kode lisensi harus 6 karakter alfanumerik.', 'danger');
      throw new Error('Kode lisensi tidak valid');
    }

    // Cek lisensi via RPC
    const { data: isValid, error: vErr } = await supabase.rpc('validate_license', {
      p_code: upperCode,
    });
    if (vErr) {
      showToast('Gagal memvalidasi lisensi: ' + vErr.message, 'danger');
      throw vErr;
    }
    if (!isValid) {
      showToast('Lisensi tidak valid atau sudah digunakan.', 'danger');
      throw new Error('Lisensi tidak valid atau sudah digunakan');
    }

    // Signup
    let signup;
    try {
      signup = await signUpWithRetry(userData.email, userData.password, {
        data: { full_name: userData.fullName },
      });
    } catch (error) {
      if (Number(error?.status) === 429) {
        showToast('Terlalu banyak percobaan. Coba lagi dalam beberapa menit.', 'warning', 6000);
      } else if (isGatewayTimeout(error)) {
        showToast(
          'Server auth lambat. Jika email verifikasi masuk, klik tautannya lalu login.',
          'warning',
          7000,
        );
      }
      throw error;
    }

    // Tandai lisensi digunakan
    try {
      const { data: usedOk, error: useErr } = await supabase.rpc('use_license', {
        p_code: upperCode,
        p_email: userData.email,
      });
      if (useErr) {
        console.warn('use_license error:', useErr);
        showToast('Akun dibuat, namun aktivasi lisensi gagal. Hubungi admin.', 'warning', 6000);
      } else if (!usedOk) {
        showToast('Akun dibuat, tapi lisensi sudah terpakai. Hubungi admin.', 'warning', 6000);
      }
    } catch (e) {
      console.warn('Mark license used failed:', e);
    }

    if (signup?.user && !signup?.session) {
      showToast(
        'Verifikasi email telah dikirim. Silakan cek inbox/spam dan klik tautan verifikasi sebelum login.',
        'info',
        6000,
      );
    } else if (signup?.user && signup?.session) {
      showToast('Akun berhasil dibuat.', 'success');
    } else {
      showToast('Pendaftaran berhasil. Silakan cek email Anda untuk verifikasi.', 'info', 6000);
    }

    emit('auth-success');
  } catch (err) {
    authError.value = err.message;
    showToast(err.message, 'danger');
  } finally {
    authLoading.value = false;
  }
};

const signUpWithRetry = async (email, password, options, timeoutMs = 12000) => {
  const withTimeout = (p, ms) =>
    Promise.race([
      p,
      new Promise((_, rej) => setTimeout(() => rej(new Error('Signup timeout')), ms)),
    ]);

  const attempt = async () => {
    const { data, error } = await withTimeout(
      supabase.auth.signUp({ email, password, options }),
      timeoutMs,
    );
    if (error) throw error;
    return data;
  };

  try {
    return await attempt();
  } catch (err) {
    if (Number(err?.status) === 429) throw err;
    if (isGatewayTimeout(err) || /timeout/i.test(String(err?.message || ''))) {
      await sleep(1500);
      return await attempt();
    }
    if (/redirect.*valid|redirect.*allowed/i.test(String(err?.message || ''))) {
      showToast(
        'Redirect URL tidak valid di pengaturan Auth. Whitelist origin Anda di Supabase atau hilangkan emailRedirectTo.',
        'warning',
        7000,
      );
    }
    throw err;
  }
};

const isGatewayTimeout = (err) => {
  try {
    const s = err && (err.status || err.code);
    const msg = (err && (err.message || err.error_description || err.error)) || '';
    return s === 504 || /\b504\b|gateway|timed? out/i.test(String(msg));
  } catch (_) {
    return false;
  }
};

const sleep = (ms) => {
  return new Promise((res) => setTimeout(res, ms));
};

const switchAuthMode = () => {
  authMode.value = authMode.value === 'login' ? 'register' : 'login';
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
