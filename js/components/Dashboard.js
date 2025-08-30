Vue.component("dashboard", {
  props: ["user", "supabase", "dailyQuote"],
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
      canPlayVideo: true,
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

            <!-- Plant Scene Section -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">🌱 Taman Produktivitas</h5>
                            <span class="badge" :class="templateTargetCount > 0 ? 'bg-success' : 'bg-secondary'">
                                {{ completionPercent }}%
                            </span>
                        </div>
                        <div class="card-body">
              <div class="plant-scene-wrap">
                <video v-if="plantIsVideo && canPlayVideo" class="plant-scene w-100 rounded" :key="plantSceneSrc" autoplay muted loop playsinline preload="auto" @error="canPlayVideo=false">
                                  <source :src="plantSceneSrc" type="video/mp4" />
                                  Browser Anda tidak mendukung video.
                                </video>
                <img v-else :src="plantIsVideo ? plantFallbackImageSrc : plantSceneSrc" alt="Ilustrasi tingkat produktivitas" class="plant-scene img-fluid rounded"/>
                            </div>
                            <small class="text-muted d-block mt-2">Ilustrasi berubah sesuai persentase penyelesaian tugas dari template.</small>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mb-4">
                <div class="col-md-6 mb-3">
                    <div class="card stats-card">
                        <div class="card-header">
                            <h6 class="mb-0">📊 Skor Produktivitas</h6>
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
                    <div class="card stats-card">
                        <div class="card-header">
                            <h6 class="mb-0">📋 Status Tugas</h6>
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

            

            <div class="row">
                <div class="col-md-8 mb-4">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
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
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">📋 Tugas Belum Selesai</h5>
                        </div>
                        <div class="card-body">
                            <div v-if="incompleteTasks.length === 0" class="text-center text-muted">
                                🎉 Semua tugas hari ini sudah selesai!
                            </div>
                            <div v-else>
                                <div v-for="task in incompleteTasks" :key="task.id" 
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
            </div>
        </div>
    `,
  async mounted() {
    await this.loadDashboardData();
    await this.loadScoresRange(this.chartRangeDays);
    this.renderChart();
  },
  computed: {
    completionPercent() {
      // Gunakan rasio yang sudah dihitung dari template; fallback ke 0
      return this.templateTargetCount > 0 ? this.completionRatio : 0;
    },
    plantSceneSrc() {
      const p = this.completionPercent;
      const scene = this.sceneFor(p);
      return `assets/plants/${scene}`;
    },
    plantIsVideo() {
      return this.plantSceneSrc.toLowerCase().endsWith(".mp4");
    },
    plantFallbackImageSrc() {
      // Mapping fallback untuk kasus khusus plant0.mp4 -> plant-0-dead.png
      const src = this.plantSceneSrc;
      if (src.toLowerCase().endsWith("plant0.mp4")) {
        return "assets/plants/plant-0-dead.png";
      }
      // Fallback umum: ganti ekstensi .mp4 menjadi .png (jika ada)
      return src.replace(/\.mp4$/i, ".png");
    },
  },
  watch: {
    plantSceneSrc() {
      // Reset agar mencoba memutar video saat sumber berubah
      this.canPlayVideo = true;
    },
  },
  methods: {
    sceneFor(percent) {
      if (percent <= 10) return "plant0.mp4";
      if (percent <= 25) return "plant-1-wilted.png";
      if (percent <= 50) return "plant-2-growing.png";
      if (percent <= 89) return "plant-3-better.png";
      return "plant-4-perfect.png";
    },
    async loadDashboardData() {
      try {
        const today = new Date().toISOString().split("T")[0];

        // Skor hari ini (score_log) sekali query
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

        // Rasio selesai vs target (hanya yang dari template)
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

    async loadScoresRange(days) {
      try {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (days - 1));
        const startStr = start.toISOString().split("T")[0];
        const endStr = end.toISOString().split("T")[0];

        const { data, error } = await this.supabase
          .from("score_log")
          .select("date, score_delta")
          .eq("user_id", this.user.id)
          .gte("date", startStr)
          .lte("date", endStr);
        if (error) throw error;

        // Agregasi skor per hari
        const map = new Map();
        for (let i = 0; i < days; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          map.set(d.toISOString().split("T")[0], 0);
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
        this.chartInstance = new Chart(ctx, {
          type: "line",
          data: {
            labels: this.weeklyScores.dates,
            datasets: [
              {
                label: "Skor Harian",
                data: this.weeklyScores.scores,
                borderColor: "#0d6efd",
                backgroundColor: "rgba(13, 110, 253, 0.1)",
                tension: 0.35,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.08)" } },
              x: { grid: { color: "rgba(0,0,0,0.04)" } },
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
