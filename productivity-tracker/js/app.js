// Daily quotes array
const DAILY_QUOTES = [
    "Kesuksesan adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan.",
    "Jangan menunggu kesempatan, ciptakanlah kesempatan itu.",
    "Produktivitas bukan tentang sibuk, tapi tentang efektif.",
    "Setiap hari adalah kesempatan baru untuk menjadi lebih baik.",
    "Konsistensi kecil setiap hari menghasilkan perubahan besar.",
    "Fokus pada progress, bukan perfection.",
    "Hari ini adalah hari yang tepat untuk memulai sesuatu yang baru.",
    "Kebiasaan baik adalah investasi terbaik untuk masa depan.",
    "Satu langkah kecil hari ini, satu lompatan besar besok.",
    "Produktivitas dimulai dari mindset yang tepat."
];

// Initialize Supabase
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'
const supabase = supabase.createClient(supabaseUrl, supabaseKey)

// Vue App
const { createApp } = Vue

createApp({
    data() {
        return {
            user: null,
            session: null,
            currentView: 'dashboard',
            loading: true,
            dailyQuote: '',
            
            // Auth forms
            authMode: 'login', // 'login' or 'register'
            authForm: {
                email: '',
                password: '',
                confirmPassword: '',
                fullName: ''
            },
            authLoading: false,
            authError: ''
        }
    },
    
    async mounted() {
        await this.initializeApp()
    },
    
    methods: {
        async initializeApp() {
            try {
                // Check existing session
                const { data: { session } } = await supabase.auth.getSession()
                
                if (session) {
                    this.session = session
                    this.user = session.user
                    await this.loadUserProfile()
                }
                
                // Listen for auth changes
                supabase.auth.onAuthStateChange(async (event, session) => {
                    this.session = session
                    this.user = session?.user || null
                    
                    if (event === 'SIGNED_IN' && this.user) {
                        await this.loadUserProfile()
                        this.currentView = 'dashboard'
                    } else if (event === 'SIGNED_OUT') {
                        this.user = null
                        this.currentView = 'dashboard'
                    }
                })
                
                // Set daily quote
                this.setDailyQuote()
                
            } catch (error) {
                console.error('Error initializing app:', error)
            } finally {
                this.loading = false
            }
        },
        
        async loadUserProfile() {
            try {
                const { data, error } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', this.user.id)
                    .single()
                
                if (error && error.code !== 'PGRST116') {
                    throw error
                }
                
                if (!data) {
                    // Create profile if doesn't exist
                    await this.createUserProfile()
                }
                
            } catch (error) {
                console.error('Error loading user profile:', error)
            }
        },
        
        async createUserProfile() {
            try {
                const { error } = await supabase
                    .from('user_profiles')
                    .insert([{
                        user_id: this.user.id,
                        email: this.user.email,
                        full_name: this.user.user_metadata?.full_name || '',
                        created_at: new Date().toISOString()
                    }])
                
                if (error) throw error
                
            } catch (error) {
                console.error('Error creating user profile:', error)
            }
        },
        
        setDailyQuote() {
            const today = new Date()
            const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24)
            this.dailyQuote = DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length]
        },
        
        // Navigation
        setView(view) {
            this.currentView = view
        },
        
        // Authentication
        async handleAuth() {
            this.authError = ''
            this.authLoading = true
            
            try {
                if (this.authMode === 'register') {
                    await this.register()
                } else {
                    await this.login()
                }
            } catch (error) {
                this.authError = error.message
            } finally {
                this.authLoading = false
            }
        },
        
        async login() {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: this.authForm.email,
                password: this.authForm.password
            })
            
            if (error) throw error
            
            this.resetAuthForm()
        },
        
        async register() {
            if (this.authForm.password !== this.authForm.confirmPassword) {
                throw new Error('Password tidak cocok')
            }
            
            const { data, error } = await supabase.auth.signUp({
                email: this.authForm.email,
                password: this.authForm.password,
                options: {
                    data: {
                        full_name: this.authForm.fullName
                    }
                }
            })
            
            if (error) throw error
            
            if (data.user && !data.session) {
                alert('Silakan cek email Anda untuk verifikasi akun!')
            }
            
            this.resetAuthForm()
        },
        
        async logout() {
            try {
                const { error } = await supabase.auth.signOut()
                if (error) throw error
                
                this.user = null
                this.session = null
                this.currentView = 'dashboard'
                
            } catch (error) {
                console.error('Error logging out:', error)
                alert('Gagal logout: ' + error.message)
            }
        },
        
        resetAuthForm() {
            this.authForm = {
                email: '',
                password: '',
                confirmPassword: '',
                fullName: ''
            }
        },
        
        switchAuthMode() {
            this.authMode = this.authMode === 'login' ? 'register' : 'login'
            this.authError = ''
            this.resetAuthForm()
        },
        
        // Utility methods
        formatUserName() {
            if (this.user?.user_metadata?.full_name) {
                return this.user.user_metadata.full_name
            }
            return this.user?.email?.split('@')[0] || 'User'
        }
    },
    
    template: `
        <div id="app">
            <!-- Loading Screen -->
            <div v-if="loading" class="d-flex justify-content-center align-items-center" style="height: 100vh;">
                <div class="text-center">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p>Memuat aplikasi...</p>
                </div>
            </div>
            
            <!-- Main App -->
            <div v-else>
                <!-- Navigation -->
                <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
                    <div class="container">
                        <a class="navbar-brand" href="#">
                            📊 Productivity Tracker
                        </a>
                        
                        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                            <span class="navbar-toggler-icon"></span>
                        </button>
                        
                        <div class="collapse navbar-collapse" id="navbarNav">
                            <ul class="navbar-nav me-auto">
                                <li class="nav-item">
                                    <a class="nav-link" :class="{ active: currentView === 'dashboard' }" 
                                       href="#" @click.prevent="setView('dashboard')">
                                        🏠 Dashboard
                                    </a>
                                </li>
                                <li v-if="user" class="nav-item">
                                    <a class="nav-link" :class="{ active: currentView === 'checklist' }" 
                                       href="#" @click.prevent="setView('checklist')">
                                        ✅ Checklist
                                    </a>
                                </li>
                                <li v-if="user" class="nav-item">
                                    <a class="nav-link" :class="{ active: currentView === 'tasks' }" 
                                       href="#" @click.prevent="setView('tasks')">
                                        🎯 Task Manager
                                    </a>
                                </li>
                                <li v-if="user" class="nav-item">
                                    <a class="nav-link" :class="{ active: currentView === 'report' }" 
                                       href="#" @click.prevent="setView('report')">
                                        📊 Report
                                    </a>
                                </li>
                            </ul>
                            
                            <ul class="navbar-nav">
                                <li v-if="!user" class="nav-item">
                                    <a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#authModal">
                                        🔐 Login
                                    </a>
                                </li>
                                <li v-if="user" class="nav-item dropdown">
                                    <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                                        👤 {{ formatUserName() }}
                                    </a>
                                    <ul class="dropdown-menu">
                                        <li><a class="dropdown-item" href="#" @click.prevent="logout">Logout</a></li>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                </nav>
                
                <!-- Main Content -->
                <div class="container mt-4">
                    <!-- Guest View -->
                    <div v-if="!user && currentView === 'dashboard'">
                        <div class="row justify-content-center">
                            <div class="col-lg-8">
                                <div class="text-center mb-5">
                                    <h1 class="display-4 mb-3">📊 Productivity Tracker</h1>
                                    <p class="lead">Kelola tugas harian Anda dengan sistem scoring yang memotivasi!</p>
                                    <button class="btn btn-primary btn-lg" data-bs-toggle="modal" data-bs-target="#authModal">
                                        Mulai Sekarang
                                    </button>
                                </div>
                                
                                <div class="row">
                                    <div class="col-md-4 mb-4">
                                        <div class="card h-100 text-center">
                                            <div class="card-body">
                                                <div class="display-4 text-primary mb-3">✅</div>
                                                <h5>Task Management</h5>
                                                <p class="text-muted">Kelola tugas harian dengan template yang dapat disesuaikan</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4 mb-4">
                                        <div class="card h-100 text-center">
                                            <div class="card-body">
                                                <div class="display-4 text-success mb-3">⚡</div>
                                                <h5>Scoring System</h5>
                                                <p class="text-muted">Sistem poin yang memotivasi untuk menyelesaikan tugas</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-4 mb-4">
                                        <div class="card h-100 text-center">
                                            <div class="card-body">
                                                <div class="display-4 text-info mb-3">📊</div>
                                                <h5>Progress Tracking</h5>
                                                <p class="text-muted">Laporan visual untuk melihat perkembangan produktivitas</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- User Views -->
                    <div v-if="user">
                        <dashboard v-if="currentView === 'dashboard'" 
                                  :user="user" 
                                  :supabase="supabase" 
                                  :daily-quote="dailyQuote">
                        </dashboard>
                        
                        <checklist v-if="currentView === 'checklist'" 
                                  :user="user" 
                                  :supabase="supabase">
                        </checklist>
                        
                        <task-manager v-if="currentView === 'tasks'" 
                                     :user="user" 
                                     :supabase="supabase">
                        </task-manager>
                        
                        <report v-if="currentView === 'report'" 
                               :user="user" 
                               :supabase="supabase">
                        </report>
                    </div>
                </div>
                
                <!-- Auth Modal -->
                <div class="modal fade" id="authModal" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    {{ authMode === 'login' ? '🔐 Login' : '📝 Daftar Akun' }}
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <form @submit.prevent="handleAuth">
                                    <div v-if="authError" class="alert alert-danger">
                                        {{ authError }}
                                    </div>
                                    
                                    <div v-if="authMode === 'register'" class="mb-3">
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
                                    
                                    <div v-if="authMode === 'register'" class="mb-3">
                                        <label class="form-label">Konfirmasi Password</label>
                                        <input type="password" class="form-control" v-model="authForm.confirmPassword" required>
                                    </div>
                                    
                                    <button type="submit" class="btn btn-primary w-100" :disabled="authLoading">
                                        {{ authLoading ? 'Memproses...' : (authMode === 'login' ? 'Login' : 'Daftar') }}
                                    </button>
                                </form>
                                
                                <hr>
                                
                                <div class="text-center">
                                    <p class="mb-0">
                                        {{ authMode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?' }}
                                        <a href="#" @click.prevent="switchAuthMode">
                                            {{ authMode === 'login' ? 'Daftar di sini' : 'Login di sini' }}
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}).mount('#app')

