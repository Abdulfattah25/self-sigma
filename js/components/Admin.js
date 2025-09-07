Vue.component("admin", {
  props: ["user", "supabase"],
  data() {
    return {
      // Users
      loading: true,
      saving: false,
      users: [],
      originals: {},
      errorMsg: "",
      successMsg: "",

      // Licenses
      licenseLoading: false,
      genLoading: false,
      licenses: [],
      licenseFilter: "all", // all | valid | used | revoked | expired
      licenseError: "",
      licenseSuccess: "",
      licenseChannel: null,
    };
  },
  computed: {
    changedRows() {
      const orig = this.originals || {};
      return (this.users || []).filter((u) => {
        const o = orig[u.id];
        return o && (o.role !== u.role || o.is_active !== u.is_active);
      });
    },
    hasChanges() {
      return this.changedRows.length > 0;
    },
  },
  watch: {
    licenseFilter() {
      this.loadLicenses();
    },
  },
  async mounted() {
    try {
      await this.loadProfiles();
      await this.loadLicenses();

      // Supabase Realtime: listen to license changes
      this.licenseChannel = this.supabase
        .channel("licenses_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "licenses" }, () => this.loadLicenses())
        .subscribe();
    } catch (e) {
      this.errorMsg = e.message || "Gagal memuat Admin";
    } finally {
      this.loading = false;
    }
  },
  beforeDestroy() {
    try {
      if (this.licenseChannel) this.supabase.removeChannel(this.licenseChannel);
    } catch (_) {}
  },
  methods: {
    // ===== Users =====
    async loadProfiles() {
      this.errorMsg = "";
      const { data, error } = await this.supabase
        .from("profiles")
        .select("id, email, role, is_active")
        .order("email", { ascending: true });
      if (error) {
        this.errorMsg = error.message;
        return;
      }
      this.users = data || [];
      const snap = {};
      for (const u of this.users) snap[u.id] = { role: u.role, is_active: u.is_active };
      this.originals = snap;
    },
    async saveChanges() {
      if (!this.hasChanges) return;
      this.saving = true;
      this.errorMsg = "";
      this.successMsg = "";
      try {
        const list = this.changedRows.slice();
        for (const u of list) {
          await this.updateProfile(u.id, u.role, u.is_active);
        }
        this.successMsg = "Perubahan berhasil disimpan";
        const snap = {};
        for (const u of this.users) snap[u.id] = { role: u.role, is_active: u.is_active };
        this.originals = snap;
      } catch (e) {
        this.errorMsg = e.message || "Gagal menyimpan perubahan";
      } finally {
        this.saving = false;
      }
    },
    async updateProfile(userId, newRole, isActive) {
      const { error } = await this.supabase
        .from("profiles")
        .update({ role: newRole, is_active: isActive })
        .eq("id", userId);
      if (error) throw error;
    },

    // ===== Licenses =====
    async loadLicenses() {
      this.licenseError = "";
      this.licenseLoading = true;
      try {
        let query = this.supabase
          .from("licenses")
          .select("id, code, status, assigned_email, created_at, used_at")
          .order("created_at", { ascending: false });
        if (this.licenseFilter !== "all") query = query.eq("status", this.licenseFilter);
        const { data, error } = await query;
        if (error) throw error;
        this.licenses = data || [];
      } catch (e) {
        this.licenseError = e.message || "Gagal memuat lisensi";
      } finally {
        this.licenseLoading = false;
      }
    },
    async generateLicense() {
      this.licenseError = "";
      this.licenseSuccess = "";
      this.genLoading = true;
      try {
        // Prefer RPC if available
        let codeRow = null;
        try {
          const { data, error } = await this.supabase.rpc("admin_generate_license");
          if (error) throw error;
          codeRow = data;
        } catch (_) {
          // Fallback: client-generate then insert
          const code = this._randCode(6);
          const { data, error } = await this.supabase
            .from("licenses")
            .insert([{ code, status: "valid" }])
            .select()
            .single();
          if (error) throw error;
          codeRow = data;
        }
        if (codeRow) {
          this.licenses.unshift(codeRow);
          this.licenseSuccess = `Lisensi ${codeRow.code} berhasil dibuat`;
        }
      } catch (e) {
        this.licenseError = e.message || "Gagal membuat lisensi";
      } finally {
        this.genLoading = false;
      }
    },
    async revokeLicense(lic) {
      this.licenseError = "";
      this.licenseSuccess = "";
      try {
        if (lic.status !== "valid") {
          this.licenseError = "Hanya lisensi 'valid' yang bisa di-revoke";
          return;
        }
        const { error } = await this.supabase
          .from("licenses")
          .update({ status: "revoked" })
          .eq("id", lic.id)
          .eq("status", "valid");
        if (error) throw error;
        const idx = this.licenses.findIndex((x) => x.id === lic.id);
        if (idx !== -1) this.licenses.splice(idx, 1, { ...this.licenses[idx], status: "revoked" });
        this.licenseSuccess = `Lisensi ${lic.code} telah di-revoke`;
      } catch (e) {
        this.licenseError = e.message || "Gagal revoke lisensi";
      }
    },
    _randCode(n) {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // tanpa 0/O/1/I
      let out = "";
      for (let i = 0; i < n; i++) out += chars[Math.floor(Math.random() * chars.length)];
      return out;
    },
  },
  template: `
    <div class="admin-page container-fluid fade-in">
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status"></div>
        <div class="mt-2">Memuat...</div>
      </div>

      <div v-else>
        <div class="d-flex justify-content-between align-items-center my-3">
          <h4 class="mb-0">Admin Dashboard</h4>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-secondary btn-sm" @click="loadProfiles">Reload Users</button>
            <button class="btn btn-primary btn-sm" :disabled="!hasChanges || saving" @click="saveChanges">
              <span v-if="!saving">Save Changes ({{ changedRows.length }})</span>
              <span v-else>Menyimpan...</span>
            </button>
          </div>
        </div>

        <div v-if="errorMsg" class="alert alert-danger">{{ errorMsg }}</div>
        <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

        <!-- Users Management -->
        <div class="card mb-4">
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-striped align-middle">
                <thead>
                  <tr>
                    <th scope="col">Email</th>
                    <th scope="col" style="width: 180px;">Role</th>
                    <th scope="col" style="width: 100px;">Aktif</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="u in users" :key="u.id">
                    <td>{{ u.email }}</td>
                    <td>
                      <select class="form-select form-select-sm" v-model="u.role">
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>
                      <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" v-model="u.is_active">
                      </div>
                    </td>
                  </tr>
                  <tr v-if="users.length===0">
                    <td colspan="3" class="text-center text-muted">Tidak ada data.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- License Management -->
        <div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="mb-0">Manajemen Lisensi</h5>
              <div class="d-flex gap-2">
                <select class="form-select form-select-sm" v-model="licenseFilter" style="width: 180px">
                  <option value="all">Semua</option>
                  <option value="valid">Valid</option>
                  <option value="used">Used</option>
                  <option value="revoked">Revoked</option>
                  <option value="expired">Expired</option>
                </select>
                <button class="btn btn-success btn-sm" :disabled="genLoading" @click="generateLicense">
                  <span v-if="!genLoading">Generate Lisensi</span>
                  <span v-else>Memproses...</span>
                </button>
              </div>
            </div>

            <div v-if="licenseError" class="alert alert-danger">{{ licenseError }}</div>
            <div v-if="licenseSuccess" class="alert alert-success">{{ licenseSuccess }}</div>

            <div class="table-responsive" style="max-height: 50vh; overflow: auto">
              <table class="table table-striped align-middle">
                <thead class="table ">
                  <tr>
                    <th scope="col" style="width: 160px">License Code</th>
                    <th scope="col" style="width: 110px">Status</th>
                    <th scope="col">Assigned Email</th>
                    <th scope="col" style="width: 180px">Created At</th>
                    <th scope="col" style="width: 180px">Used At</th>
                    <th scope="col" style="width: 110px">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="licenseLoading">
                    <td colspan="6" class="text-center">
                      <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                      Memuat lisensi...
                    </td>
                  </tr>
                  <tr v-for="lic in licenses" :key="lic.id">
                    <td><code>{{ lic.code }}</code></td>
                    <td>
                      <span class="badge"
                        :class="{
                          'bg-success-subtle text-success': lic.status==='valid',
                          'bg-secondary-subtle text-secondary': lic.status==='used',
                          'bg-danger-subtle text-danger': lic.status==='revoked',
                          'bg-warning-subtle text-warning': lic.status==='expired'
                        }">
                        {{ lic.status }}
                      </span>
                    </td>
                    <td class="text-muted">{{ lic.assigned_email || '-' }}</td>
                    <td class="text-muted">{{ new Date(lic.created_at).toLocaleString() }}</td>
                    <td class="text-muted">{{ lic.used_at ? new Date(lic.used_at).toLocaleString() : '-' }}</td>
                    <td>
                      <button class="btn btn-outline-danger btn-sm"
                        :disabled="lic.status !== 'valid'"
                        @click="revokeLicense(lic)">
                        Revoke
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!licenseLoading && licenses.length === 0">
                    <td colspan="6" class="text-center text-muted">Tidak ada data lisensi.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="small text-muted mt-2">Hanya admin yang dapat mengelola lisensi.</div>
          </div>
        </div>
      </div>
    </div>
  `,
});
