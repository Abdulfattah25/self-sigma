// Inisialisasi Supabase dari config
const supabaseClient = supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);

// Akses quotes harian dari data/quotes.js
const DAILY_QUOTES = window.DAILY_QUOTES || [];

new Vue({
  el: "#app",
  data() {
    return {
      user: null,
      session: null,
      currentView: localStorage.getItem("currentView") || "dashboard",
      loading: true,
      dailyQuote: "",

      // Auth forms
      authMode: "login", // 'login' or 'register'
      authForm: {
        email: "",
        password: "",
        confirmPassword: "",
        fullName: "",
      },
      authLoading: false,
      authError: "",
    };
  },
  created() {
    this.initializeApp();
  },
  watch: {
    currentView(val) {
      localStorage.setItem("currentView", val);
    },
  },
  methods: {
    async initializeApp() {
      try {
        // Cek session aktif
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();
        if (session) {
          this.session = session;
          this.user = session.user;
          await this.postLoginBootstrap();
        }

        // Listener perubahan auth
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
          const wasLoggedIn = !!this.user;
          this.session = session;
          this.user = session?.user || null;
          if (event === "SIGNED_IN" && this.user) {
            await this.postLoginBootstrap();
            // Hanya ubah tampilan ke dashboard saat transisi dari belum login -> login
            if (!wasLoggedIn) {
              this.currentView = "dashboard";
              this.closeAuthModal();
              this.showToast("Login berhasil", "success");
            }
          }
          if (event === "SIGNED_OUT") {
            this.currentView = "dashboard";
          }
        });

        // Set quote harian
        this.setDailyQuote();
      } catch (e) {
        console.error(e);
      } finally {
        this.loading = false;
      }
    },

    async postLoginBootstrap() {
      try {
        // Hindari menjalankan berulang dalam 1 hari
        const key = `bootstrap_ran_${this.user.id}`;
        const lastRun = localStorage.getItem(key);
        const today = this.getToday();
        if (lastRun === today) return;

        await this.ensureUserRow();
        await this.materializeTodayTasksFromTemplate();
        await this.applyOverduePenalties();

        localStorage.setItem(key, today);
      } catch (e) {
        console.error("Bootstrap error:", e);
      }
    },

    async ensureUserRow() {
      try {
        const payload = [{ id: this.user.id, email: this.user.email, created_at: new Date().toISOString() }];
        const { error } = await supabaseClient.from("users").upsert(payload, { onConflict: "id" });
        if (error && error.code !== "23505") throw error;
      } catch (e) {
        console.warn("ensureUserRow skipped/failed:", e.message);
      }
    },

    async materializeTodayTasksFromTemplate() {
      const today = this.getToday();
      // Ambil template
      const { data: templates, error: tErr } = await supabaseClient
        .from("daily_tasks_template")
        .select("id, task_name, priority, category")
        .eq("user_id", this.user.id);
      if (tErr) {
        console.warn("Load templates failed", tErr.message);
        return;
      }
      if (!templates || templates.length === 0) return;

      // Ambil instance yang sudah ada untuk hari ini
      const { data: instances, error: iErr } = await supabaseClient
        .from("daily_tasks_instance")
        .select("task_id")
        .eq("user_id", this.user.id)
        .eq("date", today);
      if (iErr) {
        console.warn("Load instances failed", iErr.message);
        return;
      }

      const existingIds = new Set((instances || []).map((i) => i.task_id).filter(Boolean));
      const toInsert = templates
        .filter((t) => !existingIds.has(t.id))
        .map((t) => ({
          user_id: this.user.id,
          task_id: t.id,
          task_name: t.task_name,
          priority: t.priority || "sedang",
          category: t.category || null,
          date: today,
          is_completed: false,
        }));
      if (toInsert.length === 0) return;
      const { error: insErr } = await supabaseClient.from("daily_tasks_instance").insert(toInsert);
      if (insErr) console.warn("Insert instances failed", insErr.message);
    },

    async applyOverduePenalties() {
      const today = this.getToday();
      // Ambil task yang lewat (maks 30 hari ke belakang) dan belum selesai
      const startDate = this.getISODateNDaysAgo(30);
      const { data: overdue, error: oErr } = await supabaseClient
        .from("daily_tasks_instance")
        .select("id, task_name, date")
        .eq("user_id", this.user.id)
        .lt("date", today)
        .gte("date", startDate)
        .eq("is_completed", false);
      if (oErr) {
        console.warn("Load overdue failed", oErr.message);
        return;
      }
      if (!overdue || overdue.length === 0) return;

      // Cek penalty yang sudah tercatat agar tidak dobel
      const reasons = overdue.map((i) => `penalty:${i.id}`);
      const { data: existingLogs, error: lErr } = await supabaseClient
        .from("score_log")
        .select("reason")
        .eq("user_id", this.user.id)
        .in("reason", reasons);
      if (lErr) {
        console.warn("Load score_log failed", lErr.message);
      }
      const existingReasons = new Set((existingLogs || []).map((l) => l.reason));

      const toLog = overdue
        .filter((i) => !existingReasons.has(`penalty:${i.id}`))
        .map((i) => ({ user_id: this.user.id, date: i.date, score_delta: -3, reason: `penalty:${i.id}` }));
      if (toLog.length === 0) return;
      const { error: insLogErr } = await supabaseClient.from("score_log").insert(toLog);
      if (insLogErr) console.warn("Insert penalties failed", insLogErr.message);
    },

    setDailyQuote() {
      if (!DAILY_QUOTES.length) return;
      // Use WITA day-of-year approximation by using WITA 'today' parts
      const parts = window.WITA && window.WITA.nowParts ? window.WITA.nowParts() : { year: new Date().getFullYear() };
      const y = parts.year;
      // Build date with WITA today and compute day-of-year by counting from Jan 1 WITA
      try {
        const todayIso = window.WITA && window.WITA.today ? window.WITA.today() : new Date().toISOString().slice(0, 10);
        const startIso = `${y}-01-01`;
        const dayOfYear = Math.floor((Date.parse(todayIso) - Date.parse(startIso)) / 86400000);
        this.dailyQuote = DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
      } catch (_) {
        const today = new Date();
        const start = new Date(today.getFullYear(), 0, 0);
        const diff = today - start;
        const dayOfYear = Math.floor(diff / 86400000);
        this.dailyQuote = DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];
      }
    },

    // Navigasi
    setView(view) {
      this.currentView = view;
    },

    // Auth
    async handleAuth() {
      this.authError = "";
      this.authLoading = true;
      try {
        if (this.authMode === "register") {
          await this.register();
        } else {
          await this.login();
        }
      } catch (err) {
        this.authError = err.message;
        this.showToast(err.message, "danger");
      } finally {
        this.authLoading = false;
      }
    },

    async login() {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: this.authForm.email,
        password: this.authForm.password,
      });
      if (error) throw error;
      // Pastikan modal login tertutup setelah berhasil login
      this.closeAuthModal();
      this.resetAuthForm();
    },

    async register() {
      if (this.authForm.password !== this.authForm.confirmPassword) {
        throw new Error("Password tidak cocok");
      }
      const { data, error } = await supabaseClient.auth.signUp({
        email: this.authForm.email,
        password: this.authForm.password,
        options: {
          data: { full_name: this.authForm.fullName },
        },
      });
      if (error) throw error;
      if (data.user && !data.session) {
        this.showToast("Verifikasi dikirim ke email Anda", "info");
      }
      this.resetAuthForm();
    },

    async logout() {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        this.showToast("Gagal logout: " + error.message, "danger");
        return;
      }
      this.user = null;
      this.session = null;
      this.currentView = "dashboard";
      this.showToast("Logout berhasil", "success");
    },

    resetAuthForm() {
      this.authForm = { email: "", password: "", confirmPassword: "", fullName: "" };
    },
    switchAuthMode() {
      this.authMode = this.authMode === "login" ? "register" : "login";
      this.authError = "";
      this.resetAuthForm();
    },
    formatUserName() {
      return this.user?.user_metadata?.full_name || this.user?.email?.split("@")[0] || "User";
    },

    // Utilities tanggal
    getToday() {
      return window.WITA && window.WITA.today ? window.WITA.today() : new Date().toISOString().slice(0, 10);
    },
    getISODateNDaysAgo(n) {
      if (window.WITA && window.WITA.isoDateNDaysAgo) return window.WITA.isoDateNDaysAgo(n);
      const d = new Date();
      d.setDate(d.getDate() - n);
      return d.toISOString().slice(0, 10);
    },

    // Toast helper (Bootstrap 5)
    showToast(message, variant = "primary", delay = 3000) {
      try {
        const container = document.getElementById("toastContainer");
        if (!container) return;
        const toastEl = document.createElement("div");
        toastEl.className = `toast align-items-center text-bg-${variant} border-0`;
        toastEl.setAttribute("role", "alert");
        toastEl.setAttribute("aria-live", "assertive");
        toastEl.setAttribute("aria-atomic", "true");
        toastEl.innerHTML = `
          <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>`;
        container.appendChild(toastEl);
        const t = new bootstrap.Toast(toastEl, { delay });
        toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
        t.show();
      } catch (_) {
        /* noop */
      }
    },
    // Helper untuk menutup modal auth (Bootstrap 5)
    closeAuthModal() {
      try {
        const modalEl = document.getElementById("authModal");
        if (!modalEl) return;
        const instance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        instance.hide();
      } catch (_) {
        /* noop */
      }
    },
  },
  template: `
    <div id="app">
      <!-- Loading -->
      <div v-if="loading" class="d-flex justify-content-center align-items-center" style="height: 100vh;">
        <div class="text-center">
          <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p>Memuat aplikasi...</p>
        </div>
      </div>

      <div v-else>
        <!-- Navbar (mobile-visible, no hamburger) -->
        <nav class="navbar navbar-dark bg-primary app-navbar">
          <div class="container-fluid d-flex align-items-center w-100">
            <a class="navbar-brand" href="#">📊 Productivity Tracker</a>
            
            <!-- Desktop nav links (hidden, replaced by sidebar) -->
            <ul class="navbar-nav d-none flex-row ms-4">
              <!-- hidden -->
            </ul>

            <!-- Right: auth/account (visible on all sizes) -->
            <ul class="navbar-nav ms-auto">
              <li v-if="!user" class="nav-item">
                <a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#authModal">🔐 Login</a>
              </li>
              <li v-else class="nav-item">
                <a class="nav-link" href="#" @click.prevent="setView('profile')">👤 {{ formatUserName() }}</a>
              </li>
            </ul>
          </div>
        </nav>

        <!-- Desktop Fixed Sidebar -->
        <aside v-if="user" class="sidebar-fixed d-none d-md-block">
          <div class="sidebar-inner">
            <div class="list-group list-group-flush sidebar-menu">
              <a href="#" class="list-group-item list-group-item-action d-flex align-items-center"
                 :class="{ active: currentView==='dashboard' }" @click.prevent="setView('dashboard')">
                <i class="bi bi-house-fill me-2 text-primary"></i>
                <span>Dashboard</span>
              </a>
              <a v-if="user" href="#" class="list-group-item list-group-item-action d-flex align-items-center"
                 :class="{ active: currentView==='checklist' }" @click.prevent="setView('checklist')">
                <i class="bi bi-check2-square me-2 text-success"></i>
                <span>Checklist</span>
              </a>
              <a v-if="user" href="#" class="list-group-item list-group-item-action d-flex align-items-center"
                 :class="{ active: currentView==='tasks' }" @click.prevent="setView('tasks')">
                <i class="bi bi-list-task me-2 text-info"></i>
                <span>Task Manager</span>
              </a>
              <a v-if="user" href="#" class="list-group-item list-group-item-action d-flex align-items-center"
                 :class="{ active: currentView==='report' }" @click.prevent="setView('report')">
                <i class="bi bi-graph-up-arrow me-2 text-warning"></i>
                <span>Report</span>
              </a>
            </div>
          </div>
        </aside>

        <!-- Mobile Bottom Navigation -->
        <nav class="mobile-bottom-nav d-md-none">
          <a href="#" class="mobile-nav-item" :class="{ active: currentView==='dashboard' }" @click.prevent="setView('dashboard')">
            <i class="bi bi-house"></i>
            <span>Home</span>
          </a>
          <a v-if="user" href="#" class="mobile-nav-item" :class="{ active: currentView==='checklist' }" @click.prevent="setView('checklist')">
            <i class="bi bi-check2-square"></i>
            <span>Checklist</span>
          </a>
          <a v-if="user" href="#" class="mobile-nav-item" :class="{ active: currentView==='tasks' }" @click.prevent="setView('tasks')">
            <i class="bi bi-list-task"></i>
            <span>Tasks</span>
          </a>
          <a v-if="user" href="#" class="mobile-nav-item" :class="{ active: currentView==='report' }" @click.prevent="setView('report')">
            <i class="bi bi-graph-up"></i>
            <span>Report</span>
          </a>
          <a v-if="user" href="#" class="mobile-nav-item" :class="{ active: currentView==='profile' }" @click.prevent="setView('profile')">
            <i class="bi bi-person-circle"></i>
            <span>Saya</span>
          </a>
          <a v-if="!user" href="#" class="mobile-nav-item" data-bs-toggle="modal" data-bs-target="#authModal">
            <i class="bi bi-box-arrow-in-right"></i>
            <span>Login</span>
          </a>
        </nav>

        <!-- Main content area (below header, beside sidebar) -->
        <main class="main-content" :class="{ 'with-sidebar': !!user }">
          <div class="container-fluid pt-3">
            <div v-if="!user && currentView==='dashboard'">
              <div class="row justify-content-center">
                <div class="col-lg-8">
                  <div class="text-center mb-5">
                    <h1 class="mb-3">📊 Productivity Tracker</h1>
                    <p class="lead">Kelola tugas harian Anda dengan sistem scoring yang memotivasi!</p>
                    <button class="btn btn-primary btn-lg" data-bs-toggle="modal" data-bs-target="#authModal">Mulai Sekarang</button>
                  </div>
                  <div class="row">
                    <div class="col-md-4 mb-3"><div class="card h-100 text-center"><div class="card-body"><div class="display-4 text-primary mb-2">✅</div><h6>Task Management</h6><p class="text-muted">Kelola tugas harian dengan template</p></div></div></div>
                    <div class="col-md-4 mb-3"><div class="card h-100 text-center"><div class="card-body"><div class="display-4 text-success mb-2">⚡</div><h6>Scoring System</h6><p class="text-muted">Poin memotivasi untuk menyelesaikan tugas</p></div></div></div>
                    <div class="col-md-4 mb-3"><div class="card h-100 text-center"><div class="card-body"><div class="display-4 text-info mb-2">📊</div><h6>Progress Tracking</h6><p class="text-muted">Laporan visual perkembangan</p></div></div></div>
                  </div>
                </div>
              </div>
            </div>

            <dashboard v-if="user && currentView==='dashboard'" :user="user" :supabase="supabaseClient" :daily-quote="dailyQuote"></dashboard>
            <checklist v-if="user && currentView==='checklist'" :user="user" :supabase="supabaseClient"></checklist>
            <task-manager v-if="user && currentView==='tasks'" :user="user" :supabase="supabaseClient"></task-manager>
            <report v-if="user && currentView==='report'" :user="user" :supabase="supabaseClient"></report>
            <profile v-if="user && currentView==='profile'" :user="user" :supabase="supabaseClient"></profile>
          </div>
        </main>

        <!-- Auth Modal -->
        <div class="modal fade" id="authModal" tabindex="-1">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">{{ authMode === 'login' ? '🔐 Login' : '📝 Daftar Akun' }}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <form @submit.prevent="handleAuth">
                  <div v-if="authError" class="alert alert-danger">{{ authError }}</div>

                  <div v-if="authMode==='register'" class="mb-3">
                    <label class="form-label">Nama Lengkap</label>
                    <input type="text" class="form-control" v-model="authForm.fullName" required>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input type="email" class="form-control" v-model="authForm.email" required>
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Password</label>
                    <input type="password" class="form-control" v-model="authForm.password" required>
                  </div>

                  <div v-if="authMode==='register'" class="mb-3">
                    <label class="form-label">Konfirmasi Password</label>
                    <input type="password" class="form-control" v-model="authForm.confirmPassword" required>
                  </div>

                  <button type="submit" class="btn btn-primary w-100" :disabled="authLoading">{{ authLoading ? 'Memproses...' : (authMode==='login' ? 'Login' : 'Daftar') }}</button>
                </form>
                <hr>
                <div class="text-center">
                  <p class="mb-0">{{ authMode==='login' ? 'Belum punya akun?' : 'Sudah punya akun?' }}
                    <a href="#" @click.prevent="switchAuthMode">{{ authMode==='login' ? 'Daftar di sini' : 'Login di sini' }}</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Toast Container (for Bootstrap 5 Toasts) -->
        <div id="toastContainer" aria-live="polite" aria-atomic="true" class="position-fixed top-0 end-0 p-3">
        </div>
      </div>
    </div>
  `,
});
