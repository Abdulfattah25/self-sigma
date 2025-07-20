Vue.component('checklist', {
    props: ['user', 'supabase'],
    data() {
        return {
            todayTasks: [],
            loading: false,
            today: new Date().toISOString().split('T')[0],
            completedCount: 0,
            totalCount: 0,
            newAdHocTask: ''
        }
    },
    template: `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>✅ Checklist Hari Ini</h2>
                    <small class="text-muted">{{ formatDate(today) }}</small>
                </div>
                <div class="text-end">
                    <div class="badge bg-primary fs-6 mb-2">
                        {{ completedCount }} / {{ totalCount }} selesai
                    </div>
                    <div class="progress" style="width: 200px;">
                        <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
                    </div>
                </div>
            </div>

            <!-- Add Ad-hoc Task -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row align-items-end">
                        <div class="col-md-8">
                            <label class="form-label">Tambah Task Tambahan (Tidak dari Template)</label>
                            <input type="text" class="form-control" v-model="newAdHocTask" 
                                   placeholder="Contoh: Meeting dengan klien" 
                                   @keyup.enter="addAdHocTask">
                        </div>
                        <div class="col-md-4">
                            <button class="btn btn-outline-primary w-100" @click="addAdHocTask" 
                                    :disabled="!newAdHocTask.trim()">
                                + Tambah Task
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tasks List -->
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">📋 Daftar Task</h5>
                    <button class="btn btn-sm btn-outline-secondary" @click="loadTodayTasks">
                        🔄 Refresh
                    </button>
                </div>
                <div class="card-body">
                    <div v-if="loading" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    
                    <div v-else-if="todayTasks.length === 0" class="text-center text-muted py-4">
                        <p>📝 Belum ada task untuk hari ini.</p>
                        <p>Task dari template akan otomatis muncul, atau Anda bisa menambah task tambahan di atas.</p>
                    </div>
                    
                    <div v-else class="task-list">
                        <div v-for="task in sortedTasks" :key="task.id" 
                             class="task-item d-flex align-items-center p-3 mb-3 border rounded"
                             :class="[
                                 task.is_completed ? 'task-completed bg-light' : '',
                                 'priority-' + (task.priority || 'sedang')
                             ]">
                            
                            <div class="form-check me-3">
                                <input class="form-check-input" type="checkbox" 
                                       :id="'task-' + task.id"
                                       :checked="task.is_completed"
                                       @change="toggleTask(task)"
                                       :disabled="loading">
                            </div>
                            
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 class="mb-1" :class="task.is_completed ? 'text-muted' : ''">
                                            {{ task.task_name }}
                                        </h6>
                                        <div class="d-flex gap-2 align-items-center">
                                            <span v-if="task.priority" 
                                                  class="badge badge-sm" 
                                                  :class="getPriorityBadgeClass(task.priority)">
                                                {{ task.priority }}
                                            </span>
                                            <span v-if="task.category" 
                                                  class="badge bg-light text-dark badge-sm">
                                                {{ task.category }}
                                            </span>
                                            <span v-if="!task.task_id" 
                                                  class="badge bg-info text-white badge-sm">
                                                Ad-hoc
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div class="text-end">
                                        <small v-if="task.is_completed && task.checked_at" class="text-success d-block">
                                            ✅ {{ formatTime(task.checked_at) }}
                                        </small>
                                        <button v-if="!task.task_id" 
                                                class="btn btn-sm btn-outline-danger mt-1"
                                                @click="deleteAdHocTask(task.id)"
                                                title="Hapus task ad-hoc">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Daily Summary -->
            <div class="row mt-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5 class="card-title">🎯 Progress Hari Ini</h5>
                            <div class="display-6 mb-2" :class="progressPercentage >= 80 ? 'text-success' : progressPercentage >= 50 ? 'text-warning' : 'text-danger'">
                                {{ progressPercentage }}%
                            </div>
                            <p class="text-muted">{{ getMotivationalMessage() }}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5 class="card-title">⚡ Skor Hari Ini</h5>
                            <div class="display-6 mb-2" :class="todayScore >= 0 ? 'text-success' : 'text-danger'">
                                {{ todayScore >= 0 ? '+' : '' }}{{ todayScore }}
                            </div>
                            <p class="text-muted">{{ getScoreMessage() }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    computed: {
        progressPercentage() {
            return this.totalCount > 0 ? Math.round((this.completedCount / this.totalCount) * 100) : 0
        },
        
        sortedTasks() {
            const priorityOrder = { 'tinggi': 3, 'sedang': 2, 'rendah': 1 }
            return [...this.todayTasks].sort((a, b) => {
                // Completed tasks go to bottom
                if (a.is_completed !== b.is_completed) {
                    return a.is_completed ? 1 : -1
                }
                // Sort by priority
                const aPriority = priorityOrder[a.priority] || 2
                const bPriority = priorityOrder[b.priority] || 2
                return bPriority - aPriority
            })
        },
        
        todayScore() {
            return this.completedCount - (this.totalCount - this.completedCount)
        }
    },
    async mounted() {
        await this.initializeTodayTasks()
    },
    methods: {
        async initializeTodayTasks() {
            try {
                this.loading = true
                
                // First, check if today's tasks already exist
                const { data: existingTasks } = await this.supabase
                    .from('daily_tasks_instance')
                    .select('*')
                    .eq('user_id', this.user.id)
                    .eq('date', this.today)
                
                if (!existingTasks || existingTasks.length === 0) {
                    // Create today's tasks from templates
                    await this.createTodayTasksFromTemplates()
                }
                
                // Load today's tasks
                await this.loadTodayTasks()
                
            } catch (error) {
                console.error('Error initializing today tasks:', error)
            } finally {
                this.loading = false
            }
        },
        
        async createTodayTasksFromTemplates() {
            try {
                // Get all templates
                const { data: templates } = await this.supabase
                    .from('daily_tasks_template')
                    .select('*')
                    .eq('user_id', this.user.id)
                
                if (templates && templates.length > 0) {
                    // Create instances for today
                    const instances = templates.map(template => ({
                        user_id: this.user.id,
                        task_id: template.id,
                        task_name: template.task_name,
                        priority: template.priority,
                        category: template.category,
                        date: this.today,
                        is_completed: false
                    }))
                    
                    const { error } = await this.supabase
                        .from('daily_tasks_instance')
                        .insert(instances)
                    
                    if (error) throw error
                }
            } catch (error) {
                console.error('Error creating today tasks from templates:', error)
            }
        },
        
        async loadTodayTasks() {
            try {
                this.loading = true
                
                const { data, error } = await this.supabase
                    .from('daily_tasks_instance')
                    .select('*')
                    .eq('user_id', this.user.id)
                    .eq('date', this.today)
                    .order('created_at', { ascending: true })
                
                if (error) throw error
                
                this.todayTasks = data || []
                this.updateCounts()
                
            } catch (error) {
                console.error('Error loading today tasks:', error)
                alert('Gagal memuat task hari ini: ' + error.message)
            } finally {
                this.loading = false
            }
        },
        
        async toggleTask(task) {
            try {
                const newStatus = !task.is_completed
                const now = new Date().toISOString()
                
                // Update task status
                const { error } = await this.supabase
                    .from('daily_tasks_instance')
                    .update({
                        is_completed: newStatus,
                        checked_at: newStatus ? now : null
                    })
                    .eq('id', task.id)
                    .eq('user_id', this.user.id)
                
                if (error) throw error
                
                // Update local state
                task.is_completed = newStatus
                task.checked_at = newStatus ? now : null
                
                // Log score change
                await this.logScoreChange(newStatus ? 1 : -1, 
                    newStatus ? `Menyelesaikan: ${task.task_name}` : `Membatalkan: ${task.task_name}`)
                
                this.updateCounts()
                
            } catch (error) {
                console.error('Error toggling task:', error)
                alert('Gagal mengubah status task: ' + error.message)
            }
        },
        
        async addAdHocTask() {
            if (!this.newAdHocTask.trim()) return
            
            try {
                const { data, error } = await this.supabase
                    .from('daily_tasks_instance')
                    .insert([{
                        user_id: this.user.id,
                        task_id: null, // Ad-hoc task doesn't have template
                        task_name: this.newAdHocTask.trim(),
                        priority: 'sedang',
                        category: null,
                        date: this.today,
                        is_completed: false
                    }])
                    .select()
                
                if (error) throw error
                
                // Add to local tasks
                this.todayTasks.push(data[0])
                this.updateCounts()
                
                // Clear input
                this.newAdHocTask = ''
                
            } catch (error) {
                console.error('Error adding ad-hoc task:', error)
                alert('Gagal menambahkan task: ' + error.message)
            }
        },
        
        async deleteAdHocTask(taskId) {
            if (!confirm('Yakin ingin menghapus task ini?')) return
            
            try {
                const { error } = await this.supabase
                    .from('daily_tasks_instance')
                    .delete()
                    .eq('id', taskId)
                    .eq('user_id', this.user.id)
                
                if (error) throw error
                
                // Remove from local tasks
                this.todayTasks = this.todayTasks.filter(t => t.id !== taskId)
                this.updateCounts()
                
            } catch (error) {
                console.error('Error deleting ad-hoc task:', error)
                alert('Gagal menghapus task: ' + error.message)
            }
        },
        
        async logScoreChange(delta, reason) {
            try {
                const { error } = await this.supabase
                    .from('score_log')
                    .insert([{
                        user_id: this.user.id,
                        date: this.today,
                        score_delta: delta,
                        reason: reason
                    }])
                
                if (error) throw error
                
            } catch (error) {
                console.error('Error logging score change:', error)
            }
        },
        
        updateCounts() {
            this.totalCount = this.todayTasks.length
            this.completedCount = this.todayTasks.filter(task => task.is_completed).length
        },
        
        getPriorityBadgeClass(priority) {
            const classes = {
                'tinggi': 'bg-danger',
                'sedang': 'bg-warning text-dark',
                'rendah': 'bg-success'
            }
            return classes[priority] || 'bg-secondary'
        },
        
        formatDate(dateString) {
            return new Date(dateString).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        },
        
        formatTime(dateString) {
            return new Date(dateString).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            })
        },
        
        getMotivationalMessage() {
            const percentage = this.progressPercentage
            if (percentage === 100) return "🎉 Sempurna! Semua task selesai!"
            if (percentage >= 80) return "🔥 Luar biasa! Hampir selesai!"
            if (percentage >= 60) return "💪 Bagus! Terus semangat!"
            if (percentage >= 40) return "⚡ Ayo bisa! Jangan menyerah!"
            if (percentage >= 20) return "🚀 Mulai yang bagus! Lanjutkan!"
            return "💡 Ayo mulai! Satu langkah demi satu langkah!"
        },
        
        getScoreMessage() {
            const score = this.todayScore
            if (score >= 5) return "🏆 Produktivitas tinggi!"
            if (score >= 3) return "⭐ Performa bagus!"
            if (score >= 1) return "👍 Terus tingkatkan!"
            if (score === 0) return "⚖️ Seimbang, bisa lebih baik!"
            return "📈 Fokus pada penyelesaian task!"
        }
    }
})

