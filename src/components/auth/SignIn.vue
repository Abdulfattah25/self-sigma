<template>
  <AuthLayout>
    <div class="signin-form">
      <div class="form-header">
        <h2>🔐 Masuk ke Akun</h2>
        <p class="subtitle">Selamat datang kembali!</p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <!-- Error Alert -->
        <div v-if="error" class="alert alert-danger">
          <i class="bi bi-exclamation-triangle me-2"></i>
          {{ error }}
        </div>

        <!-- Email Field -->
        <div class="mb-3 field">
          <label class="form-label">
            <i class="bi bi-envelope-fill me-2"></i>
            Email
          </label>
          <input
            v-model="form.email"
            type="email"
            class="form-control form-control-modern"
            placeholder="email@domain.com"
            :disabled="loading"
            required
            autocomplete="email"
          />
        </div>

        <!-- Password Field -->
        <div class="mb-3 field">
          <label class="form-label">
            <i class="bi bi-shield-lock-fill me-2"></i>
            Password
          </label>
          <div class="password-input">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-control form-control-modern"
              placeholder="Masukkan password"
              :disabled="loading"
              required
              autocomplete="current-password"
            />
            <button
              type="button"
              class="toggle-password"
              @click="showPassword = !showPassword"
              :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
            >
              <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
          </div>
        </div>

        <!-- Remember Me & Forgot Password -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="form-check">
            <input v-model="rememberMe" class="form-check-input" type="checkbox" id="rememberMe" />
            <label class="form-check-label small" for="rememberMe"> Ingat saya </label>
          </div>
          <a
            href="#"
            class="text-primary small text-decoration-none"
            @click.prevent="showForgotPassword"
          >
            Lupa password?
          </a>
        </div>

        <!-- Submit Button -->
        <button type="submit" class="btn btn-primary btn-lg w-100 mb-3" :disabled="loading">
          <span v-if="loading">
            <i class="bi bi-arrow-repeat spin me-2"></i>
            Masuk...
          </span>
          <span v-else>
            <i class="bi bi-box-arrow-in-right me-2"></i>
            Masuk
          </span>
        </button>
      </form>

      <!-- Success Message -->
      <div v-if="successMessage" class="alert alert-success">
        <i class="bi bi-check-circle me-2"></i>
        {{ successMessage }}
      </div>

      <!-- Forgot Password Modal -->
      <div
        v-if="showForgotPasswordModal"
        class="forgot-password-overlay"
        @click="closeForgotPassword"
      >
        <div class="forgot-password-modal" @click.stop>
          <h5>Reset Password</h5>
          <p class="text-muted small">Masukkan email Anda untuk mendapatkan link reset password</p>
          <form @submit.prevent="handleForgotPassword">
            <div class="mb-3">
              <input
                v-model="forgotEmail"
                type="email"
                class="form-control form-control-modern"
                placeholder="email@domain.com"
                required
              />
            </div>
            <div class="d-flex gap-2">
              <button type="submit" class="btn btn-primary btn-sm">Kirim</button>
              <button type="button" class="btn btn-secondary btn-sm" @click="closeForgotPassword">
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Signup Link -->
      <div class="text-center mt-4">
        <p class="signup-link">
          Belum punya akun?
          <router-link to="/signup" class="link-primary fw-semibold"> Daftar di sini </router-link>
        </p>
      </div>

      <!-- Demo Access -->
      <div class="text-center mt-3">
        <small class="text-muted">
          Demo:
          <a href="#" @click.prevent="fillDemoCredentials" class="text-decoration-none">
            Gunakan akun demo
          </a>
        </small>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth.js';
import { LicenseService } from '@/services/licenseService.js';
import AuthLayout from '@/components/layout/AuthLayout.vue';

const router = useRouter();
const { signIn, loading } = useAuth();

const form = reactive({
  email: '',
  password: '',
});

const error = ref('');
const successMessage = ref('');
const showPassword = ref(false);
const rememberMe = ref(false);
const showForgotPasswordModal = ref(false);
const forgotEmail = ref('');

// Demo credentials for testing
const demoCredentials = {
  email: 'demo@productivity.com',
  password: 'demo123',
};

const handleSubmit = async () => {
  error.value = '';
  successMessage.value = '';

  // Basic validation
  if (!form.email || !form.password) {
    error.value = 'Email dan password wajib diisi';
    return;
  }

  try {
    // Sign in user
    const result = await signIn(form.email, form.password);

    if (result.success) {
      // Check if user has app access
      const hasAccess = await LicenseService.checkUserAccess();

      if (hasAccess) {
        successMessage.value = 'Login berhasil! Mengarahkan ke dashboard...';

        // Save remember me preference
        if (rememberMe.value) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('lastEmail', form.email);
        }

        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        error.value = 'Akun Anda belum memiliki akses. Silakan daftar dengan kode lisensi.';
        setTimeout(() => {
          router.push('/signup');
        }, 2000);
      }
    }
  } catch (err) {
    console.error('Login error:', err);

    // Handle specific error types
    if (err.message.includes('Invalid login credentials')) {
      error.value = 'Email atau password salah';
    } else if (err.message.includes('Email not confirmed')) {
      error.value = 'Email belum dikonfirmasi. Silakan cek email Anda.';
    } else if (err.message.includes('Too many requests')) {
      error.value = 'Terlalu banyak percobaan. Silakan coba lagi nanti.';
    } else {
      error.value = err.message || 'Gagal masuk. Silakan coba lagi.';
    }
  }
};

const showForgotPassword = () => {
  showForgotPasswordModal.value = true;
  forgotEmail.value = form.email;
};

const closeForgotPassword = () => {
  showForgotPasswordModal.value = false;
  forgotEmail.value = '';
};

const handleForgotPassword = async () => {
  try {
    // Implementation for forgot password
    // This would typically send a reset email
    successMessage.value = 'Link reset password telah dikirim ke email Anda';
    closeForgotPassword();
  } catch (err) {
    error.value = 'Gagal mengirim email reset password';
  }
};

const fillDemoCredentials = () => {
  form.email = demoCredentials.email;
  form.password = demoCredentials.password;
};

// Auto-fill remembered email on mount
const loadRememberedEmail = () => {
  if (localStorage.getItem('rememberMe') === 'true') {
    const lastEmail = localStorage.getItem('lastEmail');
    if (lastEmail) {
      form.email = lastEmail;
      rememberMe.value = true;
    }
  }
};

// Initialize component
loadRememberedEmail();
</script>

<style scoped>
.signin-form {
  max-width: 420px;
  margin: 0 auto;
  padding: 2rem;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header h2 {
  color: #1f2937;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.form-header .subtitle {
  color: #6b7280;
  font-size: 0.95rem;
  margin-bottom: 0;
}

.field {
  position: relative;
}

.form-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-control-modern {
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  background: #fff;
}

.form-control-modern:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: #ffffff;
}

.form-control-modern:disabled {
  background-color: #f9fafb;
  border-color: #d1d5db;
  color: #6b7280;
}

.password-input {
  position: relative;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s ease;
}

.toggle-password:hover {
  color: #374151;
}

.form-check-input:checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  border-radius: 8px;
  font-weight: 600;
  padding: 0.875rem 1.5rem;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.alert {
  border-radius: 8px;
  border: none;
  padding: 1rem;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.alert-danger {
  background: #fef2f2;
  color: #dc2626;
  border-left: 4px solid #dc2626;
}

.alert-success {
  background: #f0fdf4;
  color: #166534;
  border-left: 4px solid #059669;
}

.signup-link {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 0;
}

.link-primary {
  color: #3b82f6;
  text-decoration: none;
  transition: color 0.2s ease;
}

.link-primary:hover {
  color: #2563eb;
  text-decoration: underline;
}

/* Forgot Password Modal */
.forgot-password-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  backdrop-filter: blur(2px);
}

.forgot-password-modal {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
  margin: 1rem;
}

.forgot-password-modal h5 {
  margin-bottom: 0.5rem;
  color: #1f2937;
}

/* Loading animation */
.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Demo link styling */
.text-muted a {
  color: #6b7280 !important;
  transition: color 0.2s ease;
}

.text-muted a:hover {
  color: #374151 !important;
}

/* Responsive design */
@media (max-width: 576px) {
  .signin-form {
    padding: 1.5rem 1rem;
  }

  .form-header h2 {
    font-size: 1.5rem;
  }

  .form-control-modern {
    padding: 0.75rem;
  }

  .forgot-password-modal {
    padding: 1.5rem;
  }
}

/* Focus visible for accessibility */
.btn-primary:focus-visible,
.form-control-modern:focus-visible,
.toggle-password:focus-visible,
.form-check-input:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Smooth transitions */
.alert {
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
