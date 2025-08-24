Vue.component('report', {
    props: ['user', 'supabase'],
    data() {
        return {
            currentMonth: new Date().getMonth(),
            currentYear: new Date().getFullYear(),
            monthlyData: {
                totalTasks: 0,
                completedTasks: 0,
                incompleteTasks: 0,
                totalScore: 0,
                dailyStats: []
            },
            loading: false,
            chartInstance: null,
            taskDistributionChartInstance: null,
            dailyPerformanceChartInstance: null
        }
    },
    template: `
        <div class="fade-in">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>📊 Laporan Produktivitas</h2>
                <div class="d-flex align-items-center gap-2">
                    <button class="btn btn-outline-secondary btn-sm" @click="prevMonth" title="Bulan sebelumnya">⟨</button>
                    <select class="form-select" v-model="currentMonth" @change="loadMonthlyReport">
                        <option v-for="(month, index) in monthNames" :key="index" :value="index">{{ month }}</option>
                    </select>
                    <select class="form-select" v-model="currentYear" @change="loadMonthlyReport">
                        <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                    </select>
                    <button class="btn btn-outline-secondary btn-sm" @click="nextMonth" title="Bulan berikutnya">⟩</button>
                </div>
            </div>

            <div v-if="loading" class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Memuat laporan...</p>
            </div>

            <div v-else>
                <!-- Summary Cards -->
                <div class="row mb-4">
                    <div class="col-md-3 mb-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5 class="card-title text-primary">{{ monthlyData.totalTasks }}</h5>
                                <p class="card-text">Total Task</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5 class="card-title text-success">{{ monthlyData.completedTasks }}</h5>
                                <p class="card-text">Task Selesai</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5 class="card-title text-warning">{{ monthlyData.incompleteTasks }}</h5>
                                <p class="card-text">Task Belum Selesai</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="card text-center">
                            <div class="card-body">
                                <h5 class="card-title" :class="monthlyData.totalScore >= 0 ? 'text-success' : 'text-danger'">
                                    {{ monthlyData.totalScore >= 0 ? '+' : '' }}{{ monthlyData.totalScore }}
                                </h5>
                                <p class="card-text">Total Skor</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Completion Rate -->
                <div class="row mb-4">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">📈 Tingkat Penyelesaian</h5>
                            </div>
                            <div class="card-body text-center">
                                <div class="display-4 mb-3" :class="completionRate >= 80 ? 'text-success' : completionRate >= 60 ? 'text-warning' : 'text-danger'">
                                    {{ completionRate }}%
                                </div>
                                <div class="progress mb-3">
                                    <div class="progress-bar" :class="completionRate >= 80 ? 'bg-success' : completionRate >= 60 ? 'bg-warning' : 'bg-danger'" 
                                         :style="{ width: completionRate + '%' }"></div>
                                </div>
                                <p class="text-muted">{{ getCompletionMessage() }}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="mb-0">🎯 Distribusi Task</h5>
                            </div>
                            <div class="card-body">
                                <canvas id="taskDistributionChart" width="400" height="300"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Daily Performance Chart -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">📊 Performa Harian</h5>
                    </div>
                    <div class="card-body">
                        <canvas id="dailyPerformanceChart" width="400" height="200"></canvas>
                    </div>
                </div>

                <!-- Calendar Heatmap -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">🗓️ Kalender Produktivitas</h5>
                        <small class="text-muted">Warna lebih gelap = produktivitas lebih tinggi</small>
                    </div>
                    <div class="card-body">
                        <div class="calendar-heatmap">
                            <div class="row">
                                <div v-for="week in calendarWeeks" :key="week.weekNumber" class="col-12 mb-2">
                                    <div class="d-flex gap-1">
                                        <div v-for="day in week.days" :key="day.date" 
                                             class="calendar-day" 
                                             :class="getHeatmapClass(day.score)"
                                             :title="getHeatmapTooltip(day)">
                                            {{ day.day }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="mt-3 d-flex align-items-center gap-2">
                                <small class="text-muted">Kurang</small>
                                <div class="heatmap-legend d-flex gap-1">
                                    <div class="legend-item heatmap-0"></div>
                                    <div class="legend-item heatmap-1"></div>
                                    <div class="legend-item heatmap-2"></div>
                                    <div class="legend-item heatmap-3"></div>
                                    <div class="legend-item heatmap-4"></div>
                                </div>
                                <small class="text-muted">Tinggi</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Detailed Table -->
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">📋 Detail Harian</h5>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Total Task</th>
                                        <th>Selesai</th>
                                        <th>Belum Selesai</th>
                                        <th>Tingkat Selesai</th>
                                        <th>Skor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="day in monthlyData.dailyStats" :key="day.date">
                                        <td>{{ formatDate(day.date) }}</td>
                                        <td>{{ day.totalTasks }}</td>
                                        <td class="text-success">{{ day.completedTasks }}</td>
                                        <td class="text-warning">{{ day.incompleteTasks }}</td>
                                        <td>
                                            <div class="d-flex align-items-center">
                                                <span class="me-2">{{ day.completionRate }}%</span>
                                                <div class="progress flex-grow-1" style="height: 8px;">
                                                    <div class="progress-bar" :style="{ width: day.completionRate + '%' }"></div>
                                                </div>
                                            </div>
                                        </td>
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
    `,
    computed: {
        monthNames() {
            return [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ]
        },
        
        availableYears() {
            const currentYear = new Date().getFullYear()
            return [currentYear - 1, currentYear, currentYear + 1]
        },
        
        completionRate() {
            if (this.monthlyData.totalTasks === 0) return 0
            return Math.round((this.monthlyData.completedTasks / this.monthlyData.totalTasks) * 100)
        },
        
        calendarWeeks() {
            const year = this.currentYear
            const month = this.currentMonth
            const firstDay = new Date(year, month, 1)
            const lastDay = new Date(year, month + 1, 0)
            
            const weeks = []
            let currentWeek = []
            let weekNumber = 1
            
            // Add empty cells for days before month starts
            const startDayOfWeek = firstDay.getDay()
            for (let i = 0; i < startDayOfWeek; i++) {
                currentWeek.push({ date: null, day: '', score: 0 })
            }
            
            // Add all days of the month
            for (let day = 1; day <= lastDay.getDate(); day++) {
                const date = new Date(year, month, day)
                const dateStr = date.toISOString().split('T')[0]
                const dayData = this.monthlyData.dailyStats.find(d => d.date === dateStr)
                
                currentWeek.push({
                    date: dateStr,
                    day: day,
                    score: dayData ? dayData.score : 0,
                    completionRate: dayData ? dayData.completionRate : 0,
                    totalTasks: dayData ? dayData.totalTasks : 0
                })
                
                // Start new week on Sunday
                if (date.getDay() === 6 || day === lastDay.getDate()) {
                    // Fill remaining days of week
                    while (currentWeek.length < 7) {
                        currentWeek.push({ date: null, day: '', score: 0 })
                    }
                    
                    weeks.push({
                        weekNumber: weekNumber++,
                        days: [...currentWeek]
                    })
                    currentWeek = []
                }
            }
            
            return weeks
        }
    },
    
    async mounted() {
        await this.loadMonthlyReport()
    },
    
    methods: {
        async loadMonthlyReport() {
            try {
                this.loading = true
                
                const startDate = new Date(this.currentYear, this.currentMonth, 1).toISOString().split('T')[0]
                const endDate = new Date(this.currentYear, this.currentMonth + 1, 0).toISOString().split('T')[0]
                
                // Load daily tasks for the month
                const { data: tasksData, error: tasksError } = await this.supabase
                    .from('daily_tasks_instance')
                    .select('*')
                    .eq('user_id', this.user.id)
                    .gte('date', startDate)
                    .lte('date', endDate)
                
                if (tasksError) throw tasksError
                
                // Load score logs for the month
                const { data: scoresData, error: scoresError } = await this.supabase
                    .from('score_log')
                    .select('*')
                    .eq('user_id', this.user.id)
                    .gte('date', startDate)
                    .lte('date', endDate)
                
                if (scoresError) throw scoresError
                
                // Process data
                this.processMonthlyData(tasksData || [], scoresData || [])
                
                // Render charts
                this.$nextTick(() => {
                    this.renderCharts()
                })
                
            } catch (error) {
                console.error('Error loading monthly report:', error)
                alert('Gagal memuat laporan: ' + error.message)
            } finally {
                this.loading = false
            }
        },
        
        processMonthlyData(tasksData, scoresData) {
            // Group tasks by date
            const tasksByDate = {}
            tasksData.forEach(task => {
                if (!tasksByDate[task.date]) {
                    tasksByDate[task.date] = []
                }
                tasksByDate[task.date].push(task)
            })
            
            // Group scores by date
            const scoresByDate = {}
            scoresData.forEach(score => {
                if (!scoresByDate[score.date]) {
                    scoresByDate[score.date] = 0
                }
                scoresByDate[score.date] += score.score_delta
            })
            
            // Calculate daily stats
            const dailyStats = []
            let totalTasks = 0
            let completedTasks = 0
            let totalScore = 0
            
            // Get all dates in the month
            const year = this.currentYear
            const month = this.currentMonth
            const daysInMonth = new Date(year, month + 1, 0).getDate()
            
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day).toISOString().split('T')[0]
                const dayTasks = tasksByDate[date] || []
                const dayCompleted = dayTasks.filter(t => t.is_completed).length
                const dayScore = scoresByDate[date] || 0
                
                const dayStats = {
                    date: date,
                    totalTasks: dayTasks.length,
                    completedTasks: dayCompleted,
                    incompleteTasks: dayTasks.length - dayCompleted,
                    completionRate: dayTasks.length > 0 ? Math.round((dayCompleted / dayTasks.length) * 100) : 0,
                    score: dayScore
                }
                
                dailyStats.push(dayStats)
                
                totalTasks += dayTasks.length
                completedTasks += dayCompleted
                totalScore += dayScore
            }
            
            this.monthlyData = {
                totalTasks,
                completedTasks,
                incompleteTasks: totalTasks - completedTasks,
                totalScore,
                dailyStats
            }
        },
        
        renderCharts() {
            this.renderTaskDistributionChart()
            this.renderDailyPerformanceChart()
        },
        
        renderTaskDistributionChart() {
            const ctx = document.getElementById('taskDistributionChart')
            if (!ctx) return
            if (this.taskDistributionChartInstance) {
                this.taskDistributionChartInstance.destroy()
                this.taskDistributionChartInstance = null
            }
            this.taskDistributionChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Selesai', 'Belum Selesai'],
                    datasets: [{
                        data: [this.monthlyData.completedTasks, this.monthlyData.incompleteTasks],
                        backgroundColor: ['#198754', '#ffc107'],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                }
            })
        },
        
        renderDailyPerformanceChart() {
            const ctx = document.getElementById('dailyPerformanceChart')
            if (!ctx) return
            if (this.dailyPerformanceChartInstance) {
                this.dailyPerformanceChartInstance.destroy()
                this.dailyPerformanceChartInstance = null
            }
            const labels = this.monthlyData.dailyStats.map(day => new Date(day.date).getDate().toString())
            const completionRates = this.monthlyData.dailyStats.map(day => day.completionRate)
            const scores = this.monthlyData.dailyStats.map(day => day.score)
            this.dailyPerformanceChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        { label: 'Tingkat Penyelesaian (%)', data: completionRates, borderColor: '#0d6efd', backgroundColor: 'rgba(13,110,253,0.1)', yAxisID: 'y', tension: 0.35 },
                        { label: 'Skor Harian', data: scores, borderColor: '#198754', backgroundColor: 'rgba(25,135,84,0.1)', yAxisID: 'y1', tension: 0.35 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                        x: { title: { display: true, text: 'Tanggal' } },
                        y: { type: 'linear', position: 'left', title: { display: true, text: 'Tingkat Penyelesaian (%)' }, min: 0, max: 100 },
                        y1: { type: 'linear', position: 'right', title: { display: true, text: 'Skor' }, grid: { drawOnChartArea: false } }
                    }
                }
            })
        },
        
        prevMonth() {
            const d = new Date(this.currentYear, this.currentMonth - 1, 1)
            this.currentYear = d.getFullYear()
            this.currentMonth = d.getMonth()
            this.loadMonthlyReport()
        },
        nextMonth() {
            const d = new Date(this.currentYear, this.currentMonth + 1, 1)
            this.currentYear = d.getFullYear()
            this.currentMonth = d.getMonth()
            this.loadMonthlyReport()
        },
        
        getHeatmapClass(score) {
            if (score >= 5) return 'heatmap-4'
            if (score >= 3) return 'heatmap-3'
            if (score >= 1) return 'heatmap-2'
            if (score > -1) return 'heatmap-1'
            return 'heatmap-0'
        },
        
        getHeatmapTooltip(day) {
            if (!day.date) return ''
            return `${this.formatDate(day.date)}: ${day.totalTasks} task, ${day.completionRate}% selesai, skor ${day.score}`
        },
        
        getCompletionMessage() {
            const rate = this.completionRate
            if (rate >= 90) return "🏆 Luar biasa! Konsistensi tinggi!"
            if (rate >= 80) return "⭐ Sangat baik! Terus pertahankan!"
            if (rate >= 70) return "👍 Bagus! Sedikit lagi sempurna!"
            if (rate >= 60) return "💪 Cukup baik, bisa ditingkatkan!"
            if (rate >= 50) return "⚡ Perlu fokus lebih pada penyelesaian!"
            return "🚀 Mari tingkatkan produktivitas!"
        },
        
        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short'
            })
        }
    }
})

