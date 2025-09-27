<template>
  <div class="fade-in">
    <div class="d-flex flex-wrap justify-content-between align-items-center mt-3">
      <div>
        <h4>✅ Checklist Hari Ini</h4>
        <small class="text-muted">{{ formatDate(today) }}</small>
      </div>
    </div>

    <div class="row mt-4">
      <div class="col-md-6 mb-4">
        <div class="card checklist-card card-accent card-accent--success">
          <div class="card-body text-center">
            <h5 class="card-title">🎯 Progress Hari Ini</h5>
            <div
              class="display-6 mb-2"
              :class="
                progressPercentage >= 80
                  ? 'text-success'
                  : progressPercentage >= 50
                    ? 'text-warning'
                    : 'text-danger'
              "
            >
              {{ progressPercentage }}%
            </div>
            <p class="text-muted">{{ getMotivationalMessage() }}</p>
          </div>
        </div>
      </div>
      <div class="col-md-6 mb-4">
        <div class="card checklist-card card-accent card-accent--warning">
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

    <div class="card checklist-card card-accent card-accent--primary">
      <div class="card-header py-3 d-flex justify-content-between align-items-center">
        <h5 class="mb-0">📋 Daftar Task</h5>
        <button class="btn btn-sm btn-outline-secondary" @click="loadTodayTasks">🔄 Refresh</button>
      </div>
      <div class="card-body">
        <div v-if="loading" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
        <div v-else-if="todayTasks.length === 0" class="text-center text-muted py-2">
          <p>📝 Belum ada task untuk hari ini.</p>
          <p>
            Task dari template akan otomatis muncul, atau Anda bisa menambah kegiatan di menu Task.
          </p>
        </div>
        <div v-else class="task-list">
          <div class="row">
            <div v-for="task in sortedTasks" :key="task.id" class="col-12 col-md-4">
              <div
                class="task-item d-flex align-items-center p-3 mb-3 border rounded"
                :class="[
                  task.is_completed ? 'task-completed bg-light' : '',
                  'priority-' + (task.priority || 'sedang'),
                ]"
              >
                <div class="form-check me-3">
                  <input
                    class="form-check-input form-check-input-lg"
                    type="checkbox"
                    :id="'task-' + task.id"
                    :checked="task.is_completed"
                    @change="toggleTask(task)"
                    :disabled="loading"
                  />
                </div>
                <div class="flex-grow-1">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h6 class="mb-1" :class="task.is_completed ? 'text-muted' : ''">
                        {{ task.task_name }}
                      </h6>
                      <div class="d-flex gap-2 align-items-center">
                        <span
                          v-if="task.priority"
                          class="badge badge-sm"
                          :class="getPriorityBadgeClass(task.priority)"
                          >{{ task.priority }}</span
                        >
                        <span v-if="task.category" class="badge bg-light text-dark badge-sm">{{
                          task.category
                        }}</span>
                        <span v-if="!task.task_id" class="badge bg-info text-white badge-sm"
                          >Tambahan</span
                        >
                      </div>
                    </div>
                    <div class="text-end">
                      <small
                        v-if="task.is_completed && task.checked_at"
                        class="text-success d-block"
                      >
                        ✅ {{ formatTime(task.checked_at) }}
                      </small>
                      <button
                        v-if="!task.task_id"
                        class="btn btn-sm btn-outline-danger mt-1"
                        @click="deleteAdHocTask(task.id)"
                        title="Hapus task tambahan"
                      >
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

    <div class="card checklist-card card-accent card-accent--primary my-4">
      <div class="card-body">
        <div class="row">
          <div class="col-md-7 col-lg-6 py-3">
            <label class="form-label fw-bold"> 📋 Tambah Task Tambahan (Tidak dari Template)</label>
            <div class="input-group">
              <input
                type="text"
                class="form-control"
                v-model="newAdHocTask"
                placeholder="Contoh: Meeting dengan klien"
                @keyup.enter="addAdHocTask"
              />
              <button
                class="btn btn-outline-primary mx-3"
                @click="addAdHocTask"
                :disabled="!newAdHocTask.trim()"
              >
                + Tambah Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Checklist',
  props: ['user', 'supabase'],
  data() {
    return {
      todayTasks: [],
      loading: false,
      today: this.getTodayWIB(),
      completedCount: 0,
      totalCount: 0,
      newAdHocTask: '',
      filterPriority: 'all',
      filterCategory: 'all',
      searchText: '',
      todayScoreDb: 0,

      // State management
      dataService: null,
      unsubscribeCallbacks: [],
    };
  },
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
        // Filter deadline tasks: hanya tampil jika deadline = hari ini
        if (t.jenis_task === 'deadline') {
          // Untuk task deadline, hanya tampilkan jika deadline_date === today
          return t.deadline_date === this.today;
        }

        const pr = t.priority || 'sedang';
        const byPriority = this.filterPriority === 'all' || pr === this.filterPriority;
        const byCategory =
          this.filterCategory === 'all' || (t.category || null) === this.filterCategory;
        const bySearch =
          !this.searchText ||
          (t.task_name || '').toLowerCase().includes(this.searchText.toLowerCase());
        return byPriority && byCategory && bySearch;
      });
      return filtered.sort((a, b) => {
        if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
        const ap = priorityOrder[a.priority || 'sedang'] || 2;
        const bp = priorityOrder[b.priority || 'sedang'] || 2;
        if (bp !== ap) return bp - ap;
        const at = new Date(a?.created_at || 0).getTime();
        const bt = new Date(b?.created_at || 0).getTime();
        return at - bt;
      });
    },
    todayScore() {
      return this.completedCount - (this.totalCount - this.completedCount);
    },
  },
  async mounted() {
    // Initialize DataService
    this.dataService = window.dataService;
    if (!this.dataService) {
      console.error('DataService not available');
      return;
    }

    // Subscribe to state changes for instant updates
    const unsubTasks = window.stateManager.subscribe('todayTasks', (tasks) => {
      if (Array.isArray(tasks)) {
        this.todayTasks = tasks;
        this.updateCounts();
        this.loading = false;
      }
    });

    const unsubScore = window.stateManager.subscribe('todayScore', (score) => {
      if (typeof score === 'number') this.todayScoreDb = score;
    });

    this.unsubscribeCallbacks.push(unsubTasks, unsubScore);

    // Check if we have cached data, if not then load
    const hasCachedTasks = window.stateManager?.getFromCache('todayTasks');
    const hasCachedScore = window.stateManager?.getFromCache('todayScore');

    if (!hasCachedTasks || !hasCachedScore) {
      await this.initializeTodayTasks();
    }

    // Setup event listeners for template changes
    this._onTemplateAdded = async (ev) => {
      try {
        const tpl = ev.detail?.template;
        if (!tpl) return;

        // Force refresh today tasks to include new template
        await this.loadTodayTasks(true);
      } catch (e) {
        console.warn('Gagal memproses event template-added:', e.message);
      }
    };

    this._onTemplateUpdated = (ev) => {
      try {
        const tpl = ev.detail?.template;
        if (!tpl) return;

        // Update tasks in cache that match this template
        const tasks = window.stateManager.getFromCache('todayTasks');
        if (tasks) {
          let changed = false;
          const updatedTasks = tasks.map((t) => {
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
            window.stateManager.setCache('todayTasks', updatedTasks);
          }
        }
      } catch (e) {
        console.warn('Gagal memproses event template-updated:', e.message);
      }
    };

    window.addEventListener('template-added', this._onTemplateAdded);
    window.addEventListener('template-updated', this._onTemplateUpdated);
  },
  beforeDestroy() {
    // Cleanup subscriptions
    this.unsubscribeCallbacks.forEach((unsub) => unsub());

    // Cleanup event listeners
    if (this._onTemplateAdded) window.removeEventListener('template-added', this._onTemplateAdded);
    if (this._onTemplateUpdated)
      window.removeEventListener('template-updated', this._onTemplateUpdated);
  },
  methods: {
    getTodayWIB() {
      // Prioritas: gunakan window.WITA.today() jika tersedia
      if (window.WITA && typeof window.WITA.today === 'function') {
        return window.WITA.today();
      }

      // Fallback: hitung manual menggunakan zona waktu WIB (UTC+7)
      const now = new Date();
      const wibTime = new Date(now.getTime() + 7 * 60 * 60 * 1000); // UTC+7
      return wibTime.toISOString().slice(0, 10);
    },

    async initializeTodayTasks() {
      try {
        this.loading = true;

        // Try to sync from templates first
        await this.dataService.syncFromTemplates(this.user.id, this.today);

        // Load today tasks (will use cache if available)
        await this.loadTodayTasks();

        // Load today score
        await this.loadTodayScore();
      } catch (error) {
        console.error('Error initializing today tasks:', error);
        this.$root?.showToast?.('Gagal menginisialisasi task hari ini: ' + error.message, 'danger');
      } finally {
        this.loading = false;
      }
    },

    async loadTodayTasks(forceRefresh = false) {
      try {
        this.loading = true;

        const result = await this.dataService.getTodayTasks(this.user.id, this.today, forceRefresh);
        this.todayTasks = result.data || [];
        this.updateCounts();
      } catch (error) {
        console.error('Error loading today tasks:', error);
        this.$root?.showToast?.('Gagal memuat task hari ini: ' + error.message, 'danger');
      } finally {
        this.loading = false;
      }
    },

    async loadTodayScore(forceRefresh = false) {
      try {
        const result = await this.dataService.getTodayScore(this.user.id, this.today, forceRefresh);
        this.todayScoreDb = result.data || 0;
      } catch (error) {
        console.warn('Gagal memuat skor harian:', error.message);
        this.todayScoreDb = 0;
      }
    },
    async toggleTask(task) {
      const newStatus = !task.is_completed;
      // Optimistic local update so UI reflects change immediately
      const prevStatus = task.is_completed;
      const prevCheckedAt = task.checked_at;
      try {
        task.is_completed = newStatus;
        task.checked_at = newStatus ? new Date().toISOString() : null;
        this.updateCounts();

        // Call data service (which also performs its own optimistic update)
        await this.dataService.toggleTask(task.id, this.user.id, newStatus, task.task_name);

        // Refresh score cache
        await this.loadTodayScore(true);

        // Dispatch events for other components
        try {
          if (task.jenis_task === 'deadline' && newStatus) {
            window.dispatchEvent(
              new CustomEvent('deadline-completed', {
                detail: { instance: { ...task, is_completed: newStatus } },
              }),
            );
          } else {
            window.dispatchEvent(new CustomEvent('agenda-refresh'));
          }
        } catch (_) {}
      } catch (error) {
        // Rollback local optimistic update
        task.is_completed = prevStatus;
        task.checked_at = prevCheckedAt;
        this.updateCounts();
        console.error('Error toggling task:', error);
        this.$root?.showToast?.('Gagal mengubah status task: ' + error.message, 'danger');
      }
    },

    async addAdHocTask() {
      if (!this.newAdHocTask.trim()) return;

      try {
        await this.dataService.addAdHocTask(this.user.id, this.newAdHocTask, this.today);
        this.newAdHocTask = '';
      } catch (error) {
        console.error('Error adding task tambahan:', error);
        this.$root?.showToast?.('Gagal menambahkan task: ' + error.message, 'danger');
      }
    },

    async deleteAdHocTask(taskId) {
      try {
        await this.dataService.deleteAdHocTask(taskId, this.user.id);

        // Refresh score
        await this.loadTodayScore(true);
      } catch (error) {
        console.error('Error deleting task tambahan:', error);
        this.$root?.showToast?.('Gagal menghapus task: ' + error.message, 'danger');
      }
    },
    updateCounts() {
      this.totalCount = this.todayTasks.length;
      this.completedCount = this.todayTasks.filter((task) => task.is_completed).length;
    },
    getPriorityBadgeClass(priority) {
      const classes = { tinggi: 'bg-danger', sedang: 'bg-warning text-dark', rendah: 'bg-success' };
      return classes[priority] || 'bg-secondary';
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Jakarta', // WIB (UTC+7)
      });
    },
    formatTime(dateString) {
      return new Date(dateString).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta', // WIB (UTC+7)
      });
    },
    getMotivationalMessage() {
      const percentage = this.progressPercentage;
      if (percentage === 100) return '🎉 Sempurna! Semua task selesai!';
      if (percentage >= 80) return '🔥 Luar biasa! Hampir selesai!';
      if (percentage >= 60) return '💪 Bagus! Terus semangat!';
      if (percentage >= 40) return '⚡ Ayo bisa! Jangan menyerah!';
      if (percentage >= 20) return '🚀 Mulai yang bagus! Lanjutkan!';
      return '💡 Ayo mulai! Satu langkah demi satu langkah!';
    },
    getScoreMessage() {
      const score = this.todayScoreDb;
      if (score >= 5) return '🏆 Produktivitas tinggi!';
      if (score >= 3) return '⭐ Performa bagus!';
      if (score >= 1) return '👍 Terus tingkatkan!';
      if (score === 0) return '⚖️ Terus lanjutkan, bisa lebih baik!';
      return '📈 Fokus pada penyelesaian task!';
    },
  },
};
</script>
