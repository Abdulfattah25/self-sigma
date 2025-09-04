Vue.component("task-manager", {
  props: ["user", "supabase"],
  data() {
    return {
      templates: [],
      newTask: {
        task_name: "",
        priority: "sedang",
        category: "",
        jenis_task: "harian", // 'harian' | 'deadline'
        deadline_date: null, // YYYY-MM-DD when jenis_task === 'deadline'
      },
      loading: false,
      editingId: null,
      modalMode: "add", // 'add' | 'edit'
      pendingDelete: null, // { id, task_name }
    };
  },
  computed: {
    sortedTemplates() {
      const order = { tinggi: 3, sedang: 2, rendah: 1 };
      return [...(this.templates || [])].sort((a, b) => {
        const ap = order[a?.priority] ?? 2;
        const bp = order[b?.priority] ?? 2;
        if (bp !== ap) return bp - ap; // tinggi dulu
        // fallback: terbaru dulu jika sama prioritas
        const at = new Date(a?.created_at || 0).getTime();
        const bt = new Date(b?.created_at || 0).getTime();
        return bt - at;
      });
    },
    dailyTemplates() {
      return (this.sortedTemplates || []).filter((t) => (t.jenis_task || "harian") === "harian");
    },
    deadlineTemplates() {
      return (this.sortedTemplates || []).filter((t) => (t.jenis_task || "harian") === "deadline");
    },
  },
  template: `
        <div class="fade-in">
            <div class="d-flex justify-content-between align-items-center mb-3 mt-3">
                <h4>🎯 Task Manager</h4>
                <button class="btn btn-primary btn-icon" @click="openAddModal">
                    <i class="bi bi-plus-lg"></i>
                    Tambah
                </button>
            </div>

            <!-- Templates: Harian + Deadline -->
            <div class="row mb-3">
              <div class="col-md-6 mb-3">
                <div class="card dashboard-card card-accent card-accent--primary h-100">
                  <div class="card-header">
                    <h5 class="mb-0">📝 Template Task Harian</h5>
                    <small class="text-muted">Template ini akan otomatis muncul di checklist setiap hari</small>
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
                                    <span class="badge badge-sm me-2" :class="getPriorityBadgeClass(template.priority)">{{ template.priority.toUpperCase() }}</span>
                                    <span v-if="template.category" class="badge bg-light text-dark badge-sm">{{ template.category }}</span>
                                  </div>
                                  <small class="text-muted">Dibuat: {{ formatDate(template.created_at) }}</small>
                                </div>
                                <div class="dropdown">
                                  <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" :id="'dropdown-' + template.id" data-bs-toggle="dropdown" data-bs-display="static" data-bs-boundary="viewport">⋮</button>
                                  <ul class="dropdown-menu dropdown-menu-end" :aria-labelledby="'dropdown-' + template.id">
                                    <li><a class="dropdown-item text-primary" href="#" @click.prevent="openEditModal(template)">✏️ Edit</a></li>
                                    <li><a class="dropdown-item text-danger" href="#" @click.prevent="openDeleteConfirm(template)">🗑️ Hapus</a></li>
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
              <div class="col-md-6 mb-3">
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
                        <div v-for="template in deadlineTemplates" :key="template.id" class="col-md-12 mb-3">
                          <div class="card h-100" :class="'priority-' + template.priority">
                            <div class="card-body">
                              <div class="d-flex justify-content-between align-items-start">
                                <div class="flex-grow-1">
                                  <h6 class="card-title mb-1">{{ template.task_name }}</h6>
                                  <div class="mb-2">
                                    <span class="badge badge-sm me-2" :class="getPriorityBadgeClass(template.priority)">{{ template.priority.toUpperCase() }}</span>
                                    <span v-if="template.category" class="badge bg-light text-dark badge-sm">{{ template.category }}</span>
                                  </div>
                                  <small class="text-muted">Deadline: {{ template.deadline_date ? new Date(template.deadline_date).toLocaleDateString('id-ID') : '-' }}</small>
                                </div>
                                <div class="dropdown">
                                  <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" :id="'dropdown-' + template.id" data-bs-toggle="dropdown" data-bs-display="static" data-bs-boundary="viewport">⋮</button>
                                  <ul class="dropdown-menu dropdown-menu-end" :aria-labelledby="'dropdown-' + template.id">
                                    <li><a class="dropdown-item text-primary" href="#" @click.prevent="openEditModal(template)">✏️ Edit</a></li>
                                    <li><a class="dropdown-item text-danger" href="#" @click.prevent="openDeleteConfirm(template)">🗑️ Hapus</a></li>
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

            <!-- Add/Edit Modal -->
            <div class="modal fade task-modal" tabindex="-1" ref="taskModal" aria-hidden="true">
              <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">{{ editingId ? 'Edit Template Task' : 'Tambah Template Task Baru' }}</h5>
                    <button type="button" class="btn-close" @click="cancelAdd"></button>
                  </div>
                  <div class="modal-body">
                    <form @submit.prevent="saveTaskTemplate">
                      <div class="row">
                        <div class="col-md-6 mb-3">
                          <label class="form-label">Nama Task</label>
                          <input type="text" class="form-control" v-model.trim="newTask.task_name" 
                                 placeholder="Contoh: Olahraga pagi" required>
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
                          <input type="text" class="form-control" v-model.trim="newTask.category" 
                                 placeholder="Contoh: Kesehatan">
                        </div>
                      </div>
                      <div class="row">
                        <div class="col-md-4 mb-3">
                          <label class="form-label">Jenis Task</label>
                          <select class="form-select" v-model="newTask.jenis_task">
                            <option value="harian">Harian (materialisasi otomatis)</option>
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
                        <button type="button" class="btn btn-secondary" @click="cancelAdd">
                          Batal
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            <!-- Confirm Delete Modal -->
            <div class="modal fade" tabindex="-1" ref="confirmModal" aria-hidden="true">
              <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                  <div class="modal-header">
                    <h5 class="modal-title">Konfirmasi Hapus</h5>
                    <button type="button" class="btn-close" @click="closeConfirm"></button>
                  </div>
                  <div class="modal-body">
                    <p>Yakin ingin menghapus template "<strong>{{ pendingDelete ? pendingDelete.task_name : '' }}</strong>"?</p>
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
    `,
  async mounted() {
    // remove expired deadline templates/instances first
    try {
      await this.cleanPastDeadlines();
    } catch (_) {}
    await this.loadTemplates();
    // Elevate card when dropdown opens to ensure menu overlays neighbors
    try {
      document.addEventListener("show.bs.dropdown", this.handleDropdownShow, true);
      document.addEventListener("hide.bs.dropdown", this.handleDropdownHide, true);
    } catch (_) {}
  },
  destroyed() {
    try {
      document.removeEventListener("show.bs.dropdown", this.handleDropdownShow, true);
      document.removeEventListener("hide.bs.dropdown", this.handleDropdownHide, true);
    } catch (_) {}
  },
  methods: {
    async loadTemplates() {
      try {
        this.loading = true;
        const { data, error } = await this.supabase
          .from("daily_tasks_template")
          .select("*")
          .eq("user_id", this.user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        this.templates = data || [];
      } catch (error) {
        console.error("Error loading templates:", error);
        this.$root && this.$root.showToast && this.$root.showToast("Gagal memuat template: " + error.message, "danger");
      } finally {
        this.loading = false;
      }
    },
    async ensureTodayInstanceForTemplate(template) {
      // Only materialize templates that are daily; deadline tasks are single-shot and
      // should not be auto-created each day.
      if (template && template.jenis_task && template.jenis_task !== "harian") return;
      const today = window.WITA && window.WITA.today ? window.WITA.today() : new Date().toISOString().slice(0, 10);
      // Cek apakah instance untuk template ini sudah ada hari ini
      const { data: existing, error: eErr } = await this.supabase
        .from("daily_tasks_instance")
        .select("id")
        .eq("user_id", this.user.id)
        .eq("date", today)
        .eq("task_id", template.id)
        .limit(1);
      if (eErr) throw eErr;
      if (existing && existing.length > 0) return; // sudah ada
      // Insert instance baru untuk hari ini
      const { error: iErr } = await this.supabase.from("daily_tasks_instance").insert([
        {
          user_id: this.user.id,
          task_id: template.id,
          task_name: template.task_name,
          priority: template.priority,
          category: template.category,
          jenis_task: template.jenis_task || "harian",
          deadline_date: template.deadline_date || null,
          date: today,
          is_completed: false,
        },
      ]);
      if (iErr && iErr.code !== "23505") throw iErr;
    },

    // Modal helpers
    openAddModal() {
      this.editingId = null;
      this.modalMode = "add";
      this.newTask = { task_name: "", priority: "sedang", category: "", jenis_task: "harian", deadline_date: null };
      try {
        const el = this.$refs.taskModal;
        const instance = (window.bootstrap && window.bootstrap.Modal.getInstance(el)) || new window.bootstrap.Modal(el);
        instance.show();
      } catch (_) {}
    },
    openEditModal(template) {
      this.editingId = template.id;
      this.modalMode = "edit";
      this.newTask = {
        task_name: template.task_name,
        priority: template.priority,
        category: template.category || "",
        jenis_task: template.jenis_task || "harian",
        deadline_date: template.deadline_date || null,
      };
      try {
        const el = this.$refs.taskModal;
        const instance = (window.bootstrap && window.bootstrap.Modal.getInstance(el)) || new window.bootstrap.Modal(el);
        instance.show();
      } catch (_) {}
    },
    cancelAdd() {
      try {
        const el = this.$refs.taskModal;
        if (el) {
          const instance =
            (window.bootstrap && window.bootstrap.Modal.getInstance(el)) || new window.bootstrap.Modal(el);
          instance.hide();
        }
      } catch (_) {}
      this.newTask = { task_name: "", priority: "sedang", category: "", jenis_task: "harian", deadline_date: null };
      this.editingId = null;
      this.modalMode = "add";
    },

    async saveTaskTemplate() {
      // Validasi sederhana
      const name = (this.newTask.task_name || "").trim();
      if (name.length < 3) {
        this.$root && this.$root.showToast && this.$root.showToast("Nama task minimal 3 karakter", "warning");
        return;
      }
      if (!["tinggi", "sedang", "rendah"].includes(this.newTask.priority)) {
        this.newTask.priority = "sedang";
      }

      try {
        this.loading = true;
        if (this.editingId) {
          // UPDATE
          const { data, error } = await this.supabase
            .from("daily_tasks_template")
            .update({
              task_name: name,
              priority: this.newTask.priority,
              category: this.newTask.category || null,
              jenis_task: this.newTask.jenis_task || "harian",
              deadline_date: this.newTask.jenis_task === "deadline" ? this.newTask.deadline_date : null,
            })
            .eq("id", this.editingId)
            .eq("user_id", this.user.id)
            .select();
          if (error) throw error;

          const updated = data && data[0];
          if (updated) {
            const idx = this.templates.findIndex((t) => t.id === this.editingId);
            if (idx !== -1) this.$set(this.templates, idx, updated);

            // Propagate changes to today's instance so Checklist updates immediately
            try {
              const today =
                window.WITA && window.WITA.today ? window.WITA.today() : new Date().toISOString().slice(0, 10);
              await this.supabase
                .from("daily_tasks_instance")
                .update({
                  task_name: updated.task_name,
                  priority: updated.priority || "sedang",
                  category: updated.category || null,
                  jenis_task: updated.jenis_task || "harian",
                  deadline_date: updated.deadline_date || null,
                })
                .eq("user_id", this.user.id)
                .eq("task_id", updated.id)
                .eq("date", today);
            } catch (e) {
              console.warn("Gagal mensinkronkan instance hari ini setelah update template:", e.message);
            }

            // Notify other components (Checklist) to patch their local state
            try {
              window.dispatchEvent(new CustomEvent("template-updated", { detail: { template: updated } }));
            } catch (_) {
              /* noop */
            }
          }

          this.$root && this.$root.showToast && this.$root.showToast("Template berhasil diperbarui!", "success");
        } else {
          // Validation: jika jenis_task == 'deadline', pastikan deadline_date terisi
          if (this.newTask.jenis_task === "deadline" && !this.newTask.deadline_date) {
            this.$root &&
              this.$root.showToast &&
              this.$root.showToast("Tanggal deadline wajib diisi untuk jenis 'deadline'", "warning");
            this.loading = false;
            return;
          }
          // INSERT
          const { data, error } = await this.supabase
            .from("daily_tasks_template")
            .insert([
              {
                user_id: this.user.id,
                task_name: name,
                priority: this.newTask.priority,
                category: this.newTask.category || null,
                jenis_task: this.newTask.jenis_task || "harian",
                deadline_date: this.newTask.jenis_task === "deadline" ? this.newTask.deadline_date : null,
              },
            ])
            .select();
          if (error) throw error;

          this.templates.unshift(data[0]);
          // Buat instance untuk hari ini agar langsung muncul di Checklist
          try {
            await this.ensureTodayInstanceForTemplate(data[0]);
          } catch (e) {
            console.warn("Gagal membuat instance hari ini untuk template baru:", e.message);
          }
          // Beritahu komponen lain (Checklist) bahwa ada template baru
          try {
            window.dispatchEvent(new CustomEvent("template-added", { detail: { template: data[0] } }));
          } catch (_) {
            /* noop */
          }
          this.$root && this.$root.showToast && this.$root.showToast("Template task berhasil ditambahkan!", "success");
        }

        // Reset + tutup modal
        this.cancelAdd();
      } catch (error) {
        console.error("Error saving template:", error);
        this.$root &&
          this.$root.showToast &&
          this.$root.showToast("Gagal menyimpan template: " + error.message, "danger");
      } finally {
        this.loading = false;
      }
    },

    // Konfirmasi Hapus
    openDeleteConfirm(template) {
      this.pendingDelete = { id: template.id, task_name: template.task_name };
      try {
        const el = this.$refs.confirmModal;
        const instance = (window.bootstrap && window.bootstrap.Modal.getInstance(el)) || new window.bootstrap.Modal(el);
        instance.show();
      } catch (_) {}
    },
    closeConfirm() {
      try {
        const el = this.$refs.confirmModal;
        if (el) {
          const instance =
            (window.bootstrap && window.bootstrap.Modal.getInstance(el)) || new window.bootstrap.Modal(el);
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
          .from("daily_tasks_template")
          .delete()
          .eq("id", id)
          .eq("user_id", this.user.id);
        if (error) throw error;
        this.templates = this.templates.filter((t) => t.id !== id);
        if (this.editingId === id) this.cancelAdd();
        this.$root && this.$root.showToast && this.$root.showToast("Template berhasil dihapus!", "success");
      } catch (error) {
        console.error("Error deleting template:", error);
        this.$root &&
          this.$root.showToast &&
          this.$root.showToast("Gagal menghapus template: " + error.message, "danger");
      } finally {
        this.closeConfirm();
      }
    },

    getPriorityBadgeClass(priority) {
      const classes = {
        tinggi: "bg-danger",
        sedang: "bg-warning text-dark",
        rendah: "bg-success",
      };
      return classes[priority] || "bg-secondary";
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },

    // Backward-compat alias
    async addTaskTemplate() {
      return this.saveTaskTemplate();
    },
    handleDropdownShow(ev) {
      const dropdown = ev.target && ev.target.closest ? ev.target.closest(".dropdown") : null;
      if (!dropdown) return;
      const card = dropdown.closest(".card");
      if (card) card.classList.add("dropdown-open");
    },
    handleDropdownHide(ev) {
      const dropdown = ev.target && ev.target.closest ? ev.target.closest(".dropdown") : null;
      if (!dropdown) return;
      const card = dropdown.closest(".card");
      if (card) card.classList.remove("dropdown-open");
    },
    // async cleanPastDeadlines() {
    //   try {
    //     const today = window.WITA && window.WITA.today ? window.WITA.today() : new Date().toISOString().slice(0, 10);
    //     // Delete instances for this user with jenis_task='deadline' and date < today
    //     const { error: instErr } = await this.supabase
    //       .from('daily_tasks_instance')
    //       .delete()
    //       .eq('user_id', this.user.id)
    //       .eq('jenis_task', 'deadline')
    //       .lt('date', today);
    //     if (instErr) console.warn('cleanPastDeadlines: failed to delete instances', instErr.message || instErr);

    //     // Optionally delete templates that are past (deadline_date < today)
    //     const { error: tplErr } = await this.supabase
    //       .from('daily_tasks_template')
    //       .delete()
    //       .eq('user_id', this.user.id)
    //       .eq('jenis_task', 'deadline')
    //       .lt('deadline_date', today);
    //     if (tplErr) console.warn('cleanPastDeadlines: failed to delete templates', tplErr.message || tplErr);
    //   } catch (e) {
    //     console.warn('cleanPastDeadlines error', e);
    //   }
    // },
  },
});
