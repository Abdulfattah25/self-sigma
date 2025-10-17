<template>
  <div class="fade-in">
    <div class="d-flex justify-content-between align-items-center mb-3 mt-3">
      <h4>🎯 Task Manager</h4>
      <button class="btn btn-primary btn-icon" @click="openAddModal">
        <i class="bi bi-plus-lg"></i>
        Tambah
      </button>
    </div>

    <!-- Statistics Cards -->
    <div class="row my-3">
      <div class="col-md-6 mb-4">
        <div class="card checklist-card card-accent card-accent--primary stats-card">
          <div class="card-body text-center position-relative">
            <div v-if="dailyHighPriority > 0" class="position-absolute top-0 end-0 mt-2 me-2">
              <span class="badge bg-danger badge-sm">{{ dailyHighPriority }} urgent</span>
            </div>
            <div class="d-flex align-items-center justify-content-center mb-2">
              <span class="me-2" style="font-size: 1.25rem">📝</span>
              <h5 class="card-title mb-0">Task Harian</h5>
            </div>
            <div class="display-6 mb-2 text-primary stats-number" v-if="!loading">
              {{ dailyTemplates.length }}
            </div>
            <div class="display-6 mb-2 text-muted" v-else>
              <i class="spinner-border spinner-border-sm"></i>
            </div>
            <p class="text-muted stats-description">
              {{ loading ? 'Memuat...' : dailyTaskMessage }}
            </p>
          </div>
        </div>
      </div>
      <div class="col-md-6 mb-2">
        <div class="card checklist-card card-accent card-accent--cyan stats-card">
          <div class="card-body text-center position-relative">
            <div v-if="deadlineHighPriority > 0" class="position-absolute top-0 end-0 mt-2 me-2">
              <span class="badge bg-danger badge-sm">{{ deadlineHighPriority }} urgent</span>
            </div>
            <div class="d-flex align-items-center justify-content-center mb-2">
              <span class="me-2" style="font-size: 1.25rem">🗓️</span>
              <h5 class="card-title mb-0">Task Deadline</h5>
            </div>
            <div class="display-6 mb-2 text-info stats-number" v-if="!loading">
              {{ deadlineTemplates.length }}
            </div>
            <div class="display-6 mb-2 text-muted" v-else>
              <i class="spinner-border spinner-border-sm"></i>
            </div>
            <p class="text-muted stats-description">
              {{ loading ? 'Memuat...' : deadlineTaskMessage }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="row mb-3">
      <div class="col-md-6 mb-4">
        <div class="card dashboard-card card-accent card-accent--primary h-100">
          <div class="card-header">
            <h5 class="mb-0">📝 Template Task Harian</h5>
            <small class="text-muted"
              >Template ini akan otomatis muncul di checklist setiap hari</small
            >
          </div>
          <div class="card-body">
            <div v-if="dailyTemplates.length === 0" class="text-center text-muted py-4">
              <p>Tidak ada template harian.</p>
            </div>
            <div v-else>
              <div class="row templates-grid">
                <div v-for="template in dailyTemplates" :key="template.id" class="col-md-12 mb-3">
                  <div class="card h-100" :class="'priority-' + template.priority">
                    <div class="card-body">
                      <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                          <h6 class="card-title mb-1">{{ template.task_name }}</h6>
                          <div class="mb-2">
                            <span
                              class="badge badge-sm me-2"
                              :class="getPriorityBadgeClass(template.priority)"
                              >{{ template.priority.toUpperCase() }}</span
                            >
                            <span
                              v-if="template.category"
                              class="badge bg-light text-dark badge-sm"
                              >{{ template.category }}</span
                            >
                          </div>
                          <small class="text-muted"
                            >Dibuat: {{ formatDate(template.created_at) }}</small
                          >
                        </div>
                        <div class="dropdown">
                          <button
                            class="btn btn-sm btn-outline-secondary dropdown-toggle"
                            type="button"
                            :id="'dropdown-daily-' + template.id"
                            data-bs-toggle="dropdown"
                            data-bs-auto-close="true"
                            data-bs-boundary="viewport"
                          >
                            ⋮
                          </button>
                          <ul
                            class="dropdown-menu dropdown-menu-responsive"
                            :aria-labelledby="'dropdown-daily-' + template.id"
                          >
                            <li>
                              <a
                                class="dropdown-item text-primary"
                                href="#"
                                @click.prevent="openEditModal(template)"
                                >✏️ Edit</a
                              >
                            </li>
                            <li>
                              <a
                                class="dropdown-item text-danger"
                                href="#"
                                @click.prevent="openDeleteConfirm(template)"
                                >🗑️ Hapus</a
                              >
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6 mb-4">
        <div class="card dashboard-card card-accent card-accent--info h-100">
          <div class="card-header">
            <h5 class="mb-0">🗓️ Template Task Deadline</h5>
            <small class="text-muted">Task sekali pakai berdasarkan tanggal deadline</small>
          </div>
          <div class="card-body">
            <div v-if="deadlineTemplates.length === 0" class="text-center text-muted py-4">
              <p>Tidak ada template deadline.</p>
            </div>
            <div v-else>
              <div class="row templates-grid">
                <div
                  v-for="template in deadlineTemplates"
                  :key="template.id"
                  class="col-md-12 mb-3"
                >
                  <div class="card h-100" :class="'priority-' + template.priority">
                    <div class="card-body">
                      <div class="d-flex justify-content-between align-items-start">
                        <div class="flex-grow-1">
                          <h6 class="card-title mb-1">{{ template.task_name }}</h6>
                          <div class="mb-2">
                            <span
                              class="badge badge-sm me-2"
                              :class="getPriorityBadgeClass(template.priority)"
                              >{{ template.priority.toUpperCase() }}</span
                            >
                            <span
                              v-if="template.category"
                              class="badge bg-light text-dark badge-sm"
                              >{{ template.category }}</span
                            >
                          </div>
                          <small class="text-muted"
                            >Deadline:
                            {{
                              template.deadline_date
                                ? new Date(template.deadline_date).toLocaleDateString('id-ID')
                                : '-'
                            }}</small
                          >
                        </div>
                        <div class="dropdown">
                          <button
                            class="btn btn-sm btn-outline-secondary dropdown-toggle"
                            type="button"
                            :id="'dropdown-' + template.id"
                            data-bs-toggle="dropdown"
                            data-bs-display="static"
                            data-bs-boundary="viewport"
                          >
                            ⋮
                          </button>
                          <ul
                            class="dropdown-menu dropdown-menu-end"
                            :aria-labelledby="'dropdown-' + template.id"
                          >
                            <li>
                              <a
                                class="dropdown-item text-primary"
                                href="#"
                                @click.prevent="openEditModal(template)"
                                >✏️ Edit</a
                              >
                            </li>
                            <li>
                              <a
                                class="dropdown-item text-danger"
                                href="#"
                                @click.prevent="openDeleteConfirm(template)"
                                >🗑️ Hapus</a
                              >
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade task-modal" tabindex="-1" ref="taskModal" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ editingId ? 'Edit Template Task' : 'Tambah Template Task Baru' }}
            </h5>
            <button type="button" class="btn-close" @click="cancelAdd"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="saveTaskTemplate">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label">Nama Task</label>
                  <input
                    type="text"
                    class="form-control"
                    v-model.trim="newTask.task_name"
                    placeholder="Contoh: Olahraga pagi"
                    required
                  />
                </div>
                <div class="col-md-3 mb-3">
                  <label class="form-label">Prioritas</label>
                  <select class="form-select" v-model="newTask.priority">
                    <option value="rendah">Rendah</option>
                    <option value="sedang">Sedang</option>
                    <option value="tinggi">Tinggi</option>
                  </select>
                </div>
                <div class="col-md-3 mb-3">
                  <label class="form-label">Kategori (Opsional)</label>
                  <input
                    type="text"
                    class="form-control"
                    v-model.trim="newTask.category"
                    placeholder="Contoh: Kesehatan"
                  />
                </div>
              </div>
              <div class="row">
                <div class="col-md-4 mb-3">
                  <label class="form-label">Jenis Task</label>
                  <select class="form-select" v-model="newTask.jenis_task">
                    <option value="harian">Harian (kegiatan rutin)</option>
                    <option value="deadline">Deadline (berlaku sekali pada tanggal)</option>
                  </select>
                </div>
                <div class="col-md-4 mb-3" v-if="newTask.jenis_task === 'deadline'">
                  <label class="form-label">Tanggal Deadline</label>
                  <input type="date" class="form-control" v-model="newTask.deadline_date" />
                </div>
              </div>
              <div class="d-flex gap-2">
                <button type="submit" class="btn btn-success">
                  {{ editingId ? 'Simpan Perubahan' : 'Simpan Template' }}
                </button>
                <button type="button" class="btn btn-secondary" @click="cancelAdd">Batal</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div class="modal fade" tabindex="-1" ref="confirmModal" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Konfirmasi Hapus</h5>
            <button type="button" class="btn-close" @click="closeConfirm"></button>
          </div>
          <div class="modal-body">
            <p>
              Yakin ingin menghapus template "<strong>{{
                pendingDelete ? pendingDelete.task_name : ''
              }}</strong
              >"?
            </p>
            <p class="text-muted mb-0">Task yang sudah ada di checklist tidak akan terhapus.</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeConfirm">Batal</button>
            <button type="button" class="btn btn-danger" @click="confirmDelete">Hapus</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TaskManager',
  props: ['user', 'supabase'],
  data() {
    return {
      templates: [],
      newTask: {
        task_name: '',
        priority: 'sedang',
        category: '',
        jenis_task: 'harian',
        deadline_date: null,
      },
      loading: false,
      editingId: null,
      modalMode: 'add',
      pendingDelete: null,
      // subscribe handle
      _unsubTemplates: null,
    };
  },
  computed: {
    sortedTemplates() {
      const order = { tinggi: 3, sedang: 2, rendah: 1 };
      return [...(this.templates || [])].sort((a, b) => {
        const ap = order[a?.priority] ?? 2;
        const bp = order[b?.priority] ?? 2;
        if (bp !== ap) return bp - ap;
        const at = new Date(a?.created_at || 0).getTime();
        const bt = new Date(b?.created_at || 0).getTime();
        return bt - at;
      });
    },
    dailyTemplates() {
      return (this.sortedTemplates || []).filter((t) => (t.jenis_task || 'harian') === 'harian');
    },
    deadlineTemplates() {
      return (this.sortedTemplates || []).filter((t) => (t.jenis_task || 'harian') === 'deadline');
    },
    dailyTaskMessage() {
      const count = this.dailyTemplates.length;
      if (count === 0) return 'Belum ada template harian';

      const priorities = { tinggi: 0, sedang: 0, rendah: 0 };
      this.dailyTemplates.forEach((t) => {
        priorities[t.priority] = (priorities[t.priority] || 0) + 1;
      });

      const breakdown = [];
      if (priorities.tinggi > 0) breakdown.push(`${priorities.tinggi} tinggi`);
      if (priorities.sedang > 0) breakdown.push(`${priorities.sedang} sedang`);
      if (priorities.rendah > 0) breakdown.push(`${priorities.rendah} rendah`);

      return `${count} template aktif (${breakdown.join(', ')})`;
    },
    deadlineTaskMessage() {
      const count = this.deadlineTemplates.length;
      if (count === 0) return 'Belum ada template deadline';

      const priorities = { tinggi: 0, sedang: 0, rendah: 0 };
      this.deadlineTemplates.forEach((t) => {
        priorities[t.priority] = (priorities[t.priority] || 0) + 1;
      });

      const breakdown = [];
      if (priorities.tinggi > 0) breakdown.push(`${priorities.tinggi} tinggi`);
      if (priorities.sedang > 0) breakdown.push(`${priorities.sedang} sedang`);
      if (priorities.rendah > 0) breakdown.push(`${priorities.rendah} rendah`);

      return `${count} template dengan deadline (${breakdown.join(', ')})`;
    },
    dailyHighPriority() {
      return this.dailyTemplates.filter((t) => t.priority === 'tinggi').length;
    },
    deadlineHighPriority() {
      return this.deadlineTemplates.filter((t) => t.priority === 'tinggi').length;
    },
  },
  async mounted() {
    try {
      await this.cleanPastDeadlines();
    } catch (_) {}
    await this.loadTemplates();

    // Subscribe to cache updates for templates
    try {
      if (window.stateManager && typeof window.stateManager.subscribe === 'function') {
        this._unsubTemplates = window.stateManager.subscribe('templates', (list) => {
          if (Array.isArray(list)) this.templates = list;
        });
      }
    } catch (_) {}

    try {
      document.addEventListener('show.bs.dropdown', this.handleDropdownShow, true);
      document.addEventListener('hide.bs.dropdown', this.handleDropdownHide, true);
    } catch (_) {}
  },
  destroyed() {
    try {
      document.removeEventListener('show.bs.dropdown', this.handleDropdownShow, true);
      document.removeEventListener('hide.bs.dropdown', this.handleDropdownHide, true);
    } catch (_) {}
    try {
      if (typeof this._unsubTemplates === 'function') this._unsubTemplates();
    } catch (_) {}
  },
  methods: {
    async loadTemplates() {
      try {
        this.loading = true;

        if (window.dataService) {
          const result = await window.dataService.getTemplates(this.user.id);
          this.templates = result.data || [];
        } else {
          const { data, error } = await this.supabase
            .from('daily_tasks_template')
            .select('*')
            .eq('user_id', this.user.id)
            .order('created_at', { ascending: false });
          if (error) throw error;
          this.templates = data || [];
        }

        // ✅ FIX: Sync cache after loading
        this.syncTemplatesCache();
      } catch (error) {
        console.error('Error loading templates:', error);
        this.$root &&
          this.$root.showToast &&
          this.$root.showToast('Gagal memuat template: ' + error.message, 'danger');
      } finally {
        this.loading = false;
      }
    },
    async ensureTodayInstanceForTemplate(template) {
      const jenis = template?.jenis_task || 'harian';
      const today =
        window.WITA && window.WITA.today
          ? window.WITA.today()
          : new Date().toISOString().slice(0, 10);

      // Buat instance hanya untuk:
      // - harian: selalu untuk hari ini
      // - deadline: hanya jika deadline_date === today
      if (jenis === 'deadline' && template?.deadline_date !== today) return;

      try {
        // Langsung coba insert (1 round-trip), abaikan duplikasi
        const { error: iErr } = await this.supabase.from('daily_tasks_instance').insert([
          {
            user_id: this.user.id,
            task_id: template.id,
            task_name: template.task_name,
            priority: template.priority,
            category: template.category,
            jenis_task: jenis,
            deadline_date: template.deadline_date || null,
            date: today,
            is_completed: false,
          },
        ]);
        if (iErr && iErr.code !== '23505') throw iErr;
      } catch (e) {
        // Jika gagal selain duplikasi, log saja
        if (!e?.code || e.code !== '23505') console.warn('ensureTodayInstance failed:', e);
      }

      // Refresh cache di background agar UI lain update tanpa blokir
      try {
        if (window.dataService) {
          window.dataService.getTodayTasks(this.user.id, today, true).catch(() => {});
        } else if (window.stateManager) {
          window.stateManager.invalidateCache('todayTasks');
        }
      } catch (_) {}
    },
    openAddModal() {
      this.editingId = null;
      this.modalMode = 'add';
      this.newTask = {
        task_name: '',
        priority: 'sedang',
        category: '',
        jenis_task: 'harian',
        deadline_date: null,
      };
      try {
        const el = this.$refs.taskModal;
        const instance =
          (window.bootstrap && window.bootstrap.Modal.getInstance(el)) ||
          new window.bootstrap.Modal(el);
        instance.show();
      } catch (_) {}
    },
    openEditModal(template) {
      this.editingId = template.id;
      this.modalMode = 'edit';
      this.newTask = {
        task_name: template.task_name,
        priority: template.priority,
        category: template.category || '',
        jenis_task: template.jenis_task || 'harian',
        deadline_date: template.deadline_date || null,
      };
      try {
        const el = this.$refs.taskModal;
        const instance =
          (window.bootstrap && window.bootstrap.Modal.getInstance(el)) ||
          new window.bootstrap.Modal(el);
        instance.show();
      } catch (_) {}
    },
    cancelAdd() {
      try {
        const el = this.$refs.taskModal;
        if (el) {
          const instance =
            (window.bootstrap && window.bootstrap.Modal.getInstance(el)) ||
            new window.bootstrap.Modal(el);
          instance.hide();
        }
      } catch (_) {}
      this.newTask = {
        task_name: '',
        priority: 'sedang',
        category: '',
        jenis_task: 'harian',
        deadline_date: null,
      };
      this.editingId = null;
      this.modalMode = 'add';
    },
    async saveTaskTemplate() {
      const name = (this.newTask.task_name || '').trim();
      if (name.length < 3) {
        this.$root &&
          this.$root.showToast &&
          this.$root.showToast('Nama task minimal 3 karakter', 'warning');
        return;
      }
      if (!['tinggi', 'sedang', 'rendah'].includes(this.newTask.priority)) {
        this.newTask.priority = 'sedang';
      }
      try {
        this.loading = true;
        if (this.editingId) {
          const { data, error } = await this.supabase
            .from('daily_tasks_template')
            .update({
              task_name: name,
              priority: this.newTask.priority,
              category: this.newTask.category || null,
              jenis_task: this.newTask.jenis_task || 'harian',
              deadline_date:
                this.newTask.jenis_task === 'deadline' ? this.newTask.deadline_date : null,
            })
            .eq('id', this.editingId)
            .eq('user_id', this.user.id)
            .select();
          if (error) throw error;
          const updated = data && data[0];
          if (updated) {
            // ✅ FIX: Update local state immediately
            const idx = this.templates.findIndex((t) => t.id === this.editingId);
            if (idx !== -1) this.$set(this.templates, idx, updated);

            // ✅ FIX: Update cache to sync with other components
            if (window.stateManager) {
              window.stateManager.updateCacheItem('templates', this.editingId, updated);
            }
            // ✅ FIX: Update instance di background tanpa blocking UI
            const today =
              window.WITA && window.WITA.today
                ? window.WITA.today()
                : new Date().toISOString().slice(0, 10);

            // Non-blocking background update
            this.supabase
              .from('daily_tasks_instance')
              .update({
                task_name: updated.task_name,
                priority: updated.priority || 'sedang',
                category: updated.category || null,
                jenis_task: updated.jenis_task || 'harian',
                deadline_date: updated.deadline_date || null,
              })
              .eq('user_id', this.user.id)
              .eq('task_id', updated.id)
              .eq('date', today)
              .then(() => {
                // Refresh todayTasks setelah update instance
                if (window.dataService) {
                  window.dataService.getTodayTasks(this.user.id, today, true).catch(() => {});
                }
              })
              .catch((e) => {
                console.warn('Gagal mensinkronkan instance hari ini:', e.message);
              });
            try {
              window.dispatchEvent(
                new CustomEvent('template-updated', { detail: { template: updated } }),
              );
            } catch (_) {}
          }
          this.$root &&
            this.$root.showToast &&
            this.$root.showToast('Template berhasil diperbarui!', 'success');
        } else {
          if (this.newTask.jenis_task === 'deadline' && !this.newTask.deadline_date) {
            this.$root &&
              this.$root.showToast &&
              this.$root.showToast(
                "Tanggal deadline wajib diisi untuk jenis 'deadline'",
                'warning',
              );
            this.loading = false;
            return;
          }
          const { data, error } = await this.supabase
            .from('daily_tasks_template')
            .insert([
              {
                user_id: this.user.id,
                task_name: name,
                priority: this.newTask.priority,
                category: this.newTask.category || null,
                jenis_task: this.newTask.jenis_task || 'harian',
                deadline_date:
                  this.newTask.jenis_task === 'deadline' ? this.newTask.deadline_date : null,
              },
            ])
            .select();
          if (error) throw error;

          // ✅ FIX: Update local state immediately
          this.templates.unshift(data[0]);

          // ✅ FIX: Update cache to sync with other components
          if (window.stateManager) {
            window.stateManager.addCacheItem('templates', data[0]);
          }

          try {
            // Jalankan non-blocking agar modal cepat tertutup
            this.ensureTodayInstanceForTemplate(data[0]).catch(() => {});
          } catch (e) {
            console.warn('Gagal membuat instance hari ini untuk template baru:', e.message);
          }
          try {
            window.dispatchEvent(
              new CustomEvent('template-updated', { detail: { template: updated } }),
            );
            // ✅ Emit for Profile stats update
            window.dispatchEvent(new Event('task-added'));
          } catch (_) {}
          this.$root &&
            this.$root.showToast &&
            this.$root.showToast('Template task berhasil ditambahkan!', 'success');
        }
        this.cancelAdd();
      } catch (error) {
        console.error('Error saving template:', error);
        this.$root &&
          this.$root.showToast &&
          this.$root.showToast('Gagal menyimpan template: ' + error.message, 'danger');
      } finally {
        this.loading = false;
      }
    },
    openDeleteConfirm(template) {
      this.pendingDelete = { id: template.id, task_name: template.task_name };
      try {
        const el = this.$refs.confirmModal;
        const instance =
          (window.bootstrap && window.bootstrap.Modal.getInstance(el)) ||
          new window.bootstrap.Modal(el);
        instance.show();
      } catch (_) {}
    },
    closeConfirm() {
      try {
        const el = this.$refs.confirmModal;
        if (el) {
          const instance =
            (window.bootstrap && window.bootstrap.Modal.getInstance(el)) ||
            new window.bootstrap.Modal(el);
          instance.hide();
        }
      } catch (_) {}
      this.pendingDelete = null;
    },
    async confirmDelete() {
      if (!this.pendingDelete) return;
      const id = this.pendingDelete.id;
      try {
        const { error } = await this.supabase
          .from('daily_tasks_template')
          .delete()
          .eq('id', id)
          .eq('user_id', this.user.id);
        if (error) throw error;

        // ✅ FIX: Update local state immediately
        this.templates = this.templates.filter((t) => t.id !== id);

        // ✅ FIX: Update cache to sync with other components
        if (window.stateManager) {
          window.stateManager.removeCacheItem('templates', id);
        }

        // ✅ FIX: Refresh via DataService if available
        if (window.dataService) {
          window.dataService.getTemplates(this.user.id, true).catch(() => {}); // Force refresh in background
        }

        // ✅ Emit for Profile stats update
        window.dispatchEvent(new Event('task-deleted'));

        if (this.editingId === id) this.cancelAdd();
        this.$root &&
          this.$root.showToast &&
          this.$root.showToast('Template berhasil dihapus!', 'success');
      } catch (error) {
        console.error('Error deleting template:', error);
        this.$root &&
          this.$root.showToast &&
          this.$root.showToast('Gagal menghapus template: ' + error.message, 'danger');
      } finally {
        this.closeConfirm();
      }
    },
    getPriorityBadgeClass(priority) {
      const classes = { tinggi: 'bg-danger', sedang: 'bg-warning text-dark', rendah: 'bg-success' };
      return classes[priority] || 'bg-secondary';
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },
    async addTaskTemplate() {
      return this.saveTaskTemplate();
    },
    handleDropdownShow(ev) {
      const dropdown = ev.target && ev.target.closest ? ev.target.closest('.dropdown') : null;
      if (!dropdown) return;
      const card = dropdown.closest('.card');
      if (card) card.classList.add('dropdown-open');
    },
    handleDropdownHide(ev) {
      const dropdown = ev.target && ev.target.closest ? ev.target.closest('.dropdown') : null;
      if (!dropdown) return;
      const card = dropdown.closest('.card');
      if (card) card.classList.remove('dropdown-open');
    },
    // Helper method to sync cache with local state
    syncTemplatesCache() {
      try {
        if (window.stateManager && Array.isArray(this.templates)) {
          window.stateManager.setCache('templates', this.templates);
        }
      } catch (error) {
        console.warn('Failed to sync templates cache:', error);
      }
    },

    // async cleanPastDeadlines() { /* same as legacy (optional cleanup) */ },
  },
};
</script>

<style scoped>
.stats-card {
  cursor: default;
  transition: all 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-3px) scale(1.02);
}

.stats-number {
  font-weight: 700;
  transition: all 0.3s ease;
}

.stats-card:hover .stats-number {
  transform: scale(1.1);
}

.stats-description {
  font-size: 0.875rem;
  line-height: 1.4;
  transition: color 0.3s ease;
}

.stats-card:hover .stats-description {
  color: var(--bs-dark) !important;
}

[data-bs-theme='dark'] .stats-card:hover .stats-description {
  color: var(--bs-light) !important;
}

.card-title {
  font-weight: 600;
  font-size: 1.1rem;
}
</style>
