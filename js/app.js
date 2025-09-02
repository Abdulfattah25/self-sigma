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
      // UI helpers for auth
      showPassword: false,
      showConfirmPassword: false,

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
      this.showPassword = false;
      this.showConfirmPassword = false;
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
        <nav class="navbar navbar-dark app-navbar modern-navbar" :class="{ 'bg-elegant': !user, 'bg-primary': !!user }">
          <div class="container-fluid d-flex align-items-center w-100 px-4">
            <a class="navbar-brand d-flex align-items-center" href="#">
              <span class="brand-badge me-2">PT</span>
              <span>Productivity Tracker</span>
            </a>

            <!-- Desktop nav links (hidden, replaced by sidebar) -->
            <ul class="navbar-nav d-none flex-row ms-4">
              <!-- hidden -->
            </ul>

            <!-- Right: auth/account (visible on all sizes) -->
            <ul class="navbar-nav ms-auto">
              <li v-if="!user" class="nav-item">
                <a class="nav-link btn btn-sm rounded-pill px-3 text-light fw-semibold shadow-sm d-none d-md-inline-flex"
                   href="#"
                   data-bs-toggle="modal"
                   data-bs-target="#authModal">Masuk</a>
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
          <div class="container-fluid">
            <!-- Landing (Logged-out) -->
            <div v-if="!user && currentView==='dashboard'" class="landing-theme">
              <section class="hero-section position-relative overflow-hidden">
                <div class="container py-0">
                  <div class="row align-items-center g-4">
                    <div class="col-lg-6">
                      <div class="hero-badge text-uppercase fw-bold mb-3">
                        <i class="bi bi-stars me-2"></i>
                        Tingkatkan produktivitas harian Anda
                      </div>
                      <h1 class="display-4 fw-bold lh-tight hero-title">
                        Kelola Tugas, Raih Target, dan Pantau Perkembangan Anda
                      </h1>
                      <p class="lead text-light mt-3">
                        Productivity Tracker membantu Anda membangun kebiasaan positif dengan checklist harian, sistem poin, dan laporan visual yang menawan.
                      </p>

                      <div class="d-flex flex-wrap gap-2 my-4">
                        <button
                          class="btn btn-gradient btn-lg px-4 shadow-lg"
                          data-bs-toggle="modal"
                          data-bs-target="#authModal">
                          Mulai Sekarang
                        </button>
                        <a href="#fitur" class="btn btn-outline-light btn-lg px-4 border-0 glass-btn text-white d-none d-md-inline-flex">
                          Jelajahi Fitur
                        </a>
                      </div>
                    </div>

                    <div class="col-lg-6">
                      <div class="landing-visual glass-card p-0">
                        <div class="p-4">
                          <div class="row">
                            <div class="col-6">
                              <div class="mini-card">
                                <div class="d-flex align-items-center">
                                  <div class="icon-bubble bg-success-subtle text-success me-1">
                                    <i class="bi bi-check2-circle"></i>
                                  </div>
                                  <div>
                                    <div class="small text-muted">Checklist Selesai</div>
                                    <div class="h4 mb-0 fw-bold text-muted">12</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div class="col-6">
                              <div class="mini-card">
                                <div class="d-flex align-items-center">
                                  <div class="icon-bubble bg-primary-subtle text-primary me-3">
                                    <i class="bi bi-lightning-charge-fill"></i>
                                  </div>
                                  <div>
                                    <div class="small text-muted">Skor Hari Ini</div>
                                    <div class="h4 mb-0 fw-bold text-muted">+24</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div class="col-12">
                              <div class="mock-panel">
                                <div class="d-flex align-items-center justify-content-between mb-2">
                                  <strong class="text-dark">Task Harian</strong>
                                  <span class="badge bg-success-subtle text-success">On Track</span>
                                </div>
                                <div class="task-row">
                                  <div class="form-check">
                                    <input class="form-check-input" type="checkbox" checked />
                                  </div>
                                  <div class="flex-grow-1 text-muted">Minum 2L air putih</div>
                                  <span class="badge rounded-pill bg-success-subtle text-success">+2</span>
                                </div>
                                <div class="task-row">
                                  <div class="form-check">
                                    <input class="form-check-input" type="checkbox" />
                                  </div>
                                  <div class="flex-grow-1  text-muted">Olahraga 20 menit</div>
                                  <span class="badge rounded-pill bg-success-subtle text-success">+4</span>
                                </div>
                                <div class="task-row">
                                  <div class="form-check">
                                    <input class="form-check-input" type="checkbox" />
                                  </div>
                                  <div class="flex-grow-1  text-muted">Belajar 45 menit</div>
                                  <span class="badge rounded-pill bg-success-subtle text-success">+6</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Decorative shapes -->
                <div class="hero-blur hero-blur-1"></div>
                <div class="hero-blur hero-blur-2"></div>
              </section>

              <section id="fitur" class="container my-5">
                <div class="text-center mb-4">
                  <h2 class="fw-bold">Fitur yang Membantu Anda Konsisten</h2>
                  <p class="text-muted">Dirancang agar fokus, rapi, dan menyenangkan digunakan setiap hari.</p>
                </div>

                <div class="row g-3 g-md-4">
                  <div class="col-6 col-lg-4">
                    <div class="feature-card h-100">
                      <div class="icon-bubble text-primary bg-primary-subtle"><i class="bi bi-list-task"></i></div>
                      <div>
                      <h6 class="mt-3 mb-1">Template Tugas</h6>
                      <p class="text-muted small mb-0">Susun template checklist harian lalu otomatis dibuat setiap hari.</p>
                      </div>
                    </div>
                  </div>
                  <div class="col-6 col-lg-4">
                    <div class="feature-card h-100">
                      <div class="icon-bubble text-success bg-success-subtle"><i class="bi bi-trophy-fill"></i></div>
                      <div>
                      <h6 class="mt-3 mb-1">Sistem Poin</h6>
                      <p class="text-muted small mb-0">Dapatkan poin untuk tiap tugas selesai dan hindari penalti.</p>
                      </div>
                    </div>
                  </div>
                  <div class="col-6 col-lg-4">
                    <div class="feature-card h-100">
                      <div class="icon-bubble text-info bg-info-subtle"><i class="bi bi-alarm-fill"></i></div>
                      <div>
                      <h6 class="mt-3 mb-1">Rutinitas Konsisten</h6>
                      <p class="text-muted small mb-0">Bangun kebiasaan baik dengan checklist yang mudah diikuti.</p>
                      </div>
                    </div>
                  </div>
                  <div class="col-6 col-lg-4">
                    <div class="feature-card h-100">
                      <div class="icon-bubble text-danger bg-danger-subtle"><i class="bi bi-shield-lock-fill"></i></div>
                      <div>
                      <h6 class="mt-3 mb-1">Privasi Aman</h6>
                      <p class="text-muted small mb-0">Data Anda tersimpan aman dengan autentikasi modern.</p>
                      </div>
                    </div>
                  </div>
                  <div class="col-6 col-lg-4">
                    <div class="feature-card h-100">
                      <div class="icon-bubble text-secondary bg-secondary-subtle"><i class="bi bi-device-ssd-fill"></i></div>
                      <div>
                      <h6 class="mt-3 mb-1">Ringan & Cepat</h6>
                      <p class="text-muted small mb-0">Antarmuka gesit dan responsive di semua perangkat.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="text-center mt-4">
                  <button
                    class="btn btn-gradient btn-lg px-4 shadow"
                    data-bs-toggle="modal"
                    data-bs-target="#authModal">
                    Login Sekarang
                  </button>
                </div>
              </section>
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
          <div class="modal-dialog modal-dialog-centered modal-lg auth-modal">
            <div class="modal-content auth-modal-content overflow-hidden">
              <div class="row g-0">
                <!-- Left visual -->
                <div class="col-lg-5 d-none d-lg-flex align-items-stretch">
                  <div class="auth-visual w-100 p-4 d-flex flex-column justify-content-end">
                    <div class="mb-auto">
                      <div class="badge bg-white text-primary rounded-pill mb-3 shadow-sm">
                        <i class="bi bi-stars me-1"></i> Selamat Datang
                      </div>
                      <h4 class="text-white fw-bold mb-2">Satu langkah menuju hari yang lebih produktif</h4>
                      <p class="text-white-50 mb-0">
                        Buat akun atau masuk untuk menyinkronkan data checklist, poin, dan laporan Anda.
                      </p>
                    </div>
                    <ul class="list-unstyled mt-4 text-white-75 small">
                      <li class="mb-2"><i class="bi bi-check2-circle me-2"></i>Desain modern & ringan</li>
                      <li class="mb-2"><i class="bi bi-check2-circle me-2"></i>Sinkron otomatis</li>
                      <li class="mb-2"><i class="bi bi-check2-circle me-2"></i>Privasi dan keamanan</li>
                    </ul>
                  </div>
                </div>

                <!-- Right form -->
                <div class="col-lg-7">
                  <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title">{{ authMode === 'login' ? 'Masuk ke Akun' : 'Buat Akun Baru' }}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                  </div>
                  <div class="modal-body pt-2">
                    <form @submit.prevent="handleAuth" class="auth-form">
                      <div v-if="authError" class="alert alert-danger">{{ authError }}</div>

                      <div v-if="authMode==='register'" class="mb-3 field">
                        <i class="bi bi-person icon"></i>
                        <input type="text" class="form-control form-control-modern" v-model="authForm.fullName" placeholder="Nama Lengkap" required>
                      </div>

                      <div class="mb-3 field">
                        <i class="bi bi-envelope icon"></i>
                        <input type="email" class="form-control form-control-modern" v-model="authForm.email" placeholder="Email" required>
                      </div>

                      <div class="mb-3 field">
                        <i class="bi bi-shield-lock icon"></i>
                        <input :type="showPassword ? 'text' : 'password'" class="form-control form-control-modern" v-model="authForm.password" placeholder="Password" required>
                        <button type="button" class="toggle-password" @click="showPassword = !showPassword" :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'">
                          <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                        </button>
                      </div>

                      <div v-if="authMode==='register'" class="mb-3 field">
                        <i class="bi bi-lock-fill icon"></i>
                        <input :type="showConfirmPassword ? 'text' : 'password'" class="form-control form-control-modern" v-model="authForm.confirmPassword" placeholder="Konfirmasi Password" required>
                        <button type="button" class="toggle-password" @click="showConfirmPassword = !showConfirmPassword" :aria-label="showConfirmPassword ? 'Sembunyikan konfirmasi' : 'Tampilkan konfirmasi'">
                          <i :class="showConfirmPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                        </button>
                      </div>

                      <button type="submit" class="btn btn-gradient w-100 py-2 mb-2" :disabled="authLoading">
                        <span v-if="!authLoading">{{ authMode==='login' ? 'Masuk' : 'Daftar Sekarang' }}</span>
                        <span v-else>Memproses...</span>
                      </button>

                      <div class="text-center small text-muted">
                        {{ authMode==='login' ? 'Belum punya akun?' : 'Sudah punya akun?' }}
                        <a href="#" @click.prevent="switchAuthMode" class="fw-semibold">
                          {{ authMode==='login' ? 'Daftar di sini' : 'Login di sini' }}
                        </a>
                      </div>

                      <div class="mt-3 small text-muted text-center d-none">
                        Dengan melanjutkan, Anda menyetujui Ketentuan & Kebijakan Privasi.
                      </div>
                    </form>
                  </div>
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