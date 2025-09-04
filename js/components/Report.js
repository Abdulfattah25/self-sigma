Vue.component("report", {
  props: ["user", "supabase", "plant"],
  data() {
    return {
      currentMonth: window.WITA && window.WITA.nowParts ? window.WITA.nowParts().month - 1 : new Date().getMonth(),
      currentYear: window.WITA && window.WITA.nowParts ? window.WITA.nowParts().year : new Date().getFullYear(),
      monthlyData: {
        totalTasks: 0,
        completedTasks: 0,
        incompleteTasks: 0,
        totalScore: 0,
        dailyStats: [],
        activityStats: [], // agregasi konsistensi per kegiatan
        forestTrees: [], // data taman produktivitas untuk bulan yang dipilih
        forestAvgPercent: 0,
      },
      loading: false,
      chartInstance: null,
      taskDistributionChartInstance: null,
      dailyPerformanceChartInstance: null,
    };
  },
  template: `
        <div class="report-page fade-in">
            <div class="d-flex justify-content-between align-items-center mt-3 mb-3">
                <h4>📊 Laporan Produktivitas</h4>
                <button class="btn btn-sm btn-outline-primary" data-export-btn @click="exportReport" title="Export PDF laporan bulan ini">
                  ⭳ Export PDF
                </button>
            </div>
            
             <div class="d-flex align-items-center gap-2 mb-3">
                    <button class="btn btn-outline-secondary btn-sm" @click="prevMonth" title="Bulan sebelumnya">⟨</button>
                    <select class="form-select" v-model="currentMonth" @change="loadMonthlyReport">
                        <option v-for="(month, index) in monthNames" :key="index" :value="index">{{ month }}</option>
                    </select>
                    <select class="form-select" v-model="currentYear" @change="loadMonthlyReport">
                        <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                    </select>
                    <button class="btn btn-outline-secondary btn-sm" @click="nextMonth" title="Bulan berikutnya">⟩</button>
                </div>
         

            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Memuat laporan...</p>
            </div>

            <div v-else>
                <!-- Summary Cards -->
                <div class="row g-3 mb-4">
                    <div class="col-6 col-md-3">
                        <div class="card report-metric metric-primary text-dark border-0 h-100 dashboard-card card-accent card-accent--primary">
                            <div class="card-body text-center py-3">
                                <div class="fs-5 fw-bold">{{ monthlyData.totalTasks }}</div>
                                <small class="text-muted">Total Task</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="card report-metric metric-success text-dark border-0 h-100 dashboard-card card-accent card-accent--success">
                            <div class="card-body text-center py-3">
                                <div class="fs-5 fw-bold">{{ monthlyData.completedTasks }}</div>
                                <small class="text-muted">Task Selesai</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="card report-metric metric-warning text-dark border-0 h-100 dashboard-card card-accent card-accent--warning">
                            <div class="card-body text-center py-3">
                                <div class="fs-5 fw-bold">{{ monthlyData.incompleteTasks }}</div>
                                <small class="text-muted">Belum Selesai</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-6 col-md-3">
                        <div class="card report-metric metric-score text-dark border-0 h-100 dashboard-card card-accent card-accent--violet">
                            <div class="card-body text-center py-3">
                                <div class="fs-5 fw-bold" :class="monthlyData.totalScore >= 0 ? '' : ''">
                                    {{ monthlyData.totalScore >= 0 ? '+' : '' }}{{ monthlyData.totalScore }}
                                </div>
                                <small class="text-muted">Total Skor</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Completion Rate -->
                  <div class="col-12 mb-3">
                    <div class="card  report-card border-0 shadow-sm">
                      <div class="card-header bg-whiter ">
                        <h5 class="mb-0">📈 Tingkat Penyelesaian</h5>
                      </div>
                      <div class="card-body text-center">
                        <div class="display-5 mb-3" :class="completionRate >= 80 ? 'text-success' : completionRate >= 60 ? 'text-warning' : 'text-danger'">
                          {{ completionRate }}%
                        </div>
                        <div class="progress mb-2" style="height: 10px;">
                          <div class="progress-bar" :class="completionRate >= 80 ? 'bg-success' : completionRate >= 60 ? 'bg-warning' : 'bg-danger'"
                               :style="{ width: completionRate + '%' }" role="progressbar" :aria-valuenow="completionRate" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                        <p class="text-muted mb-0">{{ getCompletionMessage() }}</p>
                      </div>
                    </div>
                  </div>                

                <!-- Taman Produktivitas (History Bulan Dipilih) -->
      <div class="mb-4">
        <forest-panel
          :title="' Taman Produktivitas '"
          :today-percent="monthlyData.forestAvgPercent"
          :trees="monthlyData.forestTrees"
          :show-today-tile="false"
          :plant="plant">
        </forest-panel>
      </div>

                <!-- Konsistensi Kegiatan Bulan Ini -->               
                
                <div class="row mb-3">
                <div class="col-12 col-xl-7">
                  <div class="card mb-4 dashboard-card card-accent card-accent--success">
                  <div class="card-header text-center bg-whiter">
                    <h5 class="mb-0">📌 Konsistensi Kegiatan Bulan Ini</h5>
                    <small class="text-muted">Persentase dikerjakan dan jumlah dikerjakan/tidak</small>
                  </div>
                  <div class="card-body">
                    <div v-if="monthlyData.activityStats.length === 0" class="text-center text-muted">Belum ada data kegiatan pada bulan ini.</div>
                    <div v-else class="table-responsive consistency-table">
                      <table class="table table-sm align-middle">
                        <thead>
                          <tr>
                            <th class="col-activity">Kegiatan</th>
                            <th class="text-center">Total</th>
                            <th class="text-center">Dikerjakan</th>
                            <th class="text-center">Tidak</th>
                            <th class="text-center col-percent">Persentase</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="act in monthlyData.activityStats" :key="act.key">
                            <td class="col-activity">
                              <div class="fw-semibold">{{ act.name }}</div>
                              <small class="text-muted">{{ act.type }}</small>
                            </td>
                            <td class="text-center">{{ act.total }}</td>
                            <td class="text-center text-success">{{ act.completed }}</td>
                            <td class="text-center text-warning">{{ act.notCompleted }}</td>
                            <td class="text-center col-percent">
                              <div class="d-flex align-items-center gap-2">
                                <div class="progress flex-grow-1" style="height:8px;">
                                  <div class="progress-bar" :class="act.percent >= 80 ? 'bg-success' : act.percent >= 60 ? 'bg-warning' : 'bg-danger'" :style="{ width: act.percent + '%' }"></div>
                                </div>
                                <span class="small fw-bold">{{ act.percent }}%</span>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                </div>

                  <!-- Detailed Table -->
                  <div class="col-12 col-xl-5">
                    <div class="card dashboard-card card-accent card-accent--warning report-card border-0 shadow-sm h-100">
                      <div class="card-header bg-whiter text-center">
                        <h5 class="mb-0">📋 Detail Skor Harian</h5>
                        <small class="text-muted">Jumlah skor yang didapatkan setiap harinya</small>
                      </div>
                      <div class="card-body">
                        <div class="table-responsive detail">
                          <table class="table table-striped table-sm text-center">
                            <thead>
                              <tr>
                                <th>Tanggal</th>
                                <th>Total</th>
                                <th>Selesai</th>
                                <th>Belum</th>
                                <th>Skor</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="day in monthlyData.dailyStats" :key="day.date">
                                <td>{{ formatDate(day.date) }}</td>
                                <td>{{ day.totalTasks }}</td>
                                <td class="text-success">{{ day.completedTasks }}</td>
                                <td class="text-warning">{{ day.incompleteTasks }}</td>
                                <td :class="day.score >= 0 ? 'text-success' : 'text-danger'">
                                  {{ day.score >= 0 ? '+' : '' }}{{ day.score }}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
        </div>
    `,
  computed: {
    monthNames() {
      return [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ];
    },

    availableYears() {
      const currentYear = new Date().getFullYear();
      return [currentYear - 1, currentYear, currentYear + 1];
    },

    completionRate() {
      if (this.monthlyData.totalTasks === 0) return 0;
      return Math.round((this.monthlyData.completedTasks / this.monthlyData.totalTasks) * 100);
    },

    calendarWeeks() {
      const year = this.currentYear;
      const month = this.currentMonth;
      const firstDay = new Date(`${year}-${("0" + (month + 1)).slice(-2)}-01T00:00:00Z`);
      const lastDay = new Date(`${year}-${("0" + (month + 1)).slice(-2)}-01T00:00:00Z`);
      lastDay.setUTCMonth(lastDay.getUTCMonth() + 1);
      lastDay.setUTCDate(0);

      const weeks = [];
      let currentWeek = [];
      let weekNumber = 1;

      // Add empty cells for days before month starts
      const startDayOfWeek = firstDay.getDay();
      for (let i = 0; i < startDayOfWeek; i++) {
        currentWeek.push({ date: null, day: "", score: 0 });
      }

      // Add all days of the month
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(Date.UTC(year, month, day));
        const dateStr = date.toISOString().split("T")[0];
        const dayData = this.monthlyData.dailyStats.find((d) => d.date === dateStr);

        currentWeek.push({
          date: dateStr,
          day: day,
          score: dayData ? dayData.score : 0,
          completionRate: dayData ? dayData.completionRate : 0,
          totalTasks: dayData ? dayData.totalTasks : 0,
        });

        // Start new week on Sunday
        if (date.getDay() === 6 || day === lastDay.getDate()) {
          // Fill remaining days of week
          while (currentWeek.length < 7) {
            currentWeek.push({ date: null, day: "", score: 0 });
          }

          weeks.push({
            weekNumber: weekNumber++,
            days: [...currentWeek],
          });
          currentWeek = [];
        }
      }

      return weeks;
    },
  },

  async mounted() {
    await this.loadMonthlyReport();
  },

  methods: {
    async loadMonthlyReport() {
      try {
        this.loading = true;

        const startDate =
          window.WITA && window.WITA.monthStartIso
            ? window.WITA.monthStartIso(this.currentYear, this.currentMonth)
            : new Date(this.currentYear, this.currentMonth, 1).toISOString().slice(0, 10);
        const endDate =
          window.WITA && window.WITA.monthEndIso
            ? window.WITA.monthEndIso(this.currentYear, this.currentMonth)
            : new Date(this.currentYear, this.currentMonth + 1, 0).toISOString().slice(0, 10);

        // Load daily tasks for the month
        const { data: tasksData, error: tasksError } = await this.supabase
          .from("daily_tasks_instance")
          .select("*")
          .eq("user_id", this.user.id)
          .gte("date", startDate)
          .lte("date", endDate);

        if (tasksError) throw tasksError;

        // Load score logs for the month
        const { data: scoresData, error: scoresError } = await this.supabase
          .from("score_log")
          .select("*")
          .eq("user_id", this.user.id)
          .gte("date", startDate)
          .lte("date", endDate);

        if (scoresError) throw scoresError;

        // Process data
        this.processMonthlyData(tasksData || [], scoresData || []);

        // Render charts
        this.$nextTick(() => {
          this.renderCharts();
        });
      } catch (error) {
        console.error("Error loading monthly report:", error);
        alert("Gagal memuat laporan: " + error.message);
      } finally {
        this.loading = false;
      }
    },

    async exportReport() {
      const btn = this.$el.querySelector("[data-export-btn]");
      const prevDisplay = btn ? btn.style.display : null;
      let restoreVideos;
      try {
        // Ensure html2pdf is available (lazy load if needed)
        if (typeof html2pdf === "undefined") {
          await this._loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js");
          if (typeof html2pdf === "undefined") throw new Error("html2pdf gagal dimuat");
        }

        const container = this.$el; // root element of this component
        if (!container) return alert("Elemen laporan tidak ditemukan.");

        // Replace any <video> with <img> poster (legacy safety)
        restoreVideos = this._swapVideosForImages(container);

        if (btn) btn.style.display = "none";

        const year = this.currentYear;
        const monthName = this.monthNames[this.currentMonth];
        const isAllowedImg = (src) => {
          if (!src) return false;
          const s = src.toLowerCase();
          return s.startsWith("data:image/png") || s.startsWith("data:image/jpeg") || /\.(png|jpe?g)(\?|#|$)/i.test(s);
        };
        const opt = {
          margin: 10,
          filename: `Laporan-Produktivitas-${monthName}-${year}.pdf`,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            imageTimeout: 15000,
            logging: false,
            ignoreElements: (el) => {
              if (!el || !el.tagName) return false;
              const tag = el.tagName.toUpperCase();
              if (tag === "VIDEO") return true;
              if (tag === "IMG") {
                const src = el.getAttribute("src") || "";
                const s = src.toLowerCase();
                return !(
                  s.startsWith("data:image/png") ||
                  s.startsWith("data:image/jpeg") ||
                  /\.(png|jpe?g)(\?|#|$)/.test(s)
                );
              }
              return false;
            },
            onclone: (doc) => {
              try {
                const win = doc.defaultView || window;
                const scope = doc.querySelector(".report-page") || doc.body;
                // Remove unsupported inline IMG in clone
                scope.querySelectorAll("img").forEach((img) => {
                  const src = (img.getAttribute("src") || "").toLowerCase();
                  if (
                    !(
                      src.startsWith("data:image/png") ||
                      src.startsWith("data:image/jpeg") ||
                      /\.(png|jpe?g)(\?|#|$)/.test(src)
                    )
                  ) {
                    img.parentNode && img.parentNode.removeChild(img);
                  }
                });
                // Strip any background/mask images globally to avoid unsupported formats
                const style = doc.createElement("style");
                style.textContent = `
                  *, *::before, *::after { background-image: none !important; -webkit-mask-image: none !important; mask-image: none !important; }
                `;
                doc.head.appendChild(style);
                // Additionally clear inline background-image urls that were set via style attributes
                scope.querySelectorAll("*").forEach((node) => {
                  try {
                    if (node.style && node.style.backgroundImage) node.style.backgroundImage = "none";
                    if (node.style && (node.style.webkitMaskImage || node.style.maskImage)) {
                      node.style.webkitMaskImage = "none";
                      node.style.maskImage = "none";
                    }
                  } catch {}
                });
              } catch {}
            },
          },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        };
        await html2pdf().set(opt).from(container).save();
      } catch (e) {
        console.error("Export PDF failed:", e);
        alert("Gagal mengekspor PDF.");
      } finally {
        if (btn) btn.style.display = prevDisplay;
        if (typeof restoreVideos === "function") {
          try {
            restoreVideos();
          } catch {}
        }
      }
    },

    _loadScript(src) {
      return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
          if (typeof html2pdf !== "undefined") return resolve();
          existing.addEventListener("load", () => resolve());
          existing.addEventListener("error", (e) => reject(e));
          return;
        }
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = (e) => reject(e);
        document.head.appendChild(s);
      });
    },

    // Swap all <video> elements inside container with <img> using their poster; returns a restore function
    _swapVideosForImages(container) {
      const replacements = [];
      try {
        const videos = container.querySelectorAll("video");
        videos.forEach((v) => {
          const img = document.createElement("img");
          img.className = v.className || "";
          const poster = v.getAttribute("poster") || "";
          // Fallback poster if missing
          img.src = poster || "assets/forest/plant-3-better.png";
          img.alt = v.getAttribute("alt") || "";
          img.style.cssText = v.style.cssText;
          // Ensure same sizing behavior
          img.width = v.width || undefined;
          img.height = v.height || undefined;
          if (v.parentNode) {
            v.parentNode.replaceChild(img, v);
            replacements.push({ parent: img.parentNode, img, video: v });
          }
        });
      } catch {}
      return () => {
        replacements.forEach(({ parent, img, video }) => {
          try {
            if (parent && img.parentNode === parent) parent.replaceChild(video, img);
          } catch {}
        });
      };
    },

    processMonthlyData(tasksData, scoresData) {
      // Group tasks by date
      const tasksByDate = {};
      (tasksData || []).forEach((task) => {
        if (!tasksByDate[task.date]) tasksByDate[task.date] = [];
        tasksByDate[task.date].push(task);
      });

      // Group scores by date
      const scoresByDate = {};
      (scoresData || []).forEach((score) => {
        if (!scoresByDate[score.date]) scoresByDate[score.date] = 0;
        scoresByDate[score.date] += score.score_delta;
      });

      // Calculate daily stats
      const dailyStats = [];
      let totalTasks = 0;
      let completedTasks = 0;
      let totalScore = 0;

      // Get all dates in the month
      const year = this.currentYear;
      const month = this.currentMonth;
      const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(Date.UTC(year, month, day)).toISOString().split("T")[0];
        const dayTasks = tasksByDate[date] || [];
        const dayCompleted = dayTasks.filter((t) => t.is_completed).length;
        const dayScore = scoresByDate[date] || 0;

        const dayStats = {
          date: date,
          totalTasks: dayTasks.length,
          completedTasks: dayCompleted,
          incompleteTasks: dayTasks.length - dayCompleted,
          completionRate: dayTasks.length > 0 ? Math.round((dayCompleted / dayTasks.length) * 100) : 0,
          score: dayScore,
        };

        dailyStats.push(dayStats);

        totalTasks += dayTasks.length;
        completedTasks += dayCompleted;
        totalScore += dayScore;
      }

      // Aggregate by activity (task) across the month
      const activityMap = new Map();
      (tasksData || []).forEach((t) => {
        const key = t.task_id ? `tpl:${t.task_id}` : `adhoc:${t.task_name}`;
        const entry = activityMap.get(key) || {
          key,
          name: t.task_name || "(Tanpa Nama)",
          type: t.task_id ? "Kegiatan harian" : "Kegiatan tambahan",
          total: 0,
          completed: 0,
        };
        entry.total += 1;
        if (t.is_completed) entry.completed += 1;
        activityMap.set(key, entry);
      });
      const activityStats = Array.from(activityMap.values()).map((e) => ({
        ...e,
        notCompleted: e.total - e.completed,
        percent: e.total > 0 ? Math.round((e.completed / e.total) * 100) : 0,
      }));
      activityStats.sort((a, b) => {
        if (b.percent !== a.percent) return b.percent - a.percent;
        if (b.total !== a.total) return b.total - a.total;
        return a.name.localeCompare(b.name);
      });

      // Build forest trees for selected month (template tasks only)
      const nowParts = window.WITA && window.WITA.nowParts ? window.WITA.nowParts() : null;
      const isCurrentMonth = nowParts && nowParts.year === year && nowParts.month - 1 === month;
      const endDay = isCurrentMonth ? nowParts.day : daysInMonth;
      const counters = new Map();
      for (let d = 1; d <= endDay; d++) {
        const iso = new Date(Date.UTC(year, month, d)).toISOString().slice(0, 10);
        counters.set(iso, { done: 0, total: 0 });
      }
      (tasksData || []).forEach((t) => {
        if (!t.task_id) return; // hanya task dari template
        const key = t.date;
        if (!counters.has(key)) return; // jaga-jaga hanya dalam rentang
        const c = counters.get(key);
        c.total += 1;
        if (t.is_completed) c.done += 1;
        counters.set(key, c);
      });
      const forestTrees = [];
      counters.forEach((c, dateStr) => {
        const percent = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
        forestTrees.push({ date: dateStr, percent });
      });
      // urutkan terbaru duluan agar yang terbaru tampil dulu
      forestTrees.sort((a, b) => (a.date < b.date ? 1 : -1));
      const forestAvgPercent = forestTrees.length
        ? Math.round(forestTrees.reduce((s, t) => s + (t.percent || 0), 0) / forestTrees.length)
        : 0;

      this.monthlyData = {
        totalTasks,
        completedTasks,
        incompleteTasks: totalTasks - completedTasks,
        totalScore,
        dailyStats,
        activityStats,
        forestTrees,
        forestAvgPercent,
      };
    },

    renderCharts() {
      this.renderTaskDistributionChart();
      this.renderDailyPerformanceChart();
    },

    renderTaskDistributionChart() {
      const ctx = document.getElementById("taskDistributionChart");
      if (!ctx) return;
      if (this.taskDistributionChartInstance) {
        this.taskDistributionChartInstance.destroy();
        this.taskDistributionChartInstance = null;
      }
      this.taskDistributionChartInstance = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Selesai", "Belum Selesai"],
          datasets: [
            {
              data: [this.monthlyData.completedTasks, this.monthlyData.incompleteTasks],
              backgroundColor: ["#198754", "#ffc107"],
              borderWidth: 2,
              borderColor: "#fff",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } },
        },
      });
    },

    renderDailyPerformanceChart() {
      const ctx = document.getElementById("dailyPerformanceChart");
      if (!ctx) return;
      if (this.dailyPerformanceChartInstance) {
        this.dailyPerformanceChartInstance.destroy();
        this.dailyPerformanceChartInstance = null;
      }
      const labels = this.monthlyData.dailyStats.map((day) => new Date(day.date).getDate().toString());
      const completionRates = this.monthlyData.dailyStats.map((day) => day.completionRate);
      const scores = this.monthlyData.dailyStats.map((day) => day.score);
      this.dailyPerformanceChartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Tingkat Penyelesaian (%)",
              data: completionRates,
              borderColor: "#0d6efd",
              backgroundColor: "rgba(13,110,253,0.1)",
              yAxisID: "y",
              tension: 0.35,
            },
            {
              label: "Skor Harian",
              data: scores,
              borderColor: "#198754",
              backgroundColor: "rgba(25,135,84,0.1)",
              yAxisID: "y1",
              tension: 0.35,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          scales: {
            x: { title: { display: true, text: "Tanggal" } },
            y: {
              type: "linear",
              position: "left",
              title: { display: true, text: "Tingkat Penyelesaian (%)" },
              min: 0,
              max: 100,
            },
            y1: {
              type: "linear",
              position: "right",
              title: { display: true, text: "Skor" },
              grid: { drawOnChartArea: false },
            },
          },
        },
      });
    },

    prevMonth() {
      const d = new Date(this.currentYear, this.currentMonth - 1, 1);
      this.currentYear = d.getFullYear();
      this.currentMonth = d.getMonth();
      this.loadMonthlyReport();
    },
    nextMonth() {
      const d = new Date(this.currentYear, this.currentMonth + 1, 1);
      this.currentYear = d.getFullYear();
      this.currentMonth = d.getMonth();
      this.loadMonthlyReport();
    },

    getHeatmapClass(score) {
      if (score >= 5) return "heatmap-4";
      if (score >= 3) return "heatmap-3";
      if (score >= 1) return "heatmap-2";
      if (score > -1) return "heatmap-1";
      return "heatmap-0";
    },

    getHeatmapTooltip(day) {
      if (!day.date) return "";
      return `${this.formatDate(day.date)}: ${day.totalTasks} task, ${day.completionRate}% selesai, skor ${day.score}`;
    },

    getCompletionMessage() {
      const rate = this.completionRate;
      if (rate >= 90) return "🏆 Luar biasa! Konsistensi tinggi!";
      if (rate >= 80) return "⭐ Sangat baik! Terus pertahankan!";
      if (rate >= 70) return "👍 Bagus! Sedikit lagi sempurna!";
      if (rate >= 60) return "💪 Cukup baik, bisa ditingkatkan!";
      if (rate >= 50) return "⚡ Perlu fokus lebih pada penyelesaian!";
      return "🚀 Mari tingkatkan produktivitas!";
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
    },
  },
});
