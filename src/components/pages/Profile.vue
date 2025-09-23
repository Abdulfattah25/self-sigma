<template>
  <div class="profile-page fade-in">
    <div class="d-flex justify-content-between align-items-center mt-3 mb-3">
      <h4>👤 Profil Pengguna</h4>
    </div>

    <!-- Statistics Card -->
    <div class="col-12 mb-4">
      <div class="card dashboard-card card-accent card-accent--primary">
        <div class="card-header">
          <h5 class="mb-0">📊 Statistik Akun</h5>
        </div>
        <div class="card-body">
          <div class="row text-center">
            <div class="col-6 col-md-3 mb-3">
              <div class="h4 text-primary">{{ stats.totalDays }}</div>
              <small class="text-muted">Hari Aktif</small>
            </div>
            <div class="col-6 col-md-3 mb-3">
              <div class="h4 text-success">{{ stats.totalTasks }}</div>
              <small class="text-muted">Total Task</small>
            </div>
            <div class="col-6 col-md-3 mb-3">
              <div class="h4 text-warning">{{ stats.completedTasks }}</div>
              <small class="text-muted">Task Selesai</small>
            </div>
            <div class="col-6 col-md-3 mb-3">
              <div class="h4" :class="stats.totalScore >= 0 ? 'text-success' : 'text-danger'">
                {{ stats.totalScore >= 0 ? '+' : '' }}{{ stats.totalScore }}
              </div>
              <small class="text-muted">Total Skor</small>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Information Card -->
    <div class="col-12 mb-4">
      <div class="card dashboard-card">
        <div class="card-header">
          <h5 class="mb-0">📋 Informasi Akun</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-4 mb-3">
              <label class="form-label fw-semibold">Email</label>
              <div class="info-display">{{ user.email }}</div>
            </div>
            <div class="col-md-4 mb-3">
              <label class="form-label fw-semibold">Nama Lengkap</label>
              <div class="info-display">{{ fullName || 'Belum diisi' }}</div>
            </div>
            <div class="col-md-4 mb-3">
              <label class="form-label fw-semibold">Bergabung Sejak</label>
              <div class="info-display">{{ formatDate(user.created_at) }}</div>
            </div>
          </div>
          <div class="row mt-3">
            <div class="col-4 col-md-2">
              <button
                class="btn btn-outline-secondary w-100"
                @click="logout"
                :disabled="loggingOut"
              >
                {{ loggingOut ? 'Keluar...' : '🚪 Logout' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Dropdown -->
    <div class="col-12 mb-4">
      <div class="card dashboard-card">
        <div class="card-header">
          <h5 class="mb-0">⚙️ Pengaturan</h5>
        </div>
        <div class="card-body">
          <!-- Settings Buttons -->
          <div class="row g-3">
            <div class="col-6 col-md-6 col-lg-2">
              <button
                class="btn btn-primary w-100 setting-btn text-dark"
                @click="toggleSection('name')"
                :class="{ active: activeSection === 'name' }"
              >
                <i class="fas fa-user me-2"></i>
                Ganti Nama
              </button>
            </div>
            <div class="col-6 col-md-6 col-lg-2">
              <button
                class="btn btn-primary w-100 setting-btn text-dark"
                @click="toggleSection('password')"
                :class="{ active: activeSection === 'password' }"
              >
                <i class="fas fa-lock me-2"></i>
                Ganti Password
              </button>
            </div>
            <div class="col-6 col-md-6 col-lg-2">
              <button
                class="btn btn-primary w-100 setting-btn text-dark"
                @click="toggleSection('theme')"
                :class="{ active: activeSection === 'theme' }"
              >
                <i class="fas fa-palette me-2"></i>
                Pilih Tema
              </button>
            </div>
            <div class="col-6 col-md-6 col-lg-2">
              <button
                class="btn btn-primary w-100 setting-btn text-dark"
                @click="toggleSection('plant')"
                :class="{ active: activeSection === 'plant' }"
              >
                <i class="fas fa-seedling me-2"></i>
                Pilih Tanaman
              </button>
            </div>
            <div class="col-6 col-md-6 col-lg-2">
              <button
                class="btn w-100 setting-btn text-dark"
                @click="toggleSection('score')"
                :class="{ active: activeSection === 'score' }"
              >
                <i class="fas fa-star me-2"></i>
                Pengaturan Skor
              </button>
            </div>
            <div class="col-6 col-md-6 col-lg-2">
              <button
                class="btn w-100 setting-btn text-dark"
                @click="toggleSection('delete')"
                :class="{ active: activeSection === 'delete' }"
              >
                <i class="fas fa-trash me-2"></i>
                Hapus Akun
              </button>
            </div>
          </div>

          <!-- Dynamic Content Area -->
          <div class="settings-content mt-4" v-if="activeSection">
            <div class="card border-0 settings-panel-card">
              <div class="card-body">
                <!-- Change Name Section -->
                <div v-if="activeSection === 'name'" class="setting-panel">
                  <h6 class="fw-semibold mb-3">📝 Ubah Nama Lengkap</h6>
                  <div class="row">
                    <div class="col-6 col-md-3 mb-3">
                      <label class="form-label">Nama Lengkap Baru</label>
                      <input
                        type="text"
                        class="form-control"
                        v-model="tempFullName"
                        placeholder="Masukkan nama lengkap"
                      />
                    </div>
                    <div class="col-4 col-md-2 mb-3 d-flex align-items-end">
                      <button class="btn btn-primary w-100" @click="updateName" :disabled="saving">
                        {{ saving ? 'Menyimpan...' : '💾 Simpan' }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Change Password Section -->
                <div v-if="activeSection === 'password'" class="setting-panel">
                  <h6 class="fw-semibold mb-3">🔒 Ubah Password</h6>
                  <div class="row">
                    <div class="col-md-3 mb-3">
                      <label class="form-label">Password Baru</label>
                      <input
                        type="password"
                        class="form-control"
                        v-model="newPassword"
                        placeholder="Minimal 6 karakter"
                      />
                    </div>
                    <div class="col-md-3 mb-3">
                      <label class="form-label">Konfirmasi Password</label>
                      <input
                        type="password"
                        class="form-control"
                        v-model="confirmPassword"
                        placeholder="Ulangi password baru"
                      />
                    </div>
                    <div class="col-12">
                      <button
                        class="btn btn-warning"
                        @click="changePassword"
                        :disabled="!canChangePassword || changingPassword"
                      >
                        {{ changingPassword ? 'Mengubah...' : '🔑 Ubah Password' }}
                      </button>
                      <div v-if="passwordError" class="alert alert-danger mt-2 mb-0">
                        {{ passwordError }}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Theme Section -->
                <div v-if="activeSection === 'theme'" class="setting-panel">
                  <h6 class="fw-semibold mb-3">🎨 Pengaturan Tema</h6>
                  <div class="row">
                    <div class="col-6 col-md-3 mb-3">
                      <label class="form-label">Tema Aplikasi</label>
                      <select class="form-select" v-model="selectedTheme">
                        <option value="light">☀️ Tema Terang</option>
                        <option value="dark">🌙 Tema Gelap</option>
                      </select>
                    </div>
                    <div class="col-4 col-md-2 mb-3 d-flex align-items-end">
                      <button class="btn btn-primary w-100" @click="changeTheme" :disabled="saving">
                        {{ saving ? 'Menyimpan...' : '💾 Simpan' }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Plant Section -->
                <div v-if="activeSection === 'plant'" class="setting-panel">
                  <h6 class="fw-semibold mb-3">🌱 Pengaturan Tanaman</h6>
                  <div class="row">
                    <div class="col-6 col-md-3 mb-3">
                      <label class="form-label">Jenis Tanaman</label>
                      <select class="form-select" v-model="selectedPlant">
                        <option value="forest">🌳 Pohon Besar (Forest)</option>
                        <option value="garden">🌼 Bunga (Garden)</option>
                      </select>
                      <div class="col-7 col-md-6 col-md-2">
                        <button
                          class="btn btn-primary w-100 mt-3"
                          @click="updatePlantSetting"
                          :disabled="saving"
                        >
                          {{ saving ? 'Menyimpan...' : '💾 Simpan' }}
                        </button>
                      </div>
                    </div>
                    <div class="col-6 col-md-9 mb-3">
                      <label class="form-label">Preview Tanaman</label>
                      <div class="plant-preview p-1 border rounded bg-light text-center">
                        <img
                          :src="getPlantPreviewImage()"
                          :alt="selectedPlant"
                          class="plant-preview-img"
                          style="max-width: 100%; max-height: 120px; object-fit: contain"
                        />
                      </div>
                    </div>

                    <div class="col-md-2 mb-3 d-flex align-items-start"></div>
                  </div>
                </div>

                <!-- Score Settings Section -->
                <div v-if="activeSection === 'score'" class="setting-panel">
                  <h6 class="fw-semibold mb-3">⚡ Pengaturan Skor</h6>
                  <div class="row">
                    <div class="col-5 col-md-3 mb-3">
                      <label class="form-label">Task Selesai</label>
                      <input
                        type="number"
                        class="form-control"
                        v-model.number="scoreReward"
                        min="0.1"
                        max="10"
                        step="0.1"
                        placeholder="1"
                      />
                      <small class="text-muted text-success"
                        >+{{ scoreReward || 1 }} poin per task selesai</small
                      >
                    </div>
                    <div class="col-7 col-md-3 mb-3">
                      <label class="form-label">Task Tidak Dikerjakan</label>
                      <input
                        type="number"
                        class="form-control"
                        v-model.number="scorePenalty"
                        min="0.1"
                        max="10"
                        step="0.1"
                        placeholder="2"
                      />
                      <small class="text-muted text-danger"
                        >-{{ scorePenalty || 2 }} poin per task tidak selesai</small
                      >
                    </div>
                    <div class="col-12 col-md-6 mb-3">
                      <div class="alert alert-info">
                        <strong>Preview Sistem Skor:</strong>
                        <ul class="mb-0 mt-2">
                          <li class="text-success">
                            ✅ Task Selesai: +{{ scoreReward || 1 }} poin
                          </li>
                          <li class="text-danger">
                            ❌ Task Tidak Dikerjakan: -{{ scorePenalty || 2 }} poin
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div class="col-6">
                      <button class="btn btn-info" @click="updateScoreSettings" :disabled="saving">
                        {{ saving ? 'Menyimpan...' : '💾 Simpan' }}
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Delete Account Section -->
                <div v-if="activeSection === 'delete'" class="setting-panel">
                  <h6 class="fw-semibold mb-3 text-danger">⚠️ Hapus Akun Permanen</h6>
                  <div class="alert alert-danger">
                    <strong>Peringatan!</strong> Tindakan ini akan menghapus semua data Anda secara
                    permanen:
                    <ul class="mb-0 mt-2">
                      <li>Semua task template dan instance</li>
                      <li>Riwayat skor dan progress</li>
                      <li>Pengaturan dan preferensi</li>
                    </ul>
                  </div>
                  <button class="btn btn-danger" @click="showDeleteModal = true">
                    🗑️ Saya Mengerti, Hapus Akun
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- No Selection Message -->
          <div v-if="!activeSection" class="text-center text-muted mt-4">
            <i class="fas fa-hand-pointer fa-2x mb-3"></i>
            <p>Pilih salah satu pengaturan di atas untuk mulai mengedit</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Account Modal -->
    <div class="modal fade" id="deleteAccountModal" tabindex="-1" v-show="showDeleteModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header border-danger">
            <h5 class="modal-title text-danger">⚠️ Konfirmasi Hapus Akun</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-danger">
              <strong>Konfirmasi Terakhir!</strong> Semua data akan hilang permanen dan tidak dapat
              dikembalikan.
            </div>
            <p><strong>Ketik "HAPUS AKUN" untuk konfirmasi:</strong></p>
            <input
              type="text"
              class="form-control"
              v-model="deleteConfirmation"
              placeholder="HAPUS AKUN"
            />
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">
              Batal
            </button>
            <button
              type="button"
              class="btn btn-danger"
              @click="deleteAccount"
              :disabled="deleteConfirmation !== 'HAPUS AKUN' || deleting"
            >
              {{ deleting ? 'Menghapus...' : '🗑️ Hapus Akun' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Profile',
  props: ['user', 'supabase'],
  data() {
    return {
      fullName: '',
      tempFullName: '', // Temporary holder for name editing
      selectedTheme: 'light',
      selectedPlant: 'forest',
      newPassword: '',
      confirmPassword: '',
      scoreReward: 1,
      scorePenalty: 2,
      stats: {
        totalDays: 0,
        totalTasks: 0,
        completedTasks: 0,
        totalScore: 0,
      },
      saving: false,
      changingPassword: false,
      passwordError: '',
      showDeleteModal: false,
      deleteConfirmation: '',
      deleting: false,
      loggingOut: false,
      activeSection: null,
      themeChangeTimeout: null,
    };
  },
  computed: {
    canChangePassword() {
      return this.newPassword.length >= 6 && this.newPassword === this.confirmPassword;
    },
  },
  async mounted() {
    await this.loadUserSettings();
    await this.loadUserStats();
    this.setupModal();

    // Apply current theme on load
    this.applyTheme(this.selectedTheme);
  },
  beforeDestroy() {
    this.cleanupModal();
  },
  methods: {
    setupModal() {
      this.$nextTick(() => {
        const modalEl = document.getElementById('deleteAccountModal');
        if (modalEl && window.bootstrap) {
          this.deleteModal = new window.bootstrap.Modal(modalEl);
        }
      });
    },
    cleanupModal() {
      if (this.deleteModal) {
        try {
          this.deleteModal.dispose();
        } catch (e) {}
      }
    },
    async loadUserSettings() {
      try {
        const metadata = this.user.user_metadata || {};
        this.fullName = metadata.full_name || '';
        this.tempFullName = this.fullName; // Initialize temp name
        this.selectedTheme = metadata.theme || 'light';
        this.selectedPlant = metadata.plant_type || 'forest';
        this.scoreReward = parseFloat(metadata.score_reward_complete) || 1;
        this.scorePenalty = parseFloat(metadata.score_penalty_incomplete) || 2;
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    },
    async loadUserStats() {
      try {
        const { data: tasks } = await this.supabase
          .from('daily_tasks_instance')
          .select('date, is_completed')
          .eq('user_id', this.user.id);

        const { data: scores } = await this.supabase
          .from('score_log')
          .select('score_delta')
          .eq('user_id', this.user.id);

        const uniqueDates = new Set((tasks || []).map((t) => t.date));
        const completed = (tasks || []).filter((t) => t.is_completed).length;
        const totalScore = (scores || []).reduce((sum, s) => sum + (s.score_delta || 0), 0);

        this.stats = {
          totalDays: uniqueDates.size,
          totalTasks: (tasks || []).length,
          completedTasks: completed,
          totalScore: totalScore,
        };
      } catch (error) {
        console.error('Error loading user stats:', error);
      }
    },
    // Pastikan ada sesi auth sebelum memanggil updateUser (hindari AuthSessionMissingError)
    async ensureAuthSession() {
      // Simple session check tanpa complex refresh logic
      const { data } = await this.supabase.auth.getSession();
      if (!data?.session) {
        throw new Error('Sesi auth hilang. Silakan login ulang.');
      }
      return data.session;
    },
    // Simplified update user method
    async updateUserWithTimeout(payload, timeoutMs = 5000) {
      try {
        await this.ensureAuthSession();

        // Use Promise.race for timeout
        const updatePromise = this.supabase.auth.updateUser(payload);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeoutMs),
        );

        const result = await Promise.race([updatePromise, timeoutPromise]);
        return result;
      } catch (error) {
        // Simplified error handling
        if (error.message.includes('timeout')) {
          throw new Error('Koneksi lambat, coba lagi');
        }
        throw error;
      }
    },
    async updateProfile() {
      try {
        this.saving = true;
        const { error } = await this.updateUserWithTimeout({
          data: {
            full_name: this.fullName,
            theme: this.selectedTheme,
            plant_type: this.selectedPlant,
            score_reward_complete: this.scoreReward,
            daily_target: this.dailyTarget,
          },
        });
        if (error) throw error;
        this.showToast('Profil berhasil diperbarui', 'success');
      } catch (error) {
        console.error('Error updating profile:', error);
        this.showToast('Gagal memperbarui profil: ' + error.message, 'danger');
      } finally {
        this.saving = false;
      }
    },
    async updateName() {
      try {
        this.saving = true;
        const { error } = await this.updateUserWithTimeout({
          data: { full_name: this.tempFullName },
        });
        if (error) throw error;

        this.fullName = this.tempFullName;
        this.showToast('Nama berhasil diperbarui!', 'success'); // ✅ Fixed
        this.activeSection = null;
      } catch (error) {
        console.error('Error updating name:', error);
        this.showToast('Gagal memperbarui nama: ' + error.message, 'danger'); // ✅ Fixed
      } finally {
        this.saving = false;
      }
    },
    toggleSection(section) {
      // Toggle the section - close if already open, open if closed
      this.activeSection = this.activeSection === section ? null : section;

      // Reset form values when opening sections
      if (this.activeSection === 'name') {
        this.tempFullName = this.fullName;
      } else if (this.activeSection === 'password') {
        this.newPassword = '';
        this.confirmPassword = '';
        this.passwordError = '';
      }
    },
    async changeTheme() {
      try {
        // Immediate UI update tanpa waiting
        this.applyTheme(this.selectedTheme);

        // Broadcast immediate untuk responsiveness
        window.dispatchEvent(
          new CustomEvent('theme-changed', {
            detail: { theme: this.selectedTheme },
          }),
        );

        // Background save tanpa blocking UI
        this.saveThemeInBackground();

        // Immediate feedback
        this.showToast('Tema berhasil diubah!', 'success');
        this.activeSection = null;
      } catch (error) {
        console.error('Error applying theme:', error);
      }
    },

    // TAMBAH method baru ini:
    saveThemeInBackground() {
      // Clear previous timeout
      if (this.themeChangeTimeout) {
        clearTimeout(this.themeChangeTimeout);
      }

      // Background save tanpa loading state
      this.themeChangeTimeout = setTimeout(async () => {
        try {
          await this.supabase.auth.updateUser({
            data: { theme: this.selectedTheme },
          });
          console.log('Theme saved to server successfully');
        } catch (error) {
          console.warn('Failed to save theme to server:', error);
          // Tidak perlu toast error karena tema sudah berubah di UI
        }
      }, 1000); // Longer delay, background operation
    },
    async updatePlantSetting() {
      try {
        // Immediate UI updates
        localStorage.setItem('pt_plant', this.selectedPlant);
        window.dispatchEvent(
          new CustomEvent('plant-type-changed', {
            detail: { plantType: this.selectedPlant },
          }),
        );

        // Immediate feedback
        this.showToast('Pengaturan tanaman berhasil diubah!', 'success');
        this.activeSection = null;

        // Background save
        this.savePlantInBackground();
      } catch (error) {
        console.error('Error updating plant setting:', error);
        this.showToast('Gagal mengubah pengaturan tanaman', 'danger');
      }
    },

    // TAMBAH method baru:
    savePlantInBackground() {
      if (this.plantChangeTimeout) {
        clearTimeout(this.plantChangeTimeout);
      }

      this.plantChangeTimeout = setTimeout(async () => {
        try {
          await this.supabase.auth.updateUser({
            data: { plant_type: this.selectedPlant },
          });
          console.log('Plant setting saved to server successfully');
        } catch (error) {
          console.warn('Failed to save plant setting to server:', error);
        }
      }, 1000);
    },
    getPlantPreviewImage() {
      // Get a preview image based on selected plant type
      if (this.selectedPlant === 'forest') {
        return '/src/asset/forest/plant-4-perfect.png'; // Best forest plant
      } else if (this.selectedPlant === 'garden') {
        return '/src/asset/garden/5.png'; // Garden plant
      }
      return '/src/asset/forest/plant-4-perfect.png'; // Default fallback
    },
    async updateScoreSettings() {
      try {
        this.saving = true;
        const { error } = await this.updateUserWithTimeout({
          data: {
            score_reward_complete: this.scoreReward,
            score_penalty_incomplete: this.scorePenalty,
          },
        });
        if (error) throw error;

        this.showToast('Pengaturan skor berhasil diperbarui!', 'success');
        this.activeSection = null;
      } catch (error) {
        console.error('Error updating score settings:', error);
        this.showToast('Gagal memperbarui pengaturan skor: ' + error.message, 'danger');
      } finally {
        this.saving = false;
      }
    },
    async changePassword() {
      try {
        this.changingPassword = true;
        this.passwordError = '';

        if (this.newPassword.length < 6) {
          this.passwordError = 'Password harus minimal 6 karakter';
          return;
        }

        if (this.newPassword !== this.confirmPassword) {
          this.passwordError = 'Konfirmasi password tidak cocok';
          return;
        }

        const { error } = await this.updateUserWithTimeout({
          password: this.newPassword,
        });

        if (error) throw error;

        this.newPassword = '';
        this.confirmPassword = '';
        this.showToast('Password berhasil diubah!', 'success');
        this.activeSection = null; // Close section after success
      } catch (error) {
        console.error('Error changing password:', error);
        this.passwordError = 'Gagal mengubah password: ' + error.message;
      } finally {
        this.changingPassword = false;
      }
    },
    async deleteAccount() {
      try {
        this.deleting = true;

        // Delete user data first
        await this.supabase.from('daily_tasks_instance').delete().eq('user_id', this.user.id);
        await this.supabase.from('daily_tasks_template').delete().eq('user_id', this.user.id);
        await this.supabase.from('score_log').delete().eq('user_id', this.user.id);

        // Delete user account
        const { error } = await this.supabase.auth.admin.deleteUser(this.user.id);
        if (error) throw error;

        // Sign out
        await this.supabase.auth.signOut();
        window.location.reload();
      } catch (error) {
        console.error('Error deleting account:', error);
        this.showToast('Gagal menghapus akun: ' + error.message, 'danger');
      } finally {
        this.deleting = false;
        this.showDeleteModal = false;
      }
    },
    applyTheme(theme) {
      // Single DOM operation
      document.documentElement.setAttribute('data-bs-theme', theme);
      document.body.className =
        document.body.className.replace(/theme-\w+/g, '') + ` theme-${theme}`;
      localStorage.setItem('app-theme', theme);
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    },
    async logout() {
      try {
        this.loggingOut = true;

        // Fast logout - don't wait for session validation
        try {
          await this.supabase.auth.signOut({ scope: 'global' });
        } catch (error) {
          // If global signout fails, do local signout
          await this.supabase.auth.signOut({ scope: 'local' });
        }

        // Clear auth tokens efficiently
        const authKeys = Object.keys(localStorage).filter(
          (key) => key.startsWith('sb-') && key.includes('-auth-token'),
        );
        authKeys.forEach((key) => localStorage.removeItem(key));

        // Immediate redirect without waiting
        window.location.href = '/';
      } catch (error) {
        console.error('Logout error:', error);
        // Force redirect even if logout fails
        window.location.href = '/';
      }
    },
    showToast(message, variant = 'primary', delay = 3000) {
      try {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toastEl = document.createElement('div');
        toastEl.className = `toast align-items-center text-bg-${variant} border-0`;
        toastEl.setAttribute('role', 'alert');
        toastEl.innerHTML = `
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>`;

        container.appendChild(toastEl);
        const toast = new window.bootstrap.Toast(toastEl, { delay });
        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
        toast.show();
      } catch (error) {
        console.error('Toast error:', error);
      }
    },
  },
  watch: {
    showDeleteModal(show) {
      if (this.deleteModal) {
        if (show) {
          this.deleteModal.show();
        } else {
          this.deleteModal.hide();
        }
      }
    },
  },
  beforeUnmount() {
    // Clear timeouts
    if (this.themeChangeTimeout) {
      clearTimeout(this.themeChangeTimeout);
    }

    // Cleanup modal
    this.cleanupModal();
  },
};
</script>

<style scoped>
/* Info Display Styling */
.info-display {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e9ecef;
  border-radius: 0.375rem;
  color: #495057;
  font-weight: 500;
  background-color: #f8f9fa;
}

/* Dark theme for info display */
[data-bs-theme='dark'] .info-display {
  background-color: #374151;
  border-color: rgba(148, 163, 184, 0.2);
  color: #e5e7eb;
}

.info-display:empty::before {
  content: 'Belum diisi';
  color: #6c757d;
  font-style: italic;
}

[data-bs-theme='dark'] .info-display:empty::before {
  color: #9ca3af;
}

/* Setting Buttons */
.setting-btn {
  height: 3rem;
  transition: all 0.3s ease;
}

.setting-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.setting-btn.active {
  background-color: var(--bs-primary);
  color: white;
  border-color: var(--bs-primary);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(13, 110, 253, 0.3);
}

.setting-btn.active.btn-outline-warning {
  background-color: var(--bs-warning);
  border-color: var(--bs-warning);
  color: var(--bs-dark);
}

.setting-btn.active.btn-outline-success {
  background-color: var(--bs-success);
  border-color: var(--bs-success);
}

.setting-btn.active.btn-outline-info {
  background-color: var(--bs-info);
  border-color: var(--bs-info);
}

.setting-btn.active.btn-outline-danger {
  background-color: var(--bs-danger);
  border-color: var(--bs-danger);
  color: white;
}

/* Settings Panel Card */
.settings-panel-card {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
}

[data-bs-theme='dark'] .settings-panel-card {
  background-color: #374151;
  border-color: rgba(148, 163, 184, 0.2);
}

/* Plant Preview Dark Theme */
[data-bs-theme='dark'] .plant-preview {
  background-color: #374151 !important;
  border-color: rgba(148, 163, 184, 0.2) !important;
}

/* Settings Content */
settings-content {
  animation: slideDown 0.3s ease-out;
}

.setting-panel {
  animation: fadeIn 0.2s ease-in;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
    max-height: 0;
  }
  to {
    opacity: 1;
    transform: translateY(0);
    max-height: 500px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Form Styling */
.profile-page .form-control:focus,
.profile-page .form-select:focus {
  border-color: #0d6efd;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

.profile-page .form-label {
  font-weight: 500;
  color: #495057;
  margin-bottom: 0.5rem;
}

/* Dark theme form styling */
[data-bs-theme='dark'] .profile-page .form-label {
  color: #e5e7eb;
}

[data-bs-theme='dark'] .profile-page .form-control,
[data-bs-theme='dark'] .profile-page .form-select {
  background-color: #374151;
  border-color: rgba(148, 163, 184, 0.2);
  color: #e5e7eb;
}

[data-bs-theme='dark'] .profile-page .form-control:focus,
[data-bs-theme='dark'] .profile-page .form-select:focus {
  background-color: #374151;
  border-color: #60a5fa;
  color: #e5e7eb;
  box-shadow: 0 0 0 0.2rem rgba(96, 165, 250, 0.25);
}

[data-bs-theme='dark'] .profile-page .form-control::placeholder {
  color: #9ca3af;
}

/* Button Styling */
.btn {
  transition: all 0.2s ease;
  font-weight: 500;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Alert Styling */
.alert {
  border-radius: 0.5rem;
  border-width: 1px;
}

/* Dark theme alert styling */
[data-bs-theme='dark'] .alert-info {
  background-color: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
  color: #93c5fd;
}

[data-bs-theme='dark'] .alert-danger {
  background-color: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

[data-bs-theme='dark'] .text-success {
  color: #86efac !important;
}

[data-bs-theme='dark'] .text-danger {
  color: #fca5a5 !important;
}

[data-bs-theme='dark'] .text-muted {
  color: #9ca3af !important;
}

/* Small text styling for dark theme */
[data-bs-theme='dark'] small.text-muted {
  color: #9ca3af !important;
}

[data-bs-theme='dark'] small.text-success {
  color: #86efac !important;
}

[data-bs-theme='dark'] small.text-danger {
  color: #fca5a5 !important;
}

/* Button styling for dark theme */
[data-bs-theme='dark'] .btn-outline-secondary {
  border-color: rgba(148, 163, 184, 0.5);
  color: #e5e7eb;
}

[data-bs-theme='dark'] .btn-outline-secondary:hover {
  background-color: #374151;
  border-color: #60a5fa;
  color: #e5e7eb;
}

/* Modal Styling */
.modal-content {
  border-radius: 0.75rem;
  border: none;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.modal-header.border-danger {
  border-bottom-color: #dc3545;
  background-color: #fff5f5;
}

/* Dark theme modal styling */
[data-bs-theme='dark'] .modal-content {
  background-color: #1f2937;
  color: #e5e7eb;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

[data-bs-theme='dark'] .modal-header {
  border-bottom-color: rgba(148, 163, 184, 0.2);
  background-color: #374151;
}

[data-bs-theme='dark'] .modal-header.border-danger {
  background-color: rgba(239, 68, 68, 0.15);
  border-bottom-color: rgba(239, 68, 68, 0.3);
}

[data-bs-theme='dark'] .modal-footer {
  border-top-color: rgba(148, 163, 184, 0.2);
}

/* Page Animation */
.fade-in {
  animation: fadeInPage 0.3s ease-in-out;
}

@keyframes fadeInPage {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Card Styling */
.dashboard-card {
  border: none;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.dashboard-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

/* Dark theme card styling */
[data-bs-theme='dark'] .dashboard-card {
  background-color: #1f2937;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

[data-bs-theme='dark'] .dashboard-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

[data-bs-theme='dark'] .dashboard-card .card-header {
  background-color: #374151;
  border-bottom-color: rgba(148, 163, 184, 0.2);
  color: #e5e7eb;
}

[data-bs-theme='dark'] .dashboard-card .card-body {
  background-color: #1f2937;
  color: #e5e7eb;
}

/* Responsive Design */
@media (max-width: 768px) {
  .setting-btn {
    height: 2.5rem;
    font-size: 0.875rem;
  }

  .d-flex.justify-content-between {
    flex-direction: column;
    align-items: stretch !important;
    gap: 1rem;
  }

  .d-flex.justify-content-between h4 {
    text-align: center;
  }

  .settings-content {
    margin-top: 1rem !important;
  }
}

@media (max-width: 576px) {
  .info-display {
    font-size: 0.875rem;
  }

  .col-md-4 {
    margin-bottom: 1rem !important;
  }
}

/* Focus States */
.setting-btn:focus {
  outline: none;
  box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
}

/* Loading States */
.btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none !important;
}

/* Icon Styling */
.fas {
  width: 16px;
  text-align: center;
}

/* Plant Preview Styling */
.plant-preview {
  transition: all 0.3s ease;
}

.plant-preview:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.plant-preview-img {
  transition: all 0.3s ease;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.plant-preview-img:hover {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
}
</style>
