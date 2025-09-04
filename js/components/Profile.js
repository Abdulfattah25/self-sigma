Vue.component("profile", {
  props: ["user", "supabase"],
  data() {
    return {
      // overview | edit-nama | password | tema | plant | skor
      activeSection: "overview",
      form: {
        fullName: this.user?.user_metadata?.full_name || "",
        email: this.user?.email || "",
        newPassword: "",
        confirmNewPassword: "",
        // Score settings
        scoreReward: this.user?.user_metadata?.score_reward_complete ?? 1,
        scorePenalty: this.user?.user_metadata?.score_penalty_overdue ?? -2,
      },
      show: {
        newPassword: false,
        confirmNewPassword: false,
      },

      // Dropdown Pengaturan
      showMenu: false,

      // Tema
      theme: localStorage.getItem("pt_theme") || "system", // system | light | dark
      appliedTheme: "light",
      mql: null,

      // Tanaman
      plantOptions: [
        { value: "bonsai", label: "Bonsai �" },
        { value: "monstera", label: "Monstera �" },
        // Opsi lain bisa ditambahkan di masa depan
      ],
      selectedPlant:
        (typeof this.user?.user_metadata?.plant_type === "string" ? this.user.user_metadata.plant_type : null) ||
        localStorage.getItem("pt_plant") ||
        "bonsai",

      loading: false,
      message: "",
      error: "",
    };
  },
  mounted() {
    this.applyTheme();
    if (window?.matchMedia) {
      this.mql = window.matchMedia("(prefers-color-scheme: dark)");
      this.mql.addEventListener?.("change", this.onSystemThemeChange);
    }
    document.addEventListener("click", this.onDocumentClick);
  },
  beforeDestroy() {
    if (this.mql?.removeEventListener) {
      this.mql.removeEventListener("change", this.onSystemThemeChange);
    }
    document.removeEventListener("click", this.onDocumentClick);
  },
  methods: {
    // Dropdown
    toggleMenu() {
      this.showMenu = !this.showMenu;
    },
    onDocumentClick(e) {
      const el = this.$refs.settingsDropdown;
      if (this.showMenu && el && !el.contains(e.target)) {
        this.showMenu = false;
      }
    },
    selectSection(section) {
      this.activeSection = section;
      this.showMenu = false;
      this.message = "";
      this.error = "";
      this.$nextTick(() => {
        if (section === "edit-nama") {
          this.$refs.inputFullName?.focus?.();
        } else if (section === "password") {
          this.$refs.inputNewPassword?.focus?.();
        }
      });
    },

    // Tema
    onSystemThemeChange() {
      if (this.theme === "system") this.applyTheme();
    },
    getEffectiveTheme() {
      if (this.theme === "system") {
        const dark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
        return dark ? "dark" : "light";
      }
      return this.theme;
    },
    applyTheme() {
      const eff = this.getEffectiveTheme();
      document.documentElement.setAttribute("data-bs-theme", eff);
      this.appliedTheme = eff;
    },
    setTheme(next) {
      this.theme = next;
      localStorage.setItem("pt_theme", next);
      this.applyTheme();
      this.$root?.showToast?.("Tema diterapkan", "success");
      if (this.activeSection === "tema") {
        this.activeSection = "overview";
      }
    },

    // Akun: Update Nama
    async updateName() {
      this.error = this.message = "";
      if (!this.form.fullName.trim()) {
        this.error = "Nama tidak boleh kosong";
        return;
      }
      try {
        this.loading = true;
        const { error } = await this.supabase.auth.updateUser({
          data: { full_name: this.form.fullName.trim() },
        });
        if (error) throw error;
        this.message = "Nama berhasil diperbarui";
        this.$root?.showToast?.("Nama berhasil diperbarui", "success");
        this.activeSection = "overview";
      } catch (e) {
        this.error = e.message || "Gagal memperbarui nama";
        this.$root?.showToast?.(this.error, "danger");
      } finally {
        this.loading = false;
      }
    },

    // Keamanan: Update Password
    async updatePassword() {
      this.error = this.message = "";
      if (!this.form.newPassword || this.form.newPassword.length < 6) {
        this.error = "Password minimal 6 karakter";
        return;
      }
      if (this.form.newPassword !== this.form.confirmNewPassword) {
        this.error = "Konfirmasi password tidak cocok";
        return;
      }
      try {
        this.loading = true;
        const { error } = await this.supabase.auth.updateUser({
          password: this.form.newPassword,
        });
        if (error) throw error;
        this.message = "Password berhasil diubah";
        this.$root?.showToast?.("Password berhasil diubah", "success");
        this.form.newPassword = this.form.confirmNewPassword = "";
        this.show.newPassword = this.show.confirmNewPassword = false;
        this.activeSection = "overview";
      } catch (e) {
        this.error = e.message || "Gagal mengubah password";
        this.$root?.showToast?.(this.error, "danger");
      } finally {
        this.loading = false;
      }
    },
    togglePassword(field) {
      this.show[field] = !this.show[field];
    },

    // Tanaman: Update pilihan
    async updatePlant() {
      this.error = this.message = "";
      try {
        this.loading = true;
        const { error } = await this.supabase.auth.updateUser({
          data: { plant_type: this.selectedPlant },
        });
        if (error) throw error;

        localStorage.setItem("pt_plant", this.selectedPlant);

        // Tambahan: update state global agar Dashboard/Report reaktif
        if (this.$root) {
          this.$root.selectedPlant = this.selectedPlant;
        }

        this.message = "Tanaman berhasil diganti";
        this.$root?.showToast?.("Tanaman berhasil diganti", "success");
        this.activeSection = "overview";
      } catch (e) {
        this.error = e.message || "Gagal mengganti tanaman";
        this.$root?.showToast?.(this.error, "danger");
      } finally {
        this.loading = false;
      }
    },

    // Skor: Simpan pengaturan
    async saveScoreSettings() {
      this.error = this.message = "";
      const reward = parseFloat(this.form.scoreReward);
      const penalty = parseFloat(this.form.scorePenalty);

      if (!Number.isFinite(reward)) {
        this.error = "Nilai skor selesai tidak valid";
        this.$root?.showToast?.(this.error, "danger");
        return;
      }
      if (!Number.isFinite(penalty)) {
        this.error = "Nilai penalti tidak valid";
        this.$root?.showToast?.(this.error, "danger");
        return;
      }

      try {
        this.loading = true;
        const { error } = await this.supabase.auth.updateUser({
          data: {
            score_reward_complete: reward,
            score_penalty_overdue: penalty,
          },
        });
        if (error) throw error;

        // Update user metadata in-place for reactive components
        if (this.$root?.user) {
          this.$root.user.user_metadata = {
            ...(this.$root.user.user_metadata || {}),
            score_reward_complete: reward,
            score_penalty_overdue: penalty,
          };
        }

        this.message = "Pengaturan skor disimpan";
        this.$root?.showToast?.("Pengaturan skor disimpan", "success");
        this.activeSection = "overview";
      } catch (e) {
        this.error = e.message || "Gagal menyimpan pengaturan skor";
        this.$root?.showToast?.(this.error, "danger");
      } finally {
        this.loading = false;
      }
    },

    async signOut() {
      try {
        const { error } = await this.supabase.auth.signOut();
        if (error) throw error;
        this.$root.showToast("Logout berhasil", "success");
      } catch (e) {
        this.$root.showToast(e.message, "danger");
      }
    },
  },
  template: `
    <div class="container profile-page">
      <div class="row justify-content-center">
        <div class="col-lg-12">

          <!-- Header / Hero card -->
          <div class="card quote-card mb-3">
            <div class="card-body d-flex align-items-center gap-3">
              <div class="brand-badge flex-shrink-0" style="background: rgba(255,255,255,.2); color: #fff;">
                {{ (form.fullName || form.email || 'U')[0]?.toUpperCase() }}
              </div>
              <div class="flex-grow-1">
                <div class="small text-white-50 mb-1">Profil</div>
                <div class="d-flex align-items-center gap-2">
                  <h5 class="mb-0 text-white">{{ form.fullName || 'Pengguna' }}</h5>
                </div>
                <div class="small text-white-75">{{ form.email }}</div>
              </div>

              <div class="d-flex gap-2">
                <button class="btn btn-danger-outline ms-auto text-light fw-bold" @click="signOut">
                  <i class="bi bi-box-arrow-right"></i> Logout
                </button>
              </div>
            </div>
          </div>

          <!-- Kartu Pengaturan -->
          <div class="card">
            <div class="card-body">

              <!-- Overview -->
              <div v-show="activeSection === 'overview'" class="fade-in">
                <div class="mb-3">
                  <label class="form-label">Nama</label>
                  <div class="form-control-plaintext">{{ form.fullName || '-' }}</div>
                </div>
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <div class="form-control-plaintext">{{ form.email || '-' }}</div>
                </div>

                <div class="position-relative d-inline-block" ref="settingsDropdown" style="z-index: 1700;">
                  <button
                    class="btn btn-outline-secondary btn-sm btn-icon"
                    @click.stop="toggleMenu"
                    :aria-expanded="showMenu ? 'true' : 'false'">
                    <i class="bi bi-gear"></i>
                    <span>Pengaturan</span>
                  </button>
                  <ul
                    v-if="showMenu"
                    class="dropdown-menu show mt-2"
                    style="display:block; position:absolute; left:0; top:100%; z-index:1700;">
                    <li>
                      <button class="dropdown-item d-flex align-items-center gap-2" @click="selectSection('edit-nama')">
                        <i class="bi bi-pencil-square"></i> Edit Nama
                      </button>
                    </li>
                    <li>
                      <button class="dropdown-item d-flex align-items-center gap-2" @click="selectSection('password')">
                        <i class="bi bi-shield-lock"></i> Password
                      </button>
                    </li>
                    <li>
                      <button class="dropdown-item d-flex align-items-center gap-2" @click="selectSection('tema')">
                        <i class="bi bi-palette"></i> Tema
                      </button>
                    </li>
                    <li>
                      <button class="dropdown-item d-flex align-items-center gap-2" @click="selectSection('skor')">
                        <i class="bi bi-123"></i> Pengaturan Skor
                      </button>
                    </li>
                    <li><hr class="dropdown-divider" /></li>
                    <li>
                      <button class="dropdown-item d-flex align-items-center gap-2" @click="selectSection('plant')">
                        <i class="bi bi-flower3"></i> Ganti Tanaman
                      </button>
                    </li>
                  </ul>
                </div>
              </div>

              <!-- Edit Nama -->
              <div v-show="activeSection === 'edit-nama'" class="fade-in">
                <div class="mb-3">
                  <label class="form-label">Nama</label>
                  <div class="field">
                    <i class="bi bi-person icon"></i>
                    <input
                      type="text"
                      ref="inputFullName"
                      v-model="form.fullName"
                      class="form-control"
                      placeholder="Nama lengkap" />
                  </div>
                  <button class="btn btn-gradient mt-2 btn-icon" :disabled="loading" @click="updateName">
                    <i class="bi bi-save"></i> Simpan Nama
                  </button>
                </div>
              </div>

              <!-- Ganti Password -->
              <div v-show="activeSection === 'password'" class="fade-in">
                <div class="mb-3">
                  <label class="form-label">Ganti Password</label>

                  <div class="field mb-2">
                    <i class="bi bi-key icon"></i>
                    <input
                      :type="show.newPassword ? 'text' : 'password'"
                      ref="inputNewPassword"
                      v-model="form.newPassword"
                      class="form-control"
                      placeholder="Password baru" />
                    <button type="button" class="toggle-password" @click="togglePassword('newPassword')" :aria-label="show.newPassword ? 'Sembunyikan' : 'Tampilkan'">
                      <i class="bi" :class="show.newPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                    </button>
                  </div>

                  <div class="field">
                    <i class="bi bi-shield-check icon me-2"></i>
                    <input
                      :type="show.confirmNewPassword ? 'text' : 'password'"
                      v-model="form.confirmNewPassword"
                      class="form-control "
                      placeholder="Konfirmasi password baru" />
                    <button type="button" class="toggle-password" @click="togglePassword('confirmNewPassword')" :aria-label="show.confirmNewPassword ? 'Sembunyikan' : 'Tampilkan'">
                      <i class="bi" :class="show.confirmNewPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                    </button>
                  </div>

                  <button class="btn btn-outline-primary mt-3 btn-icon" :disabled="loading" @click="updatePassword">
                    <i class="bi bi-shield-lock"></i> Ubah Password
                  </button>
                </div>
              </div>

              <!-- Tema -->
              <div v-show="activeSection === 'tema'" class="fade-in">
                <div class="mb-2">
                  <label class="form-label d-flex align-items-center gap-2">
                    <i class="bi bi-palette"></i>
                    Pilih Tema
                  </label>
                </div>
                <div class="d-flex flex-wrap gap-2">
                  <input class="btn-check" type="radio" name="theme" id="theme-system" value="system" v-model="theme" @change="setTheme('system')" />
                  <label class="btn btn-outline-secondary" :class="{ active: theme === 'system' }" for="theme-system">
                    <i class="bi bi-laptop me-1"></i> Sistem
                  </label>

                  <input class="btn-check" type="radio" name="theme" id="theme-light" value="light" v-model="theme" @change="setTheme('light')" />
                  <label class="btn btn-outline-secondary" :class="{ active: theme === 'light' }" for="theme-light">
                    <i class="bi bi-sun me-1"></i> Terang
                  </label>

                  <input class="btn-check" type="radio" name="theme" id="theme-dark" value="dark" v-model="theme" @change="setTheme('dark')" />
                  <label class="btn btn-outline-secondary" :class="{ active: theme === 'dark' }" for="theme-dark">
                    <i class="bi bi-moon-stars me-1"></i> Gelap
                  </label>
                </div>
                <small class="text-muted d-block mt-2">
                  Tema aktif: <span class="fw-semibold text-capitalize">{{ appliedTheme }}</span>
                </small>
              </div>

              <!-- Pengaturan Skor -->
              <div v-show="activeSection === 'skor'" class="fade-in">
                <div class="mb-2">
                  <label class="form-label d-flex align-items-center gap-2">
                    <i class="bi bi-123"></i>
                    Pengaturan Skor
                  </label>
                </div>
                <div class="row g-3">
                  <div class="col-md-3">
                    <label class="form-label">Skor Selesai (+)</label>
                    <input type="number" step="1" class="form-control" v-model.number="form.scoreReward" />
                    <small class="text-muted">Default: 1</small>
                  </div>
                  <div class="col-md-3">
                    <label class="form-label">Penalti Tidak Dikerjakan (−)</label>
                    <input type="number" step="1" class="form-control" v-model.number="form.scorePenalty" />
                    <small class="text-muted">Default: -2</small>
                  </div>
                </div>
                <button class="btn btn-outline-primary mt-3 btn-icon" :disabled="loading" @click="saveScoreSettings">
                  <i class="bi bi-save"></i> Simpan Pengaturan Skor
                </button>
              </div>

              <!-- Ganti Tanaman -->
              <div v-show="activeSection === 'plant'" class="fade-in">
                <div class="mb-2">
                  <label class="form-label d-flex align-items-center gap-2">
                    <i class="bi bi-flower3"></i>
                    Pilih Tanaman
                  </label>
                </div>
                <div class="row g-3">
                  <div class="col-md-6" v-for="opt in plantOptions" :key="opt.value">
                    <div
                      class="card border-0 shadow-sm"
                      :class="{'border-primary': selectedPlant === opt.value}"
                    >
                      <div class="card-body d-flex align-items-center gap-3">
                        <div class="icon-bubble" style="background: rgba(13,110,253,.06);">
                          <span style="font-size:1.1rem">{{ opt.label.split(' ').slice(-1)[0] }}</span>
                        </div>
                        <div class="flex-grow-1">
                          <div class="fw-semibold text-capitalize">{{ opt.label }}</div>
                          <div class="small text-muted">Pilih {{ opt.value }} sebagai tanaman Anda.</div>
                        </div>
                        <div class="form-check m-0">
                          <input
                            class="form-check-input"
                            type="radio"
                            name="plant"
                            :id="'plant-' + opt.value"
                            :value="opt.value"
                            v-model="selectedPlant"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button class="btn btn-outline-primary mt-3 btn-icon" :disabled="loading" @click="updatePlant">
                  <i class="bi bi-check2-circle"></i> Simpan Tanaman
                </button>
              </div>

              <div v-if="message" class="alert alert-success mt-3">{{ message }}</div>
              <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
});
