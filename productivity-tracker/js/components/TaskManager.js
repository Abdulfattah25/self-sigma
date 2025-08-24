Vue.component("task-manager", {
  props: ["user", "supabase"],
  data() {
    return {
      templates: [],
      newTask: {
        task_name: "",
        priority: "sedang",
        category: "",
      },
      loading: false,
      showAddForm: false,
      editingId: null,
    };
  },
  template: `
        <div class="fade-in">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>🎯 Task Manager</h2>
                <button class="btn btn-primary btn-icon" @click="toggleAddForm">
                    <i class="bi" :class="showAddForm ? 'bi-x' : 'bi-plus-lg'"></i>
                    {{ showAddForm ? 'Tutup Form' : 'Tambah Template Task' }}
                </button>
            </div>

            <!-- Add/Edit Task Form -->
            <div v-if="showAddForm" class="card mb-4">
                <div class="card-header">
                    <h5 class="mb-0">{{ editingId ? 'Edit Template Task' : 'Tambah Template Task Baru' }}</h5>
                </div>
                <div class="card-body">
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

            <!-- Templates List -->
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">📝 Template Task Harian</h5>
                    <small class="text-muted">Template ini akan otomatis muncul di checklist setiap hari</small>
                </div>
                <div class="card-body">
                    <div v-if="templates.length === 0" class="text-center text-muted py-4">
                        <p>Belum ada template task.</p>
                        <p>Tambahkan template pertama Anda untuk memulai!</p>
                    </div>
                    <div v-else>
                        <div class="row">
                            <div v-for="template in templates" :key="template.id" class="col-md-6 mb-3">
                                <div class="card h-100 priority-{{template.priority}}">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-start">
                                            <div class="flex-grow-1">
                                                <h6 class="card-title mb-1">{{ template.task_name }}</h6>
                                                <div class="mb-2">
                                                    <span class="badge badge-sm me-2" :class="getPriorityBadgeClass(template.priority)">
                                                        {{ template.priority.toUpperCase() }}
                                                    </span>
                                                    <span v-if="template.category" class="badge bg-light text-dark badge-sm">
                                                        {{ template.category }}
                                                    </span>
                                                </div>
                                                <small class="text-muted">
                                                    Dibuat: {{ formatDate(template.created_at) }}
                                                </small>
                                            </div>
                                            <div class="dropdown">
                                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                                        type="button" :id="'dropdown-' + template.id" 
                                                        data-bs-toggle="dropdown">
                                                    ⋮
                                                </button>
                                                <ul class="dropdown-menu" :aria-labelledby="'dropdown-' + template.id">
                                                    <li>
                                                        <a class="dropdown-item text-primary" href="#" 
                                                           @click.prevent="editTemplate(template)">
                                                            ✏️ Edit
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a class="dropdown-item text-danger" href="#" 
                                                           @click.prevent="deleteTemplate(template.id)">
                                                            🗑️ Hapus
                                                        </a>
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
    `,
  async mounted() {
    await this.loadTemplates();
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
        alert("Gagal memuat template: " + error.message);
      } finally {
        this.loading = false;
      }
    },

    toggleAddForm() {
      this.showAddForm = !this.showAddForm;
      if (this.showAddForm) {
        // mode tambah baru
        this.editingId = null;
        this.newTask = { task_name: "", priority: "sedang", category: "" };
      }
    },

    async saveTaskTemplate() {
      // Validasi sederhana
      const name = (this.newTask.task_name || "").trim();
      if (name.length < 3) {
        alert("Nama task minimal 3 karakter");
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
            })
            .eq("id", this.editingId)
            .eq("user_id", this.user.id)
            .select();
          if (error) throw error;

          const updated = data && data[0];
          if (updated) {
            const idx = this.templates.findIndex((t) => t.id === this.editingId);
            if (idx !== -1) this.$set(this.templates, idx, updated);
          }

          alert("Template berhasil diperbarui!");
        } else {
          // INSERT
          const { data, error } = await this.supabase
            .from("daily_tasks_template")
            .insert([
              {
                user_id: this.user.id,
                task_name: name,
                priority: this.newTask.priority,
                category: this.newTask.category || null,
              },
            ])
            .select();
          if (error) throw error;

          this.templates.unshift(data[0]);
          alert("Template task berhasil ditambahkan!");
        }

        // Reset form
        this.cancelAdd();
      } catch (error) {
        console.error("Error saving template:", error);
        alert("Gagal menyimpan template: " + error.message);
      } finally {
        this.loading = false;
      }
    },

    async addTaskTemplate() {
      // deprecated: diganti saveTaskTemplate()
      return this.saveTaskTemplate();
    },

    async deleteTemplate(templateId) {
      if (!confirm("Yakin ingin menghapus template ini? Task yang sudah ada di checklist tidak akan terhapus.")) return;
      try {
        const { error } = await this.supabase
          .from("daily_tasks_template")
          .delete()
          .eq("id", templateId)
          .eq("user_id", this.user.id);
        if (error) throw error;
        this.templates = this.templates.filter((t) => t.id !== templateId);
        if (this.editingId === templateId) this.cancelAdd();
        alert("Template berhasil dihapus!");
      } catch (error) {
        console.error("Error deleting template:", error);
        alert("Gagal menghapus template: " + error.message);
      }
    },

    editTemplate(template) {
      this.editingId = template.id;
      this.showAddForm = true;
      this.newTask = {
        task_name: template.task_name,
        priority: template.priority,
        category: template.category || "",
      };
    },

    cancelAdd() {
      this.showAddForm = false;
      this.newTask = { task_name: "", priority: "sedang", category: "" };
      this.editingId = null;
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
  },
});
