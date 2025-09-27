<template>
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
      <div class="col-md-6 mb-4">
        <div class="card stats-card dashboard-card card-accent card-accent--primary">
          <div class="card-header py-3">
            <h5 class="mb-0">📊 Skor Produktivitas</h5>
          </div>
          <div class="card-body">
            <div class="row">
              <div class="col-6 text-center">
                <span
                  class="stats-number"
                  :class="todayScore >= 0 ? 'score-positive' : 'score-negative'"
                >
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
      <div class="col-md-6 mb-4">
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
      <div class="col-12">
        <forest-panel
          :key="`forest-${plant}`"
          :title="' Taman Produktivitas '"
          :today-percent="todayPercent"
          :trees="forestTrees"
          :plant="plant"
        />
      </div>
    </div>

    <div class="row">
      <div class="col-md-4 mb-4">
        <div
          class="card stats-card dashboard-card card-accent card-accent--violet dashboard-card--list"
        >
          <div class="card-header py-3">
            <h5 class="mb-0">📋 Agenda Harian</h5>
            <small class="text-muted">Tugas harian dari template</small>
          </div>
          <div class="card-body">
            <div v-if="incompleteTasks.length === 0" class="text-center text-muted">
              🎉 Semua tugas hari ini sudah selesai!
            </div>
            <div v-else>
              <div
                v-for="task in sortedIncompleteTasks"
                :key="task.id"
                class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded"
                :class="'priority-' + (task.priority || 'sedang')"
              >
                <div class="text-start">
                  <small class="fw-bold">{{ task.task_name }}</small
                  ><br />
                  <small class="text-muted">{{ task.category || '-' }}</small>
                </div>
                <div class="text-end">
                  <div>
                    <span class="badge" :class="getPriorityBadgeClass(task.priority)">{{
                      task.priority || 'sedang'
                    }}</span>
                  </div>
                  <div class="small text-muted mt-1">
                    {{ formatDateSimple(task.deadline_date) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4 mb-4">
        <div class="card dashboard-card dashboard-card--list card-accent card-accent--success">
          <div class="card-header py-3 text-center">
            <h5 class="mb-0">📆 Agenda Mingguan</h5>
            <small class="text-muted">Tugas deadline minggu ini</small>
          </div>
          <div class="card-body">
            <div v-if="weeklyAgenda.length === 0" class="text-muted">Tidak ada deadline.</div>
            <div v-else>
              <div
                v-for="t in weeklyAgenda"
                :key="t.id"
                class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded"
                :class="'priority-' + (t.priority || 'sedang')"
              >
                <div>
                  <small class="fw-bold">{{ t.task_name }}</small
                  ><br />
                  <small class="text-muted">{{ t.category || '-' }}</small>
                </div>
                <div class="text-end">
                  <div>
                    <span class="badge" :class="getPriorityBadgeClass(t.priority)">{{
                      t.priority || 'sedang'
                    }}</span>
                  </div>
                  <div class="small text-muted mt-1">{{ formatDateSimple(t.deadline_date) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-4 mb-4">
        <div class="card dashboard-card dashboard-card--list card-accent card-accent--warning">
          <div class="card-header py-3 text-center">
            <h5 class="mb-0">🗓️ Agenda Bulanan</h5>
            <small class="text-muted">Tugas deadline bulan ini & bulan selanjutnya</small>
          </div>
          <div class="card-body">
            <div v-if="monthlyAgenda.length === 0" class="text-muted">Tidak ada deadline.</div>
            <div v-else>
              <div
                v-for="t in monthlyAgenda"
                :key="t.id"
                class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded"
                :class="'priority-' + (t.priority || 'sedang')"
              >
                <div>
                  <small class="fw-bold">{{ t.task_name }}</small
                  ><br />
                  <small class="text-muted">{{ t.category || '-' }}</small>
                </div>
                <div class="text-end">
                  <div>
                    <span class="badge" :class="getPriorityBadgeClass(t.priority)">{{
                      t.priority || 'sedang'
                    }}</span>
                  </div>
                  <div class="small text-muted mt-1">{{ formatDateSimple(t.deadline_date) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12 mb-4">
      <div class="row g-3">
        <div class="col-md-12">
          <div class="card dashboard-card dashboard-card--chart card-accent card-accent--primary">
            <div class="card-header py-3 d-flex justify-content-between align-items-center">
              <h5 class="mb-0">📈 Perubahan Skor</h5>
              <div class="btn-group" role="group">
                <button
                  class="btn btn-sm"
                  :class="chartRangeDays === 7 ? 'btn-primary' : 'btn-outline-primary'"
                  @click="changeRange(7)"
                >
                  7 Hari
                </button>
                <button
                  class="btn btn-sm"
                  :class="chartRangeDays === 30 ? 'btn-primary' : 'btn-outline-primary'"
                  @click="changeRange(30)"
                >
                  30 Hari
                </button>
              </div>
            </div>
            <div class="card-body" style="height: 260px">
              <canvas id="weeklyChart" height="220"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Dashboard',
  props: ['user', 'supabase', 'dailyQuote', 'plant'],
  data() {
    return {
      todayScore: 0,
      totalScore: 0,
      todayTasks: [],
      incompleteTasks: [],
      weeklyScores: [],
      completionRatio: 0,
      loading: true,
      weeklyAgenda: [],
      monthlyAgenda: [],
      chartInstance: null,
      chartRangeDays: 7,
      templateTargetCount: 0,
      forestTrees: [],
      forestDaysRange: 21,
      themeObserver: null,
      _unsubs: [],
    };
  },
  computed: {
    todayPercent() {
      return this.templateTargetCount > 0 ? this.completionRatio : 0;
    },
    sortedIncompleteTasks() {
      const order = { tinggi: 3, sedang: 2, rendah: 1 };
      return [...(this.incompleteTasks || [])].sort((a, b) => {
        const ap = order[a.priority || 'sedang'] || 2;
        const bp = order[b.priority || 'sedang'] || 2;
        return bp - ap;
      });
    },
  },
  async mounted() {
    // Subscribe to cache changes first for instant updates
    try {
      if (window.stateManager && typeof window.stateManager.subscribe === 'function') {
        this._unsubs.push(
          window.stateManager.subscribe('todayTasks', (tasks) => {
            if (Array.isArray(tasks)) {
              this.todayTasks = tasks;
              this.incompleteTasks = this.todayTasks.filter((t) => !t.is_completed);
              const templateTasks = this.todayTasks.filter((t) => !!t.task_id);
              this.templateTargetCount = templateTasks.length;
              if (templateTasks.length > 0) {
                const completed = templateTasks.filter((t) => t.is_completed).length;
                this.completionRatio = Math.round((completed / templateTasks.length) * 100);
              } else {
                this.completionRatio = 0;
              }
              this.loading = false;
            }
          }),
          window.stateManager.subscribe('todayScore', (score) => {
            if (typeof score === 'number') this.todayScore = score;
          }),
          window.stateManager.subscribe('totalScore', (score) => {
            if (typeof score === 'number') this.totalScore = score;
          }),
        );
      }
    } catch (_) {}

    // Check if we have cached data, if not then load
    const hasCachedTasks = window.stateManager?.getFromCache('todayTasks');
    const hasCachedScores = window.stateManager?.getFromCache('todayScore');

    if (!hasCachedTasks || !hasCachedScores) {
      await this.loadDashboardData();
    }

    // Load other data in background without blocking UI
    Promise.all([
      this.loadScoresRange(this.chartRangeDays),
      this.loadForestData(this.forestDaysRange),
      this.loadWeeklyAgenda(),
      this.loadMonthlyAgenda(),
    ])
      .then(() => {
        this.renderChart();
      })
      .catch(() => {});

    this._onDeadlineCompleted = (ev) => {
      try {
        const instance = ev.detail?.instance;
        const tplId = instance?.task_id;
        if (!tplId) return;
        this.weeklyAgenda = (this.weeklyAgenda || []).filter((t) => t.id !== tplId);
        this.monthlyAgenda = (this.monthlyAgenda || []).filter((t) => t.id !== tplId);
        this.loadWeeklyAgenda();
        this.loadMonthlyAgenda();
      } catch (e) {
        console.warn('Error handling deadline-completed event', e);
      }
    };

    this._onAgendaRefresh = () => {
      this.loadWeeklyAgenda();
      this.loadMonthlyAgenda();
    };

    window.addEventListener('deadline-completed', this._onDeadlineCompleted);
    window.addEventListener('agenda-refresh', this._onAgendaRefresh);

    const target = document.documentElement || document.body;
    this.themeObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'data-bs-theme') {
          this.renderChart();
          break;
        }
      }
    });
    this.themeObserver.observe(target, { attributes: true, attributeFilter: ['data-bs-theme'] });
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
    try {
      if (this._onDeadlineCompleted)
        window.removeEventListener('deadline-completed', this._onDeadlineCompleted);
      if (this._onAgendaRefresh)
        window.removeEventListener('agenda-refresh', this._onAgendaRefresh);
    } catch (_) {}
    try {
      (this._unsubs || []).forEach((u) => typeof u === 'function' && u());
      this._unsubs = [];
    } catch (_) {}
  },
  methods: {
    async loadDashboardData() {
      try {
        const today =
          window.WITA && window.WITA.today
            ? window.WITA.today()
            : new Date().toISOString().slice(0, 10);

        // Always load today's tasks
        if (window.dataService) {
          const tasksResult = await window.dataService.getTodayTasks(this.user.id, today);
          this.todayTasks = tasksResult.data || [];
        } else {
          const { data: todayTasksData } = await this.supabase
            .from('daily_tasks_instance')
            .select('*')
            .eq('user_id', this.user.id)
            .eq('date', today);
          this.todayTasks = todayTasksData || [];
        }

        // Load today's score from logs (if any)
        const { data: todayScoreRows } = await this.supabase
          .from('score_log')
          .select('score_delta')
          .eq('user_id', this.user.id)
          .eq('date', today);
        const loggedToday = (todayScoreRows || []).reduce(
          (s, r) => s + (Number(r.score_delta) || 0),
          0,
        );

        // Compute fallback score from tasks using user-configured reward/penalty
        const meta = (this.user && this.user.user_metadata) || {};
        const reward = Number.isFinite(Number(meta.score_reward_complete))
          ? Number(meta.score_reward_complete)
          : Number(window.userScoreReward) || 1;
        const penalty = Number.isFinite(Number(meta.score_penalty_incomplete))
          ? Number(meta.score_penalty_incomplete)
          : Number(window.userScorePenalty) || 2;
        const completedCount = (this.todayTasks || []).filter((t) => t.is_completed).length;
        const incompleteCount = (this.todayTasks || []).length - completedCount;
        const computedToday = completedCount * reward - incompleteCount * penalty;

        // Final today score: prefer logs if present; otherwise use computed
        const hasTodayLogs = (todayScoreRows || []).length > 0;
        this.todayScore = hasTodayLogs ? loggedToday : computedToday;

        // Use DataService for consistent total score calculation
        if (window.dataService) {
          const totalResult = await window.dataService.getTotalScore(this.user.id);
          this.totalScore = totalResult.data || 0;
        }

        this.incompleteTasks = this.todayTasks.filter((t) => !t.is_completed);

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
        console.error('Error loading dashboard data:', error);
        this.loading = false;
      }
    },

    async loadForestData(days) {
      try {
        const endStr =
          window.WITA && window.WITA.today
            ? window.WITA.today()
            : new Date().toISOString().slice(0, 10);

        // Determine month start and first active date (cached)
        const parts =
          window.WITA && window.WITA.nowParts
            ? window.WITA.nowParts()
            : (() => {
                const d = new Date(endStr);
                return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
              })();
        const monthStart =
          window.WITA && window.WITA.monthStartIso
            ? window.WITA.monthStartIso(parts.year, parts.month - 1)
            : `${parts.year}-${String(parts.month).padStart(2, '0')}-01`;

        const firstActive = await this.getFirstActiveDate();
        const startStr = firstActive && firstActive > monthStart ? firstActive : monthStart;

        const diffDays = Math.floor((Date.parse(endStr) - Date.parse(startStr)) / 86400000) + 1;

        const { data, error } = await this.supabase
          .from('daily_tasks_instance')
          .select('date, is_completed, task_id')
          .eq('user_id', this.user.id)
          .gte('date', startStr)
          .lte('date', endStr);
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
        console.error('Error loadForestData:', e);
        this.forestTrees = [];
      }
    },

    async loadScoresRange(days) {
      try {
        const endStr =
          window.WITA && window.WITA.today
            ? window.WITA.today()
            : new Date().toISOString().slice(0, 10);
        const startStr =
          window.WITA && window.WITA.advanceIso
            ? window.WITA.advanceIso(endStr, -(days - 1))
            : endStr;

        const { data, error } = await this.supabase
          .from('score_log')
          .select('date, score_delta')
          .eq('user_id', this.user.id)
          .gte('date', startStr)
          .lte('date', endStr);
        if (error) throw error;

        const map = new Map();
        for (let i = 0; i < days; i++) {
          const key =
            window.WITA && window.WITA.advanceIso ? window.WITA.advanceIso(startStr, i) : startStr;
          map.set(key, 0);
        }
        (data || []).forEach((r) => {
          map.set(r.date, (map.get(r.date) || 0) + (r.score_delta || 0));
        });

        const dates = [];
        const scores = [];
        for (const [dateStr, val] of map.entries()) {
          dates.push(
            new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' }),
          );
          scores.push(val);
        }
        this.weeklyScores = { dates, scores };
      } catch (e) {
        console.error('Error loadScoresRange:', e);
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
        const ctx = document.getElementById('weeklyChart');
        if (!ctx) return;
        if (this.chartInstance) {
          this.chartInstance.destroy();
          this.chartInstance = null;
        }

        const isDark =
          (document.documentElement &&
            document.documentElement.getAttribute('data-bs-theme') === 'dark') ||
          (document.body &&
            document.body.getAttribute &&
            document.body.getAttribute('data-bs-theme') === 'dark');
        const gridY = isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.08)';
        const gridX = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)';
        const tickColor = isDark ? '#cbd5e1' : '#475569';
        const lineColor = isDark ? '#60a5fa' : '#0d6efd';
        const fillColor = isDark ? 'rgba(96,165,250,0.18)' : 'rgba(13,110,253,0.1)';

        const ChartLib = window.Chart;
        if (!ChartLib) return;

        this.chartInstance = new ChartLib(ctx, {
          type: 'line',
          data: {
            labels: this.weeklyScores.dates,
            datasets: [
              {
                label: 'Skor Harian',
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

    formatDateSimple(dateString) {
      if (!dateString) return '-';
      try {
        return new Date(dateString).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        });
      } catch (_) {
        return dateString;
      }
    },

    async loadWeeklyAgenda() {
      try {
        const today =
          window.WITA && window.WITA.today
            ? window.WITA.today()
            : new Date().toISOString().slice(0, 10);
        const start = new Date(today);
        const day = start.getDay();
        const diffToMonday = (day + 6) % 7;
        start.setDate(start.getDate() - diffToMonday);
        const startIso = start.toISOString().slice(0, 10);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const endIso = end.toISOString().slice(0, 10);

        const { data: tmplData, error: tmplErr } = await this.supabase
          .from('daily_tasks_template')
          .select('*')
          .eq('user_id', this.user.id)
          .eq('jenis_task', 'deadline')
          .gte('deadline_date', startIso)
          .lte('deadline_date', endIso)
          .order('deadline_date', { ascending: true });
        if (tmplErr) throw tmplErr;
        const candidates = tmplData || [];
        if (candidates.length === 0) {
          this.weeklyAgenda = [];
          return;
        }

        const ids = candidates.map((t) => t.id).filter(Boolean);
        const { data: instances, error: instErr } = await this.supabase
          .from('daily_tasks_instance')
          .select('task_id, date, is_completed')
          .in('task_id', ids)
          .eq('user_id', this.user.id)
          .in(
            'date',
            candidates.map((c) => c.deadline_date),
          )
          .order('date', { ascending: true });
        if (instErr) throw instErr;

        const completedSet = new Set(
          (instances || []).filter((i) => i.is_completed).map((i) => `${i.task_id}::${i.date}`),
        );
        const todayIso = today;
        this.weeklyAgenda = candidates.filter((t) => {
          if (!t.deadline_date) return false;
          if (t.deadline_date < todayIso) return false;
          if (completedSet.has(`${t.id}::${t.deadline_date}`)) return false;
          return true;
        });
      } catch (e) {
        console.error('Error loadWeeklyAgenda:', e);
        this.weeklyAgenda = [];
      }
    },

    async loadMonthlyAgenda() {
      try {
        const today =
          window.WITA && window.WITA.today
            ? window.WITA.today()
            : new Date().toISOString().slice(0, 10);
        const d = new Date(today);
        const year = d.getFullYear();
        const monthStartIso = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
        const nextMonth = new Date(d.getFullYear(), d.getMonth() + 2, 0);
        const endNextMonthIso = nextMonth.toISOString().slice(0, 10);

        const weekStart = new Date(today);
        const day = weekStart.getDay();
        const diffToMonday = (day + 6) % 7;
        weekStart.setDate(weekStart.getDate() - diffToMonday);
        const weekStartIso = weekStart.toISOString().slice(0, 10);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const weekEndIso = weekEnd.toISOString().slice(0, 10);

        const { data: tmplData, error: tmplErr } = await this.supabase
          .from('daily_tasks_template')
          .select('*')
          .eq('user_id', this.user.id)
          .eq('jenis_task', 'deadline')
          .gte('deadline_date', monthStartIso)
          .lte('deadline_date', endNextMonthIso)
          .order('deadline_date', { ascending: true });
        if (tmplErr) throw tmplErr;
        const monthData = tmplData || [];
        if (monthData.length === 0) {
          this.monthlyAgenda = [];
          return;
        }

        const ids = monthData.map((t) => t.id).filter(Boolean);
        const uniqueDates = Array.from(
          new Set(monthData.map((t) => t.deadline_date).filter(Boolean)),
        );
        const { data: instances, error: instErr } = await this.supabase
          .from('daily_tasks_instance')
          .select('task_id, date, is_completed')
          .in('task_id', ids)
          .eq('user_id', this.user.id)
          .in('date', uniqueDates)
          .order('date', { ascending: true });
        if (instErr) throw instErr;

        const completedSet = new Set(
          (instances || []).filter((i) => i.is_completed).map((i) => `${i.task_id}::${i.date}`),
        );
        const todayIso = today;
        this.monthlyAgenda = monthData.filter((t) => {
          const dstr = t.deadline_date;
          if (!dstr) return false;
          if (dstr >= weekStartIso && dstr <= weekEndIso) return false;
          if (dstr < todayIso) return false;
          if (completedSet.has(`${t.id}::${dstr}`)) return false;
          return true;
        });
      } catch (e) {
        console.error('Error loadMonthlyAgenda:', e);
        this.monthlyAgenda = [];
      }
    },

    getPriorityBadgeClass(priority) {
      const classes = { tinggi: 'bg-danger', sedang: 'bg-warning text-dark', rendah: 'bg-success' };
      return classes[priority] || 'bg-secondary';
    },

    async getFirstActiveDate() {
      try {
        // Try cached first
        if (window.stateManager) {
          const cached = window.stateManager.getFromCache('firstActiveDate');
          if (cached) return cached;
        }

        // Use auth user.created_at as primary source
        let iso = null;
        try {
          const createdAt = this.user && this.user.created_at;
          if (createdAt) {
            const dt = new Date(createdAt);
            const witaMs = dt.getTime() + 7 * 60 * 60 * 1000; // UTC+7
            iso = new Date(witaMs).toISOString().slice(0, 10);
          }
        } catch (_) {}

        // Fallback: earliest instance date if exists
        if (!iso) {
          const { data, error } = await this.supabase
            .from('daily_tasks_instance')
            .select('date')
            .eq('user_id', this.user.id)
            .order('date', { ascending: true })
            .limit(1);
          if (!error && data && data[0]?.date) iso = data[0].date;
        }

        // Final fallback: today
        if (!iso) {
          iso = window.WITA?.today?.() || new Date().toISOString().slice(0, 10);
        }

        if (window.stateManager) window.stateManager.setCache('firstActiveDate', iso);
        return iso;
      } catch (_) {
        return window.WITA?.today?.() || new Date().toISOString().slice(0, 10);
      }
    },
  },
};
</script>
