<template>
  <div class="admin-page fade-in">
    <div class="d-flex justify-content-between align-items-center mt-3 mb-3">
      <h4>👑 Panel Admin</h4>
      <div class="badge bg-danger">Admin Access</div>
    </div>

    <!-- Stats Overview -->
    <div class="row mb-4">
      <div class="col-6 col-md-3 mb-3">
        <div class="card dashboard-card card-accent card-accent--primary text-center">
          <div class="card-body py-3">
            <div class="h4 text-primary">{{ adminStats.totalUsers }}</div>
            <small class="text-muted">Total Users</small>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3 mb-3">
        <div class="card dashboard-card card-accent card-accent--success text-center">
          <div class="card-body py-3">
            <div class="h4 text-success">{{ adminStats.activeUsers }}</div>
            <small class="text-muted">Active Users</small>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3 mb-3">
        <div class="card dashboard-card card-accent card-accent--warning text-center">
          <div class="card-body py-3">
            <div class="h4 text-warning">{{ adminStats.totalTasks }}</div>
            <small class="text-muted">Total Tasks</small>
          </div>
        </div>
      </div>
      <div class="col-6 col-md-3 mb-3">
        <div class="card dashboard-card card-accent card-accent--violet text-center">
          <div class="card-body py-3">
            <div class="h4 text-info">{{ adminStats.totalLicenses }}</div>
            <small class="text-muted">Licenses</small>
          </div>
        </div>
      </div>
    </div>

    <!-- User Management & License Management -->
    <div class="row">
      <div class="col-12 mb-4">
        <div class="card dashboard-card card-accent card-accent--primary">
          <div class="card-header bg-whiter d-flex justify-content-between align-items-center">
            <h5 class="mb-0">👥 Manajemen Pengguna</h5>
            <button class="btn btn-sm btn-outline-primary" @click="loadUsers">🔄 Refresh</button>
          </div>
          <div class="card-body">
            <div v-if="loading" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th style="min-width: 200px">Email</th>
                    <th style="min-width: 150px">Nama</th>
                    <th style="min-width: 80px">Role</th>
                    <th style="min-width: 120px">Bergabung</th>
                    <th style="min-width: 80px">Status</th>
                    <th style="min-width: 100px">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in users" :key="user.id">
                    <td>{{ user.email }}</td>
                    <td>{{ user.full_name || '-' }}</td>
                    <td>
                      <span
                        class="badge"
                        :class="user.role === 'admin' ? 'bg-danger' : 'bg-primary'"
                      >
                        {{ user.role || 'user' }}
                      </span>
                    </td>
                    <td>{{ formatDate(user.created_at) }}</td>
                    <td>
                      <span class="badge" :class="user.is_active ? 'bg-success' : 'bg-warning'">
                        {{ user.is_active ? 'Aktif' : 'Nonaktif' }}
                      </span>
                    </td>
                    <td>
                      <div class="btn-group btn-group-sm">
                        <button
                          class="btn btn-outline-warning"
                          @click="editUser(user)"
                          title="Edit Role"
                        >
                          ✏️
                        </button>
                        <button
                          class="btn btn-outline-danger"
                          @click="confirmDeleteUser(user)"
                          title="Hapus User"
                        >
                          🗑️
                        </button>
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

    <!-- License List (Full Width) -->
    <div class="row">
      <!-- License Generator & Management -->
      <div class="col-12 col-md-4 mb-4">
        <div class="card dashboard-card card-accent card-accent--success">
          <div class="card-header bg-whiter">
            <h5 class="mb-0">🎫 Generator Lisensi</h5>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label class="form-label">Jumlah Lisensi</label>
              <input
                type="number"
                class="form-control"
                v-model.number="licenseCount"
                min="1"
                max="100"
                placeholder="Masukkan jumlah lisensi"
              />
            </div>
            <button class="btn btn-success w-100" @click="generateLicenses" :disabled="generating">
              <i class="bi bi-plus-circle me-2"></i>
              {{ generating ? 'Generating...' : 'Generate Lisensi' }}
            </button>
          </div>
        </div>
      </div>
      <div class="col-12 col-md-8">
        <!-- License List -->
        <div class="card dashboard-card card-accent card-accent--warning">
          <div class="card-header bg-whiter d-flex justify-content-between align-items-center">
            <h5 class="mb-0">📜 Daftar Lisensi</h5>
            <button class="btn btn-sm btn-outline-warning" @click="loadRecentLicenses">
              🔄 Refresh
            </button>
          </div>
          <div class="card-body">
            <div v-if="recentLicenses.length === 0" class="text-center text-muted py-4">
              <i class="bi bi-inbox display-6 text-muted"></i>
              <p class="mt-2">Belum ada lisensi</p>
            </div>
            <div v-else class="table-responsive">
              <table class="table table-sm table-hover license-table">
                <thead class="table-light">
                  <tr>
                    <th style="min-width: 120px">Kode Lisensi</th>
                    <th style="min-width: 80px">Status</th>
                    <th style="min-width: 150px">Email Pengguna</th>
                    <th style="min-width: 120px">Tanggal Dibuat</th>
                    <th style="min-width: 120px">Digunakan</th>
                    <th style="min-width: 80px">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="license in recentLicenses" :key="license.id">
                    <td>
                      <code class="small">{{ license.code }}</code>
                    </td>
                    <td>
                      <span class="badge badge-sm" :class="getLicenseStatusClass(license.status)">
                        {{ getLicenseStatusText(license.status) }}
                      </span>
                    </td>
                    <td>
                      <span v-if="license.assigned_email" class="small">
                        {{ license.assigned_email }}
                      </span>
                      <span v-else class="text-muted small">-</span>
                    </td>
                    <td class="small">
                      {{ formatDate(license.created_at) }}
                    </td>
                    <td class="small">
                      <span v-if="license.used_at">
                        {{ formatDate(license.used_at) }}
                      </span>
                      <span v-else class="text-muted">-</span>
                    </td>
                    <td>
                      <div class="btn-group btn-group-sm">
                        <button
                          class="btn btn-outline-secondary btn-sm"
                          @click="copyLicense(license.code)"
                          title="Copy Kode"
                        >
                          📋
                        </button>
                        <button
                          class="btn btn-outline-danger btn-sm"
                          @click="revokeLicense(license)"
                          title="Revoke"
                          v-if="license.status === 'valid'"
                        >
                          🚫
                        </button>
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

    <!-- Edit User Modal -->
    <div class="modal fade" id="editUserModal" tabindex="-1" v-show="showEditModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">✏️ Edit User</h5>
            <button type="button" class="btn-close" @click="showEditModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" :value="editingUser?.email" readonly />
            </div>
            <div class="mb-3">
              <label class="form-label">Role</label>
              <select class="form-select" v-model="editingUserRole">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showEditModal = false">
              Batal
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="updateUserRole"
              :disabled="updating"
            >
              {{ updating ? 'Updating...' : 'Update' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="deleteUserModal" tabindex="-1" v-show="showDeleteModal">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">⚠️ Konfirmasi Hapus</h5>
            <button type="button" class="btn-close" @click="showDeleteModal = false"></button>
          </div>
          <div class="modal-body">
            <p>
              Apakah Anda yakin ingin menghapus user <strong>{{ deletingUser?.email }}</strong
              >?
            </p>
            <p class="text-danger">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="showDeleteModal = false">
              Batal
            </button>
            <button type="button" class="btn btn-danger" @click="deleteUser" :disabled="deleting">
              {{ deleting ? 'Menghapus...' : 'Hapus' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Admin',
  props: ['user', 'supabase'],
  data() {
    return {
      users: [],
      adminStats: {
        totalUsers: 0,
        activeUsers: 0,
        totalTasks: 0,
        totalLicenses: 0,
      },
      recentLicenses: [],
      loading: false,
      generating: false,
      updating: false,
      deleting: false,
      licenseCount: 1,
      showEditModal: false,
      showDeleteModal: false,
      editingUser: null,
      editingUserRole: 'user',
      deletingUser: null,
    };
  },
  async mounted() {
    await this.loadAdminData();
    this.setupModals();
  },
  beforeDestroy() {
    this.cleanupModals();
  },
  methods: {
    setupModals() {
      this.$nextTick(() => {
        if (window.bootstrap) {
          const editModalEl = document.getElementById('editUserModal');
          const deleteModalEl = document.getElementById('deleteUserModal');
          if (editModalEl) this.editModal = new window.bootstrap.Modal(editModalEl);
          if (deleteModalEl) this.deleteModal = new window.bootstrap.Modal(deleteModalEl);
        }
      });
    },
    cleanupModals() {
      if (this.editModal) {
        try {
          this.editModal.dispose();
        } catch (e) {}
      }
      if (this.deleteModal) {
        try {
          this.deleteModal.dispose();
        } catch (e) {}
      }
    },
    async loadAdminData() {
      await Promise.all([this.loadUsers(), this.loadAdminStats(), this.loadRecentLicenses()]);
    },
    async loadUsers() {
      try {
        this.loading = true;
        // Use the profiles table which contains the actual user data
        const { data, error } = await this.supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        this.users = data || [];
      } catch (error) {
        console.error('Error loading users:', error);
        this.$root?.showToast?.('Gagal memuat daftar user: ' + error.message, 'danger');
      } finally {
        this.loading = false;
      }
    },
    async loadAdminStats() {
      try {
        const { data: users } = await this.supabase
          .from('profiles')
          .select('id, created_at, is_active');
        const { data: tasks } = await this.supabase.from('daily_tasks_instance').select('id');
        const { data: licenses } = await this.supabase.from('licenses').select('id');

        this.adminStats = {
          totalUsers: (users || []).length,
          activeUsers: (users || []).filter((u) => u.is_active).length,
          totalTasks: (tasks || []).length,
          totalLicenses: (licenses || []).length,
        };
      } catch (error) {
        console.error('Error loading admin stats:', error);
      }
    },
    async loadRecentLicenses() {
      try {
        const { data, error } = await this.supabase
          .from('licenses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20); // Show more licenses
        if (error) throw error;
        this.recentLicenses = data || [];
      } catch (error) {
        console.error('Error loading recent licenses:', error);
      }
    },
    async generateLicenses() {
      try {
        this.generating = true;

        // Generate multiple licenses by calling the RPC function multiple times
        const promises = [];
        for (let i = 0; i < this.licenseCount; i++) {
          promises.push(this.supabase.rpc('admin_generate_license'));
        }

        const results = await Promise.all(promises);
        const errors = results.filter((result) => result.error);

        if (errors.length > 0) {
          throw errors[0].error;
        }

        await this.loadRecentLicenses();
        await this.loadAdminStats();

        this.$root?.showToast?.(`Berhasil generate ${this.licenseCount} lisensi`, 'success');
      } catch (error) {
        console.error('Error generating licenses:', error);
        this.$root?.showToast?.('Gagal generate lisensi: ' + error.message, 'danger');
      } finally {
        this.generating = false;
      }
    },
    editUser(user) {
      this.editingUser = user;
      this.editingUserRole = user.role || 'user';
      this.showEditModal = true;
    },
    async updateUserRole() {
      try {
        this.updating = true;
        const { error } = await this.supabase
          .from('profiles')
          .update({ role: this.editingUserRole })
          .eq('id', this.editingUser.id);

        if (error) throw error;

        await this.loadUsers();
        this.showEditModal = false;

        this.$root?.showToast?.('Role user berhasil diupdate', 'success');
      } catch (error) {
        console.error('Error updating user role:', error);
        this.$root?.showToast?.('Gagal update role user: ' + error.message, 'danger');
      } finally {
        this.updating = false;
      }
    },
    confirmDeleteUser(user) {
      this.deletingUser = user;
      this.showDeleteModal = true;
    },
    async deleteUser() {
      try {
        this.deleting = true;

        // Delete user data first (using user_id from the profiles table)
        await this.supabase
          .from('daily_tasks_instance')
          .delete()
          .eq('user_id', this.deletingUser.id);
        await this.supabase
          .from('daily_tasks_template')
          .delete()
          .eq('user_id', this.deletingUser.id);
        await this.supabase.from('score_log').delete().eq('user_id', this.deletingUser.id);

        // Delete profile record (this will cascade to auth.users due to foreign key)
        const { error } = await this.supabase
          .from('profiles')
          .delete()
          .eq('id', this.deletingUser.id);

        if (error) throw error;

        await this.loadUsers();
        await this.loadAdminStats();
        this.showDeleteModal = false;

        this.$root?.showToast?.('User berhasil dihapus', 'success');
      } catch (error) {
        console.error('Error deleting user:', error);
        this.$root?.showToast?.('Gagal menghapus user: ' + error.message, 'danger');
      } finally {
        this.deleting = false;
      }
    },
    copyLicense(code) {
      navigator.clipboard
        .writeText(code)
        .then(() => {
          this.$root?.showToast?.('Kode lisensi berhasil dicopy', 'success');
        })
        .catch(() => {
          this.$root?.showToast?.('Gagal copy kode lisensi', 'danger');
        });
    },
    async revokeLicense(license) {
      if (!confirm(`Yakin ingin merevoke lisensi ${license.code}?`)) return;

      try {
        const { error } = await this.supabase
          .from('licenses')
          .update({ status: 'revoked' })
          .eq('id', license.id);

        if (error) throw error;

        await this.loadRecentLicenses();
        this.$root?.showToast?.('Lisensi berhasil direvoke', 'success');
      } catch (error) {
        console.error('Error revoking license:', error);
        this.$root?.showToast?.('Gagal revoke lisensi: ' + error.message, 'danger');
      }
    },
    getLicenseStatusClass(status) {
      const classes = {
        valid: 'bg-success',
        used: 'bg-primary',
        revoked: 'bg-danger',
        expired: 'bg-warning text-dark',
      };
      return classes[status] || 'bg-secondary';
    },
    getLicenseStatusText(status) {
      const texts = {
        valid: 'Valid',
        used: 'Digunakan',
        revoked: 'Direvoke',
        expired: 'Expired',
      };
      return texts[status] || status;
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },
    formatDateTime(dateString) {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    },
  },
  watch: {
    showEditModal(show) {
      if (this.editModal) {
        if (show) {
          this.editModal.show();
        } else {
          this.editModal.hide();
        }
      }
    },
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
};
</script>

<style scoped>
/* Responsive table improvements */
.table-responsive {
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.125);
}

/* Ensure horizontal scroll on mobile */
@media (max-width: 768px) {
  .table-responsive {
    display: block;
    width: 100%;
    overflow-x: auto;
    white-space: nowrap;
    -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
  }

  .table {
    min-width: 700px; /* Ensure table doesn't get too compressed */
  }

  .table th,
  .table td {
    padding: 0.5rem 0.3rem;
    font-size: 0.875rem;
    white-space: nowrap;
  }

  /* Stack license table cells better on mobile */
  .license-table {
    min-width: 800px;
  }
}

/* License status badges */
.badge-sm {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

/* Card improvements */
.dashboard-card {
  border: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.dashboard-card .card-header {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 1px solid rgba(0, 0, 0, 0.125);
  font-weight: 600;
}

/* Button improvements */
.btn-group-sm .btn {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

/* Stats cards hover effect */
.dashboard-card:hover {
  transform: translateY(-2px);
  transition: all 0.3s ease;
}

/* License code styling */
code {
  background-color: #f8f9fa;
  color: #e83e8c;
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.85em;
}

/* Empty state styling */
.display-6 {
  font-size: 3rem;
  opacity: 0.3;
}
</style>
