/**
 * Data Service Layer dengan Smart Caching
 * Mengelola semua API calls dan implementasi caching otomatis
 */

class DataService {
  constructor(supabaseClient, stateManager) {
    this.supabase = supabaseClient;
    this.state = stateManager;
  }

  /**
   * Generic method untuk fetch data dengan caching
   */
  async fetchWithCache(cacheKey, fetchFunction, forceRefresh = false) {
    try {
      // Jika tidak force refresh, cek cache dulu
      if (!forceRefresh) {
        const cachedData = this.state.getFromCache(cacheKey);
        if (cachedData !== null) {
          return { data: cachedData, fromCache: true };
        }
      }

      // Fetch data dari API
      console.log(`🌐 Fetching fresh data for: ${cacheKey}`);
      const result = await fetchFunction();

      if (result.error) {
        throw result.error;
      }

      // Cache hasil
      this.state.setCache(cacheKey, result.data);
      return { data: result.data, fromCache: false };
    } catch (error) {
      console.error(`Error fetching ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Fetch today tasks dengan caching
   */
  async getTodayTasks(userId, today, forceRefresh = false) {
    const cacheKey = 'todayTasks';

    return this.fetchWithCache(
      cacheKey,
      async () => {
        const result = await this.supabase
          .from('productivity_task_instances')
          .select('*')
          .eq('user_id', userId)
          .eq('task_date', today)
          .order('created_at', { ascending: true });

        // Filter deadline tasks: hanya tampil jika deadline = hari ini
        if (result.data) {
          result.data = result.data.filter((task) => {
            // Jika bukan deadline task, tampilkan
            if (task.task_type !== 'deadline') return true;

            // Jika deadline task, hanya tampil jika deadline_date = hari ini
            return task.deadline_date === today;
          });
        }

        return result;
      },
      forceRefresh,
    );
  }

  /**
   * Fetch templates dengan caching
   */
  async getTemplates(userId, forceRefresh = false) {
    const cacheKey = 'templates';

    return this.fetchWithCache(
      cacheKey,
      async () => {
        return await this.supabase
          .from('productivity_task_templates')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });
      },
      forceRefresh,
    );
  }

  /**
   * Fetch today score dengan caching
   */
  async getTodayScore(userId, today, forceRefresh = false) {
    const cacheKey = 'todayScore';

    return this.fetchWithCache(
      cacheKey,
      async () => {
        const result = await this.supabase
          .from('productivity_score_logs')
          .select('score_delta')
          .eq('user_id', userId)
          .eq('log_date', today);

        const totalScore = (result.data || []).reduce((sum, r) => sum + (r.score_delta || 0), 0);
        return { data: totalScore };
      },
      forceRefresh,
    );
  }

  /**
   * Fetch user profile dengan caching
   */
  async getUserProfile(userId, forceRefresh = false) {
    const cacheKey = 'userProfile';

    return this.fetchWithCache(
      cacheKey,
      async () => {
        return await this.supabase.from('user_profiles').select('*').eq('user_id', userId).single();
      },
      forceRefresh,
    );
  }

  /**
   * Toggle task dengan optimistic update
   */
  async toggleTask(taskId, userId, newStatus, taskName) {
    try {
      const now = new Date().toISOString();

      // Optimistic update - update cache immediately
      this.state.updateCacheItem('todayTasks', taskId, {
        is_completed: newStatus,
        completed_at: newStatus ? now : null,
      });

      // Then update database
      const { error } = await this.supabase
        .from('productivity_task_instances')
        .update({ is_completed: newStatus, completed_at: newStatus ? now : null })
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;

      // Log score change
      const reward = Number.isFinite(parseFloat(window.userScoreReward))
        ? parseFloat(window.userScoreReward)
        : 1;
      const delta = newStatus ? reward : -reward;

      await this.logScoreChange(
        userId,
        delta,
        newStatus ? `Menyelesaikan: ${taskName}` : `Membatalkan: ${taskName}`,
      );

      // Invalidate today score cache untuk refresh
      this.state.invalidateCache('todayScore');

      return { success: true };
    } catch (error) {
      // Rollback optimistic update jika gagal
      this.state.updateCacheItem('todayTasks', taskId, {
        is_completed: !newStatus,
        completed_at: !newStatus ? new Date().toISOString() : null,
      });
      throw error;
    }
  }

  /**
   * Add new ad-hoc task dengan optimistic update
   */
  async addAdHocTask(userId, taskName, today) {
    try {
      const tempId = `temp_${Date.now()}`;
      const newTask = {
        id: tempId,
        user_id: userId,
        template_id: null,
        task_name: taskName.trim(),
        priority: 'medium',
        category: null,
        task_date: today,
        task_type: 'daily',
        is_completed: false,
        created_at: new Date().toISOString(),
      };

      // Optimistic update
      this.state.addCacheItem('todayTasks', newTask);

      // Insert to database
      const { data, error } = await this.supabase
        .from('productivity_task_instances')
        .insert([
          {
            user_id: userId,
            template_id: null,
            task_name: taskName.trim(),
            priority: 'medium',
            category: null,
            task_type: 'daily',
            task_date: today,
            is_completed: false,
          },
        ])
        .select();

      if (error) throw error;

      // Update cache dengan real ID
      this.state.removeCacheItem('todayTasks', tempId);
      this.state.addCacheItem('todayTasks', data[0]);

      return { success: true, data: data[0] };
    } catch (error) {
      // Rollback optimistic update
      this.state.removeCacheItem('todayTasks', tempId);
      throw error;
    }
  }

  /**
   * Delete ad-hoc task dengan optimistic update
   */
  async deleteAdHocTask(taskId, userId) {
    try {
      // Get task data untuk rollback
      const cached = this.state.getFromCache('todayTasks');
      const toRestore = cached?.find((t) => t.id === taskId);

      // Optimistic update
      this.state.removeCacheItem('todayTasks', taskId);

      // Delete from database
      const { error } = await this.supabase
        .from('productivity_task_instances')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      // Rollback optimistic update
      if (toRestore) {
        this.state.addCacheItem('todayTasks', toRestore);
      }
      throw error;
    }
  }

  /**
   * Log score change
   */
  async logScoreChange(userId, delta, reason) {
    try {
      const today = window.WITA?.today ? window.WITA.today() : new Date().toISOString().slice(0, 10);

      const { error } = await this.supabase.from('productivity_score_logs').insert([
        { user_id: userId, log_date: today, score_delta: delta, reason },
      ]);

      if (error) throw error;
    } catch (e) {
      console.error('Error logging score change:', e);
    }
  }

  /**
   * Sync dari templates (untuk checklist initialization)
   */
  async syncFromTemplates(userId, today) {
    try {
      // Get templates
      const { data: templates } = await this.getTemplates(userId);

      // Get existing tasks
      const { data: existing } = await this.supabase
        .from('productivity_task_instances')
        .select('template_id')
        .eq('user_id', userId)
        .eq('task_date', today);

      const existingIds = new Set((existing || []).map((i) => i.template_id).filter(Boolean));

      // Filter templates that need to be created
      const toInsert = (templates || [])
        .filter((t) => !existingIds.has(t.id))
        .filter((t) => {
          const kind = t.task_type || 'daily';
            if (kind === 'daily') return true;
            if (kind === 'deadline' && t.deadline_date) return t.deadline_date === today;
            return false;
        })
        .map((t) => ({
          user_id: userId,
          template_id: t.id,
          task_name: t.task_name,
          priority: t.priority,
          category: t.category,
          task_type: t.task_type || 'daily',
          deadline_date: t.deadline_date || null,
          task_date: today,
          is_completed: false,
        }));

      if (toInsert.length) {
        const { error } = await this.supabase.from('productivity_task_instances').insert(toInsert);
        if (error && error.code !== '23505') throw error;
      }

      // Refresh today tasks cache
      await this.getTodayTasks(userId, today, true);

      return { success: true, created: toInsert.length };
    } catch (e) {
      console.error('Error syncing from templates:', e);
      throw e;
    }
  }

  /**
   * Clear all cache (untuk logout)
   */
  clearAllCache() {
    this.state.invalidateCache('all');
  }
}

// Export untuk digunakan di komponen
window.DataService = DataService;
export default DataService;
