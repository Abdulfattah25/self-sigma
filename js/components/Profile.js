Vue.component("profile", {
  props: ["user", "supabase"],
  data() {
    return {
      form: {
        fullName: this.user?.user_metadata?.full_name || "",
        email: this.user?.email || "",
        password: "",
        newPassword: "",
        confirmNewPassword: "",
      },
      loading: false,
      message: "",
      error: "",
    };
  },
  methods: {
    async updateName() {
      this.error = this.message = "";
      if (!this.form.fullName.trim()) {
        this.error = "Nama tidak boleh kosong";
        return;
      }
      try {
        this.loading = true;
        const { data, error } = await this.supabase.auth.updateUser({
          data: { full_name: this.form.fullName.trim() },
        });
        if (error) throw error;
        this.message = "Nama berhasil diperbarui";
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
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
        this.form.newPassword = this.form.confirmNewPassword = "";
      } catch (e) {
        this.error = e.message;
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
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-6">
          <div class="card mb-3">
            <div class="card-header"><strong>👤 Profil</strong></div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label">Nama</label>
                <input type="text" v-model="form.fullName" class="form-control" placeholder="Nama lengkap">
                <button class="btn btn-primary mt-2" :disabled="loading" @click="updateName">Simpan Nama</button>
              </div>
              <div class="mb-3">
                <label class="form-label">Email</label>
                <input type="email" v-model="form.email" class="form-control" disabled>
                <small class="text-muted">Perubahan email belum didukung.</small>
              </div>
              <div class="mb-3">
                <label class="form-label">Ganti Password</label>
                <input type="password" v-model="form.newPassword" class="form-control mb-2" placeholder="Password baru">
                <input type="password" v-model="form.confirmNewPassword" class="form-control" placeholder="Konfirmasi password baru">
                <button class="btn btn-outline-primary mt-2" :disabled="loading" @click="updatePassword">Ubah Password</button>
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-outline-secondary" @click="$root.setView('dashboard')">Kembali</button>
                <button class="btn btn-danger ms-auto" @click="signOut">Logout</button>
              </div>
              <div v-if="message" class="alert alert-success mt-3">{{ message }}</div>
              <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><strong>⚙️ Pengaturan Lain</strong></div>
            <div class="card-body">
              <ul class="list-unstyled mb-0">
                <li class="mb-2">🔔 Notifikasi (segera hadir)</li>
                <li class="mb-2">🎨 Tema (segera hadir)</li>
                <li class="mb-2">🗂️ Ekspor data (segera hadir)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
});
