Vue.component('dashboard', {
    props: ['user', 'supabase', 'dailyQuote'],
    data() {
        return {
            todayScore: 0,
            totalScore: 0,
            todayTasks: [],
            incompleteTasks: [],
            weeklyScores: [],
            completionRatio: 0,
            loading: true
        }
    },
    template: `
        <div>
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

            <div class="row mb-4">
                <div class="col-md-3 mb-3">
                    <div class="card stats-card">
                        <div class="card-body">
                            <span class="stats-number" :class="todayScore >= 0 ? 'score-positive' : 'score-negative'">
                                {{ todayScore >= 0 ? '+' : '' }}{{ todayScore }}
                            </span>
                            <small class="text-muted">Skor Hari Ini</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card stats-card">
                        <div class="card-body">
                            <span class="stats-number text-primary">{{ totalScore }}</span>
                            <small class="text-muted">Total Skor</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card stats-card">
                        <div class="card-body">
                            <span class="stats-number text-info">{{ completionRatio }}%</span>
                            <small class="text-muted">Rasio Selesai</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card stats-card">
                        <div class="card-body">
                            <span class="stats-number text-warning">{{ incompleteTasks.length }}</span>
                            <small class="text-muted">Belum Selesai</small>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-8 mb-4">
                    <div class="card">
                        <div class="card-header">
                            <h5 class="mb-0">📈 Progress Mingguan</h5>
                        </div>
                        <div class="card-body">
                            <canvas id="weeklyChart" width="400" height="200"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-4">
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
                                     :class="'priority-' + task.priority">
                                    <div>
                                        <small class="fw-bold">{{ task.task_name }}</small>
                                        <br>
                                        <span class="badge" :class="getPriorityBadgeClass(task.priority)">
                                            {{ task.priority }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    async mounted() {
        await this.loadDashboardData()
        this.renderWeeklyChart()
    },
    methods: {
        async loadDashboardData() {
            try {
                const today = new Date().toISOString().split('T')[0]
                
                // Load today's score
                const { data: todayScoreData } = await this.supabase
                    .from('score_log')
                    .select('score_delta')
                    .eq('user_id', this.user.id)
                    .eq('date', today)
                
                this.todayScore = todayScoreData?.reduce((sum, log) => sum + log.score_delta, 0) || 0
                
                // Load total score
                const { data: totalScoreData } = await this.supabase
                    .from('score_log')
                    .select('score_delta')
                    .eq('user_id', this.user.id)
                
                this.totalScore = totalScoreData?.reduce((sum, log) => sum + log.score_delta, 0) || 0
                
                // Load today's tasks
                const { data: todayTasksData } = await this.supabase
                    .from('daily_tasks_instance')
                    .select('*')
                    .eq('user_id', this.user.id)
                    .eq('date', today)
                
                this.todayTasks = todayTasksData || []
                this.incompleteTasks = this.todayTasks.filter(task => !task.is_completed)
                
                // Calculate completion ratio
                if (this.todayTasks.length > 0) {
                    const completed = this.todayTasks.filter(task => task.is_completed).length
                    this.completionRatio = Math.round((completed / this.todayTasks.length) * 100)
                }
                
                // Load weekly scores
                await this.loadWeeklyScores()
                
                this.loading = false
            } catch (error) {
                console.error('Error loading dashboard data:', error)
                this.loading = false
            }
        },
        
        async loadWeeklyScores() {
            const dates = []
            const scores = []
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date()
                date.setDate(date.getDate() - i)
                const dateStr = date.toISOString().split('T')[0]
                
                const { data } = await this.supabase
                    .from('score_log')
                    .select('score_delta')
                    .eq('user_id', this.user.id)
                    .eq('date', dateStr)
                
                const dayScore = data?.reduce((sum, log) => sum + log.score_delta, 0) || 0
                
                dates.push(date.toLocaleDateString('id-ID', { weekday: 'short' }))
                scores.push(dayScore)
            }
            
            this.weeklyScores = { dates, scores }
        },
        
        renderWeeklyChart() {
            this.$nextTick(() => {
                const ctx = document.getElementById('weeklyChart')
                if (ctx && this.weeklyScores.dates) {
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: this.weeklyScores.dates,
                            datasets: [{
                                label: 'Skor Harian',
                                data: this.weeklyScores.scores,
                                borderColor: '#0d6efd',
                                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                                tension: 0.4,
                                fill: true
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: {
                                        color: 'rgba(0,0,0,0.1)'
                                    }
                                },
                                x: {
                                    grid: {
                                        color: 'rgba(0,0,0,0.1)'
                                    }
                                }
                            },
                            plugins: {
                                legend: {
                                    display: false
                                }
                            }
                        }
                    })
                }
            })
        },
        
        getPriorityBadgeClass(priority) {
            const classes = {
                'tinggi': 'bg-danger',
                'sedang': 'bg-warning text-dark',
                'rendah': 'bg-success'
            }
            return classes[priority] || 'bg-secondary'
        }
    }
})
