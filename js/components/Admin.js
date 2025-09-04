Vue.component("admin", {
  props: ["user", "supabase"],
  data() {
    return {
      loading: true,
      saving: false,
      users: [],
      errorMsg: "",
      successMsg: "",
      originals: {},
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
  async mounted() {
    try {
      await this.loadProfiles();
    } finally {
      this.loading = false;
    }
  },
  methods: {
    async loadProfiles() {
      this.errorMsg = "";
      const { data, error } = await this.supabase
        .from("profiles")
        // include full_name if available; keep email for fallback
        .select("id, email, role, is_active, full_name")
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
            <button class="btn btn-outline-secondary btn-sm" @click="loadProfiles">Reload</button>
            <button class="btn btn-primary btn-sm" :disabled="!hasChanges || saving" @click="saveChanges">
              <span v-if="!saving">Save Changes ({{ changedRows.length }})</span>
              <span v-else>Menyimpan...</span>
            </button>
          </div>
        </div>

        <div v-if="errorMsg" class="alert alert-danger">{{ errorMsg }}</div>
        <div v-if="successMsg" class="alert alert-success">{{ successMsg }}</div>

        <div class="card">
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-striped align-middle">
                <thead>
                  <tr>
                    <th scope="col">Nama</th>
                    <th scope="col">Email</th>
                    <th scope="col" style="width: 180px;">Role</th>
                    <th scope="col" style="width: 100px;">Aktif</th>
                  </tr>
                </thead>
                <tbody>
          <tr v-for="u in users" :key="u.id">
            <td class="fw-semibold">{{ u.full_name ? u.full_name : (u.email ? u.email.split('@')[0] : u.email) }}</td>
            <td class="text-muted small">{{ u.email }}</td>
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
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
});
