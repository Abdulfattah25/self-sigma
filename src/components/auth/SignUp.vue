<template>
  <AuthLayout>
    <div class="signup-form">
      <div class="form-header">
        <h2>🌱 Daftar Akun Baru</h2>
        <p class="subtitle">Mulai perjalanan produktivitas Anda</p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <!-- License Code - Hanya untuk signup -->
        <div class="mb-3 field">
          <label class="form-label">
            <i class="bi bi-key-fill me-2"></i>
            Kode Lisensi
          </label>
          <input
            v-model="form.licenseCode"
            type="text"
            class="form-control form-control-modern"
            placeholder="Masukkan kode lisensi dari admin"
            :disabled="loading || verifyingLicense"
            @input="handleLicenseInput"
            @blur="verifyLicenseCode"
            maxlength="12"
            required
          />
          <div v-if="licenseStatus === 'valid'" class="field-success">
            <i class="bi bi-check-circle-fill me-1"></i>
            Kode lisensi valid
          </div>
          <div v-if="licenseStatus === 'invalid'" class="field-error">
            <i class="bi bi-x-circle-fill me-1"></i>
            {{ licenseError }}
          </div>
          <div v-if="verifyingLicense" class="field-verifying">
            <i class="bi bi-arrow-repeat spin me-1"></i>
            Memverifikasi kode lisensi...
          </div>
          <small class="form-text">Dapatkan kode lisensi dari administrator aplikasi</small>
        </div>

        <!-- Name -->
        <div class="mb-3 field">
          <label class="form-label">
            <i class="bi bi-person-fill me-2"></i>
            Nama Lengkap
          </label>
          <input
            v-model="form.name"
            type="text"
            class="form-control form-control-modern"
            placeholder="Nama lengkap Anda"
            :disabled="loading"
            required
          />
          <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
        </div>

        <!-- Email -->
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
          />
          <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
        </div>

        <!-- Password -->
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
              placeholder="Minimal 6 karakter"
              :disabled="loading"
              required
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
          </div>
          <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
        </div>

        <!-- Confirm Password -->
        <div class="mb-3 field">
          <label class="form-label">
            <i class="bi bi-lock-fill me-2"></i>
            Konfirmasi Password
          </label>
          <div class="password-input">
            <input
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              class="form-control form-control-modern"
              placeholder="Ulangi password"
              :disabled="loading"
              required
            />
            <button
              type="button"
              class="toggle-password"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
            </button>
          </div>
          <span v-if="errors.confirmPassword" class="field-error">{{
            errors.confirmPassword
          }}</span>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          class="btn btn-primary btn-lg w-100 mt-3"
          :disabled="loading || verifyingLicense || licenseStatus !== 'valid'"
        >
          <span v-if="loading">
            <i class="bi bi-arrow-repeat spin me-2"></i>
            Mendaftarkan akun...
          </span>
          <span v-else>
            <i class="bi bi-person-plus me-2"></i>
            Daftar Sekarang
          </span>
        </button>
      </form>

      <!-- Error & Success Messages -->
      <div v-if="submitError" class="alert alert-danger mt-3">
        <i class="bi bi-exclamation-triangle me-2"></i>
        {{ submitError }}
      </div>

      <div v-if="successMessage" class="alert alert-success mt-3">
        <i class="bi bi-check-circle me-2"></i>
        {{ successMessage }}
      </div>

      <!-- Login Link -->
      <div class="text-center mt-4">
        <p class="signin-link">
          Sudah punya akun?
          <router-link to="/signin" class="link-primary fw-semibold"> Masuk di sini </router-link>
        </p>
      </div>
    </div>
  </AuthLayout>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth.js';
import { LicenseService } from '@/services/licenseService.js';
import { validateSignUpForm, formatLicenseCode } from '@/utils/validation.js';
import AuthLayout from '@/components/layout/AuthLayout.vue';

const router = useRouter();
const { signUp, loading } = useAuth();

const form = reactive({
  licenseCode: '',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
});

const errors = ref({});
const submitError = ref('');
const successMessage = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);

// License verification states
const verifyingLicense = ref(false);
const licenseStatus = ref(''); // 'valid', 'invalid', ''
const licenseError = ref('');
const licenseData = ref(null);

// Handle license input formatting
const handleLicenseInput = (event) => {
  form.licenseCode = formatLicenseCode(event.target.value);
  // Reset license status when user types
  if (licenseStatus.value !== '') {
    licenseStatus.value = '';
    licenseError.value = '';
  }
};

// Verify license code
const verifyLicenseCode = async () => {
  if (!form.licenseCode || form.licenseCode.length < 6) {
    licenseStatus.value = '';
    return;
  }

  verifyingLicense.value = true;
  licenseError.value = '';

  try {
    const result = await LicenseService.verifyLicense(form.licenseCode);

    if (result.valid) {
      licenseStatus.value = 'valid';
      licenseData.value = result.data;
    } else {
      licenseStatus.value = 'invalid';
      licenseError.value = result.error || 'Kode lisensi tidak valid';
    }
  } catch (error) {
    licenseStatus.value = 'invalid';
    licenseError.value = 'Gagal memverifikasi kode lisensi';
    console.error('License verification error:', error);
  } finally {
    verifyingLicense.value = false;
  }
};

// Form validation
const validateForm = () => {
  const validation = validateSignUpForm(form);
  errors.value = validation.errors;

  // Additional license validation
  if (!form.licenseCode) {
    errors.value.licenseCode = 'Kode lisensi wajib diisi';
  } else if (licenseStatus.value !== 'valid') {
    errors.value.licenseCode = 'Kode lisensi belum diverifikasi atau tidak valid';
  }

  // Confirm password validation
  if (form.password !== form.confirmPassword) {
    errors.value.confirmPassword = 'Konfirmasi password tidak sesuai';
  }

  return Object.keys(errors.value).length === 0;
};

// Handle form submission
const handleSubmit = async () => {
  submitError.value = '';
  successMessage.value = '';

  if (!validateForm()) {
    return;
  }

  try {
    // Sign up with license integration
    const result = await signUp(form.email, form.password, form.licenseCode, form.name);

    if (result.success) {
      if (result.needsConfirmation) {
        successMessage.value = 'Akun berhasil dibuat! Silakan cek email untuk konfirmasi.';
        // Store license data for later use after email confirmation
        localStorage.setItem(
          'pendingLicense',
          JSON.stringify({
            licenseCode: form.licenseCode,
            licenseData: licenseData.value,
          }),
        );
      } else {
        // Direct login success
        successMessage.value = 'Akun berhasil dibuat! Anda akan diarahkan ke dashboard.';
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    }
  } catch (error) {
    submitError.value = error.message || 'Gagal mendaftarkan akun';
    console.error('Signup error:', error);
  }
};

// Watch license code changes for auto-verification
let verifyTimeout = null;
watch(
  () => form.licenseCode,
  (newCode) => {
    if (verifyTimeout) {
      clearTimeout(verifyTimeout);
    }

    if (newCode && newCode.length >= 6) {
      verifyTimeout = setTimeout(() => {
        verifyLicenseCode();
      }, 1000); // Auto-verify after 1 second of no typing
    }
  },
);
</script>

<style scoped>
.signup-form {
  max-width: 480px;
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

.field-success {
  color: #059669;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
}

.field-error {
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
}

.field-verifying {
  color: #3b82f6;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
}

.form-text {
  color: #6b7280;
  font-size: 0.8rem;
  margin-top: 0.25rem;
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

.signin-link {
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

/* Responsive design */
@media (max-width: 576px) {
  .signup-form {
    padding: 1.5rem 1rem;
  }

  .form-header h2 {
    font-size: 1.5rem;
  }

  .form-control-modern {
    padding: 0.75rem;
  }
}

/* Focus visible for accessibility */
.btn-primary:focus-visible,
.form-control-modern:focus-visible,
.toggle-password:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
</style>
