Vue.component("dashboard", {
  props: ["user", "supabase", "dailyQuote", "plant"], // tambah prop 'plant'
  data() {
    return {
      todayScore: 0,
      totalScore: 0,
      todayTasks: [],
      incompleteTasks: [],
      weeklyScores: [],
      completionRatio: 0,
      loading: true,
      chartInstance: null,
      chartRangeDays: 7, // 7 atau 30
      templateTargetCount: 0,

      // Hutan virtual
      forestTrees: [], // [{date:'YYYY-MM-DD', percent:number}, ...]
      forestDaysRange: 21, // rentang hari yang ditampilkan di grid hutan
      themeObserver: null,
    };
  },
  template: `
        <div class="fade-in">
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card quote-card">
                        <div class="card-body text-center">
                            <h5 class="card-title">💡 Quote Hari Ini</h5>
                            <p class="card-text fs-6 fst-italic">"{{ dailyQuote }}"</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mb-2">
        <div class="col-md-6 mb-3">
          <div class="card stats-card dashboard-card card-accent card-accent--primary">
                        <div class="card-header py-3">
                            <h5 class="mb-0">📊 Skor Produktivitas</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-6 text-center">
                                    <span class="stats-number" :class="todayScore >= 0 ? 'score-positive' : 'score-negative'">
                                        {{ todayScore >= 0 ? '+' : '' }}{{ todayScore }}
                                    </span>
                                    <small class="text-muted d-block">Skor Hari Ini</small>
                                </div>
                                <div class="col-6 text-center">
                                    <span class="stats-number text-primary">{{ totalScore }}</span>
                                    <small class="text-muted d-block">Total Skor</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
        <div class="col-md-6 mb-3">
          <div class="card stats-card dashboard-card card-accent card-accent--warning">
                        <div class="card-header py-3">
                            <h5 class="mb-0">📋 Status Kegiatan</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-6 text-center">
                                    <span class="stats-number text-info">{{ completionRatio }}%</span>
                                    <small class="text-muted d-block">Rasio Selesai vs Target</small>
                                </div>
                                <div class="col-6 text-center">
                                    <span class="stats-number text-warning">{{ incompleteTasks.length }}</span>
                                    <small class="text-muted d-block">Belum Selesai (Hari Ini)</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Forest Section -->
            <div class="row mb-4">
                <div class="col-12 ">
                  <!-- pass plant ke forest-panel -->
                  <forest-panel :title="' Taman Produktivitas '" :today-percent="todayPercent" :trees="forestTrees" :plant="plant"></forest-panel>
                </div>
            </div>

            <div class="row">
        <div class="col-md-4  mb-4">
          <div class="card dashboard-card dashboard-card--list card-accent card-accent--violet">
                        <div class="card-header py-3">
                            <h5 class="mb-0">📋 Tugas Belum Selesai</h5>
                        </div>
                        <div class="card-body">
                            <div v-if="incompleteTasks.length === 0" class="text-center text-muted">
                                🎉 Semua tugas hari ini sudah selesai!
                            </div>
                            <div v-else>
                                <div v-for="task in sortedIncompleteTasks" :key="task.id" 
                                     class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded"
                                     :class="'priority-' + (task.priority || 'sedang')">
                                    <div>
                                        <small class="fw-bold">{{ task.task_name }}</small><br>
                                        <span class="badge" :class="getPriorityBadgeClass(task.priority)">{{ task.priority || 'sedang' }}</span>
                                    </div>
                                </div>
                            </div>
                            <small class="text-muted d-block mt-2">Target (template) hari ini: {{ templateTargetCount }}</small>
                        </div>
                    </div>
                </div>
        <div class="col-md-8">
          <div class="card dashboard-card dashboard-card--chart card-accent card-accent--primary">
                        <div class="card-header py-3 d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">📈 Perubahan Skor</h5>
                            <div class="btn-group" role="group">
                                <button class="btn btn-sm" :class="chartRangeDays===7 ? 'btn-primary' : 'btn-outline-primary'" @click="changeRange(7)">7 Hari</button>
                                <button class="btn btn-sm" :class="chartRangeDays===30 ? 'btn-primary' : 'btn-outline-primary'" @click="changeRange(30)">30 Hari</button>
                            </div>
                        </div>
                        <div class="card-body" style="height: 260px;">
                            <canvas id="weeklyChart" height="220"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
  async mounted() {
    await this.loadDashboardData();
    await this.loadScoresRange(this.chartRangeDays);
    await this.loadForestData(this.forestDaysRange);
    this.renderChart();

    // Refresh chart when theme changes (dark/light)
    const target = document.documentElement || document.body;
    this.themeObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "data-bs-theme") {
          this.renderChart();
          break;
        }
      }
    });
    this.themeObserver.observe(target, { attributes: true, attributeFilter: ["data-bs-theme"] });
  },
  beforeDestroy() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
    if (this.themeObserver) {
      this.themeObserver.disconnect();
      this.themeObserver = null;
    }
  },
  computed: {
    // Persentase pohon untuk hari ini
    todayPercent() {
      return this.templateTargetCount > 0 ? this.completionRatio : 0;
    },
    sortedIncompleteTasks() {
      const order = { tinggi: 3, sedang: 2, rendah: 1 };
      return [...(this.incompleteTasks || [])].sort((a, b) => {
        const ap = order[a.priority || "sedang"] || 2;
        const bp = order[b.priority || "sedang"] || 2;
        return bp - ap; // tinggi -> sedang -> rendah
      });
    },
  },
  methods: {
    async loadDashboardData() {
      try {
        const today = window.WITA && window.WITA.today ? window.WITA.today() : new Date().toISOString().slice(0, 10);

        // Skor hari ini
        const { data: todayScoreData } = await this.supabase
          .from("score_log")
          .select("score_delta")
          .eq("user_id", this.user.id)
          .eq("date", today);
        this.todayScore = (todayScoreData || []).reduce((s, r) => s + (r.score_delta || 0), 0);

        // Total skor
        const { data: totalScoreData } = await this.supabase
          .from("score_log")
          .select("score_delta")
          .eq("user_id", this.user.id);
        this.totalScore = (totalScoreData || []).reduce((s, r) => s + (r.score_delta || 0), 0);

        // Task hari ini
        const { data: todayTasksData } = await this.supabase
          .from("daily_tasks_instance")
          .select("*")
          .eq("user_id", this.user.id)
          .eq("date", today);
        this.todayTasks = todayTasksData || [];
        this.incompleteTasks = this.todayTasks.filter((t) => !t.is_completed);

        // Rasio selesai vs target (hanya dari template/ada task_id)
        const templateTasks = this.todayTasks.filter((t) => !!t.task_id);
        this.templateTargetCount = templateTasks.length;
        if (templateTasks.length > 0) {
          const completed = templateTasks.filter((t) => t.is_completed).length;
          this.completionRatio = Math.round((completed / templateTasks.length) * 100);
        } else {
          this.completionRatio = 0;
        }

        this.loading = false;
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        this.loading = false;
      }
    },

    // Mengisi data untuk hutan virtual: HANYA bulan berjalan (current month)
    async loadForestData(days) {
      try {
        const endStr = window.WITA && window.WITA.today ? window.WITA.today() : new Date().toISOString().slice(0, 10);
        const parts =
          window.WITA && window.WITA.nowParts
            ? window.WITA.nowParts()
            : (() => {
                const d = new Date(endStr);
                return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
              })();
        const startStr =
          window.WITA && window.WITA.monthStartIso
            ? window.WITA.monthStartIso(parts.year, parts.month - 1)
            : `${parts.year}-${String(parts.month).padStart(2, "0")}-01`;

        const diffDays = Math.floor((Date.parse(endStr) - Date.parse(startStr)) / 86400000) + 1;

        const { data, error } = await this.supabase
          .from("daily_tasks_instance")
          .select("date, is_completed, task_id")
          .eq("user_id", this.user.id)
          .gte("date", startStr)
          .lte("date", endStr);

        if (error) throw error;

        const counters = new Map();
        for (let i = 0; i < diffDays; i++) {
          const key =
            window.WITA && window.WITA.advanceIso
              ? window.WITA.advanceIso(startStr, i)
              : new Date(Date.parse(startStr) + i * 86400000).toISOString().slice(0, 10);
          counters.set(key, { done: 0, total: 0 });
        }

        (data || []).forEach((row) => {
          if (!row.task_id) return;
          const key = row.date;
          if (!counters.has(key)) return;
          const c = counters.get(key) || { done: 0, total: 0 };
          c.total += 1;
          if (row.is_completed) c.done += 1;
          counters.set(key, c);
        });

        const treesAsc = [];
        counters.forEach((c, dateStr) => {
          const percent = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
          treesAsc.push({ date: dateStr, percent });
        });

        treesAsc.sort((a, b) => (a.date < b.date ? 1 : -1));

        this.forestTrees = treesAsc;
      } catch (e) {
        console.error("Error loadForestData:", e);
        this.forestTrees = [];
      }
    },

    async loadScoresRange(days) {
      try {
        const endStr = window.WITA && window.WITA.today ? window.WITA.today() : new Date().toISOString().slice(0, 10);
        const startStr = window.WITA && window.WITA.advanceIso ? window.WITA.advanceIso(endStr, -(days - 1)) : endStr;

        const { data, error } = await this.supabase
          .from("score_log")
          .select("date, score_delta")
          .eq("user_id", this.user.id)
          .gte("date", startStr)
          .lte("date", endStr);
        if (error) throw error;

        const map = new Map();
        for (let i = 0; i < days; i++) {
          const key = window.WITA && window.WITA.advanceIso ? window.WITA.advanceIso(startStr, i) : startStr;
          map.set(key, 0);
        }
        (data || []).forEach((r) => {
          map.set(r.date, (map.get(r.date) || 0) + (r.score_delta || 0));
        });
        const dates = [];
        const scores = [];
        for (const [dateStr, val] of map.entries()) {
          dates.push(new Date(dateStr).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" }));
          scores.push(val);
        }
        this.weeklyScores = { dates, scores };
      } catch (e) {
        console.error("Error loadScoresRange:", e);
        this.weeklyScores = { dates: [], scores: [] };
      }
    },

    changeRange(days) {
      if (this.chartRangeDays === days) return;
      this.chartRangeDays = days;
      this.loadScoresRange(days).then(() => this.renderChart());
    },

    renderChart() {
      this.$nextTick(() => {
        const ctx = document.getElementById("weeklyChart");
        if (!ctx) return;
        if (this.chartInstance) {
          this.chartInstance.destroy();
          this.chartInstance = null;
        }

        const isDark =
          (document.documentElement && document.documentElement.getAttribute("data-bs-theme") === "dark") ||
          (document.body && document.body.getAttribute && document.body.getAttribute("data-bs-theme") === "dark");
        const gridY = isDark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.08)";
        const gridX = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)";
        const tickColor = isDark ? "#cbd5e1" : "#475569";
        const lineColor = isDark ? "#60a5fa" : "#0d6efd";
        const fillColor = isDark ? "rgba(96,165,250,0.18)" : "rgba(13,110,253,0.1)";

        this.chartInstance = new Chart(ctx, {
          type: "line",
          data: {
            labels: this.weeklyScores.dates,
            datasets: [
              {
                label: "Skor Harian",
                data: this.weeklyScores.scores,
                borderColor: lineColor,
                backgroundColor: fillColor,
                tension: 0.35,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, grid: { color: gridY }, ticks: { color: tickColor } },
              x: { grid: { color: gridX }, ticks: { color: tickColor } },
            },
            plugins: { legend: { display: false } },
          },
        });
      });
    },

    getPriorityBadgeClass(priority) {
      const classes = { tinggi: "bg-danger", sedang: "bg-warning text-dark", rendah: "bg-success" };
      return classes[priority] || "bg-secondary";
    },
  },
});
