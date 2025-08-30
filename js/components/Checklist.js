Vue.component("checklist", {
  props: ["user", "supabase"],
  data() {
    return {
      todayTasks: [],
      loading: false,
      today: new Date().toISOString().split("T")[0],
      completedCount: 0,
      totalCount: 0,
      newAdHocTask: "",
      // Filters
      filterPriority: "all",
      filterCategory: "all",
      searchText: "",
      // Score
      todayScoreDb: 0,
    };
  },
  template: `
        <div class="fade-in">
            <div class="d-flex flex-wrap justify-content-between align-items-center mb-2">
                <div>
                    <h3>✅ Checklist Hari Ini</h3>
                    <small class="text-muted">{{ formatDate(today) }}</small>
                </div>
            </div>
            
            <div class="text-start mb-2 mt-0">
                    <div class="d-flex flex-column align-items-end">
                        <div class="badge bg-primary fs-6 mb-2">{{ completedCount }} / {{ totalCount }} selesai</div>
                        <div class="progress" style="width: 100%;">
                            <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
                        </div>
                        <small class="mt-1 text-muted">Skor hari ini: <strong :class="todayScoreDb>=0 ? 'text-success' : 'text-danger'">{{ todayScoreDb>=0?'+':'' }}{{ todayScoreDb }}</strong></small>
                    </div>
            </div>

            <!-- Tasks List -->
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">📋 Daftar Task</h5>
                    <button class="btn btn-sm btn-outline-secondary" @click="loadTodayTasks">🔄 Refresh</button>
                </div>
                <div class="card-body">
                    <div v-if="loading" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
                    </div>
                    <div v-else-if="todayTasks.length === 0" class="text-center text-muted py-4">
                        <p>📝 Belum ada task untuk hari ini.</p>
                        <p>Task dari template akan otomatis muncul, atau Anda bisa menambah task tambahan di atas.</p>
                    </div>
          <div v-else class="task-list">
            <div class="row">
              <div v-for="task in sortedTasks" :key="task.id" class="col-12 col-md-4">
                <div class="task-item d-flex align-items-center p-3 mb-3 border rounded"
                   :class="[ task.is_completed ? 'task-completed bg-light' : '', 'priority-' + (task.priority || 'sedang') ]">
                  <div class="form-check me-3">
                    <input class="form-check-input form-check-input-lg" type="checkbox" :id="'task-' + task.id" :checked="task.is_completed" @change="toggleTask(task)" :disabled="loading">
                  </div>
                  <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 class="mb-1" :class="task.is_completed ? 'text-muted' : ''">
                          {{ task.task_name }}
                        </h6>
                        <div class="d-flex gap-2 align-items-center">
                          <span v-if="task.priority" 
                              class="badge badge-sm" 
                              :class="getPriorityBadgeClass(task.priority)">
                            {{ task.priority }}
                          </span>
                          <span v-if="task.category" 
                              class="badge bg-light text-dark badge-sm">
                            {{ task.category }}
                          </span>
                          <span v-if="!task.task_id" 
                              class="badge bg-info text-white badge-sm">
                            Tambahan
                          </span>
                        </div>
                      </div>
                      <div class="text-end">
                        <small v-if="task.is_completed && task.checked_at" class="text-success d-block">
                          ✅ {{ formatTime(task.checked_at) }}
                        </small>
                        <button v-if="!task.task_id" 
                            class="btn btn-sm btn-outline-danger mt-1"
                            @click="deleteAdHocTask(task.id)"
                            title="Hapus task tambahan">
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
                </div>
            </div>

            <!-- Add Ad-hoc Task -->
            <div class="card mt-2">
                <div class="card-body">
                    <div class="row align-items-end">
                        <div class="col-md-3 mb-2">
                            <label class="form-label">Tambah Task Tambahan (Tidak dari Template)</label>
                            <input type="text" class="form-control" v-model="newAdHocTask" 
                                   placeholder="Contoh: Meeting dengan klien" 
                                   @keyup.enter="addAdHocTask">
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-outline-primary w-100" @click="addAdHocTask" 
                                    :disabled="!newAdHocTask.trim()">
                                + Tambah Task
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Daily Summary -->
            <div class="row mt-2">
                <div class="col-md-6 mb-2">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5 class="card-title">🎯 Progress Hari Ini</h5>
                            <div class="display-6 mb-2" :class="progressPercentage >= 80 ? 'text-success' : progressPercentage >= 50 ? 'text-warning' : 'text-danger'">
                                {{ progressPercentage }}%
                            </div>
                            <p class="text-muted">{{ getMotivationalMessage() }}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 mb-2">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5 class="card-title">⚡ Skor Hari Ini</h5>
                            <div class="display-6 mb-2" :class="todayScore >= 0 ? 'text-success' : 'text-danger'">
                                {{ todayScore >= 0 ? '+' : '' }}{{ todayScore }}
                            </div>
                            <p class="text-muted">{{ getScoreMessage() }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
  computed: {
    progressPercentage() {
      return this.totalCount > 0 ? Math.round((this.completedCount / this.totalCount) * 100) : 0;
    },

    categoriesList() {
      const set = new Set(this.todayTasks.map((t) => t.category).filter(() => true));
      return Array.from(set);
    },

    sortedTasks() {
      const priorityOrder = { tinggi: 3, sedang: 2, rendah: 1 };
      const filtered = this.todayTasks.filter((t) => {
        const pr = t.priority || "sedang";
        const byPriority = this.filterPriority === "all" || pr === this.filterPriority;
        const byCategory = this.filterCategory === "all" || (t.category || null) === this.filterCategory;
        const bySearch = !this.searchText || (t.task_name || "").toLowerCase().includes(this.searchText.toLowerCase());
        return byPriority && byCategory && bySearch;
      });
      return filtered.sort((a, b) => {
        // Incomplete first
        if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
        const ap = priorityOrder[a.priority || "sedang"] || 2;
        const bp = priorityOrder[b.priority || "sedang"] || 2;
        if (bp !== ap) return bp - ap; // tinggi dulu
        // stable fallback by created_at if available
        const at = new Date(a?.created_at || 0).getTime();
        const bt = new Date(b?.created_at || 0).getTime();
        return at - bt;
      });
    },

    todayScore() {
      // dipertahankan untuk UI lama; skor aktual gunakan todayScoreDb
      return this.completedCount - (this.totalCount - this.completedCount);
    },
  },
  async mounted() {
    await this.initializeTodayTasks();
    // Dengarkan event template baru agar langsung muncul tanpa refresh manual
    this._onTemplateAdded = async (ev) => {
      try {
        const tpl = ev.detail?.template;
        if (!tpl) return;
        const today = this.today;
        // Ambil instance yang baru dibuat untuk hari ini
        const { data, error } = await this.supabase
          .from("daily_tasks_instance")
          .select("*")
          .eq("user_id", this.user.id)
          .eq("date", today)
          .eq("task_id", tpl.id)
          .limit(1);
        if (error) throw error;
        const instance = data && data[0];
        if (instance) {
          // Tambahkan ke list lokal jika belum ada
          const exists = this.todayTasks.some((t) => t.id === instance.id);
          if (!exists) {
            this.todayTasks.push(instance);
            this.updateCounts();
            await this.loadTodayScore();
          }
        } else {
          // fallback: reload semua task
          await this.loadTodayTasks();
        }
      } catch (e) {
        console.warn("Gagal memproses event template-added:", e.message);
      }
    };

    // Dengarkan event template diupdate untuk patch nama/priority/category pada task hari ini
    this._onTemplateUpdated = (ev) => {
      try {
        const tpl = ev.detail?.template;
        if (!tpl) return;
        let changed = false;
        this.todayTasks = this.todayTasks.map((t) => {
          if (t.task_id === tpl.id) {
            changed = true;
            return {
              ...t,
              task_name: tpl.task_name,
              priority: tpl.priority || t.priority,
              category: tpl.category !== undefined ? tpl.category : t.category,
            };
          }
          return t;
        });
        if (changed) {
          this.updateCounts();
        }
      } catch (e) {
        console.warn("Gagal memproses event template-updated:", e.message);
      }
    };

    window.addEventListener("template-added", this._onTemplateAdded);
    window.addEventListener("template-updated", this._onTemplateUpdated);
  },
  beforeDestroy() {
    if (this._onTemplateAdded) {
      window.removeEventListener("template-added", this._onTemplateAdded);
    }
    if (this._onTemplateUpdated) {
      window.removeEventListener("template-updated", this._onTemplateUpdated);
    }
  },
  methods: {
    async initializeTodayTasks() {
      try {
        this.loading = true;

        // First, check if today's tasks already exist
        const { data: existingTasks } = await this.supabase
          .from("daily_tasks_instance")
          .select("*")
          .eq("user_id", this.user.id)
          .eq("date", this.today);

        if (!existingTasks || existingTasks.length === 0) {
          // Create today's tasks from templates
          await this.createTodayTasksFromTemplates();
        }

        // Load today's tasks
        await this.loadTodayTasks();
      } catch (error) {
        console.error("Error initializing today tasks:", error);
      } finally {
        this.loading = false;
      }
    },

    async createTodayTasksFromTemplates() {
      try {
        // Get all templates
        const { data: templates } = await this.supabase
          .from("daily_tasks_template")
          .select("*")
          .eq("user_id", this.user.id);

        if (templates && templates.length > 0) {
          // Create instances for today
          const instances = templates.map((t) => ({
            user_id: this.user.id,
            task_id: t.id,
            task_name: t.task_name,
            priority: t.priority,
            category: t.category,
            date: this.today,
            is_completed: false,
          }));

          const { error } = await this.supabase.from("daily_tasks_instance").insert(instances);

          if (error) throw error;
        }
      } catch (error) {
        console.error("Error creating today tasks from templates:", error);
      }
    },

    async syncFromTemplates() {
      // Sisipkan template yang belum ada untuk hari ini
      try {
        this.loading = true;

        const { data: templates, error: tErr } = await this.supabase
          .from("daily_tasks_template")
          .select("id, task_name, priority, category")
          .eq("user_id", this.user.id);

        if (tErr) throw tErr;

        const { data: existing, error: eErr } = await this.supabase
          .from("daily_tasks_instance")
          .select("task_id")
          .eq("user_id", this.user.id)
          .eq("date", this.today);

        if (eErr) throw eErr;

        const existingIds = new Set((existing || []).map((i) => i.task_id).filter(Boolean));
        const toInsert = (templates || [])
          .filter((t) => !existingIds.has(t.id))
          .map((t) => ({
            user_id: this.user.id,
            task_id: t.id,
            task_name: t.task_name,
            priority: t.priority,
            category: t.category,
            date: this.today,
            is_completed: false,
          }));

        if (toInsert.length) {
          const { error: iErr } = await this.supabase.from("daily_tasks_instance").insert(toInsert);
          if (iErr && iErr.code !== "23505") throw iErr;
        }

        await this.loadTodayTasks();
        alert("Sinkronisasi selesai");
      } catch (error) {
        console.error("Error syncFromTemplates:", error);
        alert("Gagal sinkronisasi: " + error.message);
      } finally {
        this.loading = false;
      }
    },

    async loadTodayTasks() {
      try {
        this.loading = true;

        const { data, error } = await this.supabase
          .from("daily_tasks_instance")
          .select("*")
          .eq("user_id", this.user.id)
          .eq("date", this.today)
          .order("created_at", { ascending: true });

        if (error) throw error;

        this.todayTasks = data || [];
        this.updateCounts();
        await this.loadTodayScore();
      } catch (error) {
        console.error("Error loading today tasks:", error);
        this.$root &&
          this.$root.showToast &&
          this.$root.showToast("Gagal memuat task hari ini: " + error.message, "danger");
      } finally {
        this.loading = false;
      }
    },

    async loadTodayScore() {
      try {
        const { data, error } = await this.supabase
          .from("score_log")
          .select("score_delta")
          .eq("user_id", this.user.id)
          .eq("date", this.today);

        if (error) throw error;

        this.todayScoreDb = (data || []).reduce((s, r) => s + (r.score_delta || 0), 0);
      } catch (error) {
        console.warn("Gagal memuat skor harian:", error.message);
        this.todayScoreDb = 0;
      }
    },

    async toggleTask(task) {
      try {
        const newStatus = !task.is_completed;
        const now = new Date().toISOString();

        const { error } = await this.supabase
          .from("daily_tasks_instance")
          .update({
            is_completed: newStatus,
            checked_at: newStatus ? now : null,
          })
          .eq("id", task.id)
          .eq("user_id", this.user.id);

        if (error) throw error;

        task.is_completed = newStatus;
        task.checked_at = newStatus ? now : null;

        await this.logScoreChange(
          newStatus ? 1 : -1,
          newStatus ? `Menyelesaikan: ${task.task_name}` : `Membatalkan: ${task.task_name}`
        );

        this.updateCounts();
        await this.loadTodayScore();
      } catch (error) {
        console.error("Error toggling task:", error);
        this.$root &&
          this.$root.showToast &&
          this.$root.showToast("Gagal mengubah status task: " + error.message, "danger");
      }
    },

    async addAdHocTask() {
      if (!this.newAdHocTask.trim()) return;

      try {
        const { data, error } = await this.supabase
          .from("daily_tasks_instance")
          .insert([
            {
              user_id: this.user.id,
              task_id: null,
              task_name: this.newAdHocTask.trim(),
              priority: "sedang",
              category: null,
              date: this.today,
              is_completed: false,
            },
          ])
          .select();

        if (error) throw error;

        this.todayTasks.push(data[0]);
        this.updateCounts();
        this.newAdHocTask = "";
      } catch (error) {
        console.error("Error adding task tambahan:", error);
        this.$root &&
          this.$root.showToast &&
          this.$root.showToast("Gagal menambahkan task: " + error.message, "danger");
      }
    },

    async deleteAdHocTask(taskId) {
      try {
        const { error } = await this.supabase
          .from("daily_tasks_instance")
          .delete()
          .eq("id", taskId)
          .eq("user_id", this.user.id);

        if (error) throw error;

        this.todayTasks = this.todayTasks.filter((t) => t.id !== taskId);
        this.updateCounts();
        await this.loadTodayScore();
      } catch (error) {
        console.error("Error deleting task tambahan:", error);
        this.$root && this.$root.showToast && this.$root.showToast("Gagal menghapus task: " + error.message, "danger");
      }
    },

    async logScoreChange(delta, reason) {
      try {
        const { error } = await this.supabase.from("score_log").insert([
          {
            user_id: this.user.id,
            date: this.today,
            score_delta: delta,
            reason: reason,
          },
        ]);

        if (error) throw error;
      } catch (error) {
        console.error("Error logging score change:", error);
      }
    },

    updateCounts() {
      this.totalCount = this.todayTasks.length;
      this.completedCount = this.todayTasks.filter((task) => task.is_completed).length;
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
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    },

    formatTime(dateString) {
      return new Date(dateString).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    getMotivationalMessage() {
      const percentage = this.progressPercentage;
      if (percentage === 100) return "🎉 Sempurna! Semua task selesai!";
      if (percentage >= 80) return "🔥 Luar biasa! Hampir selesai!";
      if (percentage >= 60) return "💪 Bagus! Terus semangat!";
      if (percentage >= 40) return "⚡ Ayo bisa! Jangan menyerah!";
      if (percentage >= 20) return "🚀 Mulai yang bagus! Lanjutkan!";
      return "💡 Ayo mulai! Satu langkah demi satu langkah!";
    },

    getScoreMessage() {
      const score = this.todayScoreDb;
      if (score >= 5) return "🏆 Produktivitas tinggi!";
      if (score >= 3) return "⭐ Performa bagus!";
      if (score >= 1) return "👍 Terus tingkatkan!";
      if (score === 0) return "⚖️ Terus lanjutkan, bisa lebih baik!";
      return "📈 Fokus pada penyelesaian task!";
    },
  },
});
