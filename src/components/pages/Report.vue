<template>
  <div class="report-page fade-in">
    <div class="d-flex justify-content-between align-items-center mt-3 mb-3">
      <h4>📊 Laporan Produktivitas</h4>
      <button
        class="btn btn-sm btn-outline-primary"
        data-export-btn
        @click="exportReport"
        title="Export PDF laporan bulan ini"
      >
        ⭳ Export PDF
      </button>
    </div>

    <div class="d-flex align-items-center gap-2 mb-3">
      <button class="btn btn-outline-secondary btn-sm" @click="prevMonth" title="Bulan sebelumnya">
        ⟨
      </button>
      <select class="form-select" v-model="currentMonth" @change="loadMonthlyReport">
        <option v-for="(month, index) in monthNames" :key="index" :value="index">
          {{ month }}
        </option>
      </select>
      <select class="form-select" v-model="currentYear" @change="loadMonthlyReport">
        <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
      </select>
      <button class="btn btn-outline-secondary btn-sm" @click="nextMonth" title="Bulan berikutnya">
        ⟩
      </button>
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
          <div
            class="card report-metric metric-primary text-dark border-0 h-100 dashboard-card card-accent card-accent--primary"
          >
            <div class="card-body text-center py-3">
              <div class="fs-5 fw-bold">{{ monthlyData.totalTasks }}</div>
              <small class="text-dark">Total Task</small>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div
            class="card report-metric metric-success text-dark border-0 h-100 dashboard-card card-accent card-accent--success"
          >
            <div class="card-body text-center py-3">
              <div class="fs-5 fw-bold">{{ monthlyData.completedTasks }}</div>
              <small class="text-dark">Task Selesai</small>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div
            class="card report-metric metric-warning text-dark border-0 h-100 dashboard-card card-accent card-accent--warning"
          >
            <div class="card-body text-center py-3">
              <div class="fs-5 fw-bold">{{ monthlyData.incompleteTasks }}</div>
              <small class="text-dark">Belum Selesai</small>
            </div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div
            class="card report-metric metric-score text-dark border-0 h-100 dashboard-card card-accent card-accent--violet"
          >
            <div class="card-body text-center py-3">
              <div class="fs-5 fw-bold" :class="monthlyData.totalScore >= 0 ? '' : ''">
                {{ monthlyData.totalScore >= 0 ? '+' : '' }}{{ monthlyData.totalScore }}
              </div>
              <small class="text-dark">Total Skor</small>
            </div>
          </div>
        </div>
      </div>

      <!-- Completion Rate -->
      <div class="col-12 mb-3">
        <div class="card report-card border-0 shadow-sm">
          <div class="card-header bg-whiter">
            <h5 class="mb-0">📈 Tingkat Penyelesaian</h5>
          </div>
          <div class="card-body text-center">
            <div
              class="display-5 mb-3"
              :class="
                completionRate >= 80
                  ? 'text-success'
                  : completionRate >= 60
                    ? 'text-warning'
                    : 'text-danger'
              "
            >
              {{ completionRate }}%
            </div>
            <div class="progress mb-2" style="height: 10px">
              <div
                class="progress-bar"
                :class="
                  completionRate >= 80
                    ? 'bg-success'
                    : completionRate >= 60
                      ? 'bg-warning'
                      : 'bg-danger'
                "
                :style="{ width: completionRate + '%' }"
                role="progressbar"
                :aria-valuenow="completionRate"
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
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
          :plant="plant"
        >
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
              <div v-if="monthlyData.activityStats.length === 0" class="text-center text-muted">
                Belum ada data kegiatan pada bulan ini.
              </div>
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
                          <div class="progress flex-grow-1" style="height: 8px">
                            <div
                              class="progress-bar"
                              :class="
                                act.percent >= 80
                                  ? 'bg-success'
                                  : act.percent >= 60
                                    ? 'bg-warning'
                                    : 'bg-danger'
                              "
                              :style="{ width: act.percent + '%' }"
                            ></div>
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
        <div class="col-12 col-xl-5 mb-3">
          <div
            class="card dashboard-card card-accent card-accent--warning report-card border-0 shadow-sm h-100"
          >
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
</template>

<script>
export default {
  name: 'Report',
  props: ['user', 'supabase', 'plant'],
  data() {
    return {
      currentMonth:
        window.WITA && window.WITA.nowParts
          ? window.WITA.nowParts().month - 1
          : new Date().getMonth(),
      currentYear:
        window.WITA && window.WITA.nowParts
          ? window.WITA.nowParts().year
          : new Date().getFullYear(),
      monthlyData: {
        totalTasks: 0,
        completedTasks: 0,
        incompleteTasks: 0,
        totalScore: 0,
        dailyStats: [],
        activityStats: [],
        forestTrees: [],
        forestAvgPercent: 0,
      },
      loading: false,
      chartInstance: null,
      taskDistributionChartInstance: null,
      dailyPerformanceChartInstance: null,
    };
  },
  computed: {
    monthNames() {
      return [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
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

        const { data: tasksData, error: tasksError } = await this.supabase
          .from('daily_tasks_instance')
          .select('*')
          .eq('user_id', this.user.id)
          .gte('date', startDate)
          .lte('date', endDate);
        if (tasksError) throw tasksError;

        const { data: scoresData, error: scoresError } = await this.supabase
          .from('score_log')
          .select('*')
          .eq('user_id', this.user.id)
          .gte('date', startDate)
          .lte('date', endDate);
        if (scoresError) throw scoresError;

        this.processMonthlyData(tasksData || [], scoresData || []);
        this.$nextTick(() => {
          this.renderCharts();
        });
      } catch (error) {
        console.error('Error loading monthly report:', error);
        alert('Gagal memuat laporan: ' + error.message);
      } finally {
        this.loading = false;
      }
    },
    async exportReport() {
      const btn = this.$el.querySelector('[data-export-btn]');
      const prevDisplay = btn ? btn.style.display : null;
      let restoreVideos;
      try {
        if (typeof window.html2pdf === 'undefined') {
          await this._loadScript(
            'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
          );
          if (typeof window.html2pdf === 'undefined') throw new Error('html2pdf gagal dimuat');
        }
        const container = this.$el;
        if (!container) return alert('Elemen laporan tidak ditemukan.');
        restoreVideos = this._swapVideosForImages(container);
        if (btn) btn.style.display = 'none';
        const year = this.currentYear;
        const monthName = this.monthNames[this.currentMonth];
        const opt = {
          margin: 10,
          filename: `Laporan-Produktivitas-${monthName}-${year}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            imageTimeout: 15000,
            logging: false,
          },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        };
        await window.html2pdf().set(opt).from(container).save();
      } catch (error) {
        console.error('Export PDF error:', error);
        alert('Gagal export PDF: ' + (error?.message || error));
      } finally {
        if (btn) btn.style.display = prevDisplay;
        if (typeof restoreVideos === 'function')
          try {
            restoreVideos();
          } catch (_) {}
      }
    },
    _loadScript(src) {
      return new Promise((resolve, reject) => {
        try {
          const s = document.createElement('script');
          s.src = src;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Failed to load script'));
          document.head.appendChild(s);
        } catch (e) {
          reject(e);
        }
      });
    },
    _swapVideosForImages(container) {
      const replacements = [];
      try {
        const videos = container.querySelectorAll('video');
        videos.forEach((v) => {
          const img = document.createElement('img');
          img.className = v.className || '';
          const poster = v.getAttribute('poster') || '';
          img.src = poster || '/src/asset/forest/plant-3-better.png';
          img.alt = v.getAttribute('alt') || '';
          img.style.cssText = v.style.cssText;
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
      const tasksByDate = {};
      (tasksData || []).forEach((task) => {
        if (!tasksByDate[task.date]) tasksByDate[task.date] = [];
        tasksByDate[task.date].push(task);
      });
      const scoresByDate = {};
      (scoresData || []).forEach((score) => {
        if (!scoresByDate[score.date]) scoresByDate[score.date] = 0;
        scoresByDate[score.date] += score.score_delta;
      });
      const dailyStats = [];
      let totalTasks = 0;
      let completedTasks = 0;
      let totalScore = 0;
      const year = this.currentYear;
      const month = this.currentMonth;
      const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(Date.UTC(year, month, day)).toISOString().split('T')[0];
        const dayTasks = tasksByDate[date] || [];
        const dayCompleted = dayTasks.filter((t) => t.is_completed).length;
        const dayScore = scoresByDate[date] || 0;
        const dayStats = {
          date: date,
          totalTasks: dayTasks.length,
          completedTasks: dayCompleted,
          incompleteTasks: dayTasks.length - dayCompleted,
          completionRate:
            dayTasks.length > 0 ? Math.round((dayCompleted / dayTasks.length) * 100) : 0,
          score: dayScore,
        };
        dailyStats.push(dayStats);
        totalTasks += dayTasks.length;
        completedTasks += dayCompleted;
        totalScore += dayScore;
      }
      const activityMap = new Map();
      (tasksData || []).forEach((t) => {
        const key = t.task_id ? `tpl:${t.task_id}` : `adhoc:${t.task_name}`;
        const entry = activityMap.get(key) || {
          key,
          name: t.task_name || '(Tanpa Nama)',
          type: t.task_id ? 'Kegiatan harian' : 'Kegiatan tambahan',
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
      const nowParts = window.WITA && window.WITA.nowParts ? window.WITA.nowParts() : null;
      const isCurrentMonth = nowParts && nowParts.year === year && nowParts.month - 1 === month;
      const endDay = isCurrentMonth ? nowParts.day : daysInMonth;
      const counters = new Map();
      for (let d = 1; d <= endDay; d++) {
        const iso = new Date(Date.UTC(year, month, d)).toISOString().slice(0, 10);
        counters.set(iso, { done: 0, total: 0 });
      }
      (tasksData || []).forEach((t) => {
        if (!t.task_id) return;
        const key = t.date;
        if (!counters.has(key)) return;
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
      this.$nextTick(() => {
        const ctx = document.getElementById('taskDistributionChart');
        if (!ctx) return;
        if (this.taskDistributionChartInstance) {
          this.taskDistributionChartInstance.destroy();
          this.taskDistributionChartInstance = null;
        }
        const ChartLib = window.Chart;
        if (!ChartLib) return;
        this.taskDistributionChartInstance = new ChartLib(ctx, {
          type: 'doughnut',
          data: this.taskDistributionData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
          },
        });
      });
    },
    renderDailyPerformanceChart() {
      this.$nextTick(() => {
        const ctx = document.getElementById('dailyPerformanceChart');
        if (!ctx) return;
        if (this.dailyPerformanceChartInstance) {
          this.dailyPerformanceChartInstance.destroy();
          this.dailyPerformanceChartInstance = null;
        }
        const ChartLib = window.Chart;
        if (!ChartLib) return;
        this.dailyPerformanceChartInstance = new ChartLib(ctx, {
          type: 'bar',
          data: this.dailyPerformanceData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
          },
        });
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
    getCompletionMessage() {
      const rate = this.completionRate;
      if (rate >= 90) return '🏆 Luar biasa! Konsistensi tinggi!';
      if (rate >= 80) return '⭐ Sangat baik! Terus pertahankan!';
      if (rate >= 70) return '👍 Bagus! Sedikit lagi sempurna!';
      if (rate >= 60) return '💪 Cukup baik, bisa ditingkatkan!';
      if (rate >= 50) return '⚡ Perlu fokus lebih pada penyelesaian!';
      return '🚀 Mari tingkatkan produktivitas!';
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      });
    },
  },
};
</script>
