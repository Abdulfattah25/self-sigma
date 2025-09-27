class DataService {
  constructor(supabaseClient, stateManager) {
    this.supabase = supabaseClient;
    this.state = stateManager;
    this._realtime = null;
  }

  async fetchWithCache(cacheKey, fetchFunction, forceRefresh = false) {
    try {
      if (!forceRefresh) {
        const cachedData = this.state.getFromCache(cacheKey);
        if (cachedData !== null) {
          return { data: cachedData, fromCache: true };
        }
      }

      if (!navigator.onLine) {
        const staleData = this.state.state.cache[cacheKey];
        if (staleData !== null) {
          return { data: staleData, fromCache: true, stale: true };
        }
        throw new Error('Tidak ada koneksi internet');
      }

      const result = await fetchFunction();
      if (result.error) throw result.error;

      this.state.setCache(cacheKey, result.data);
      return { data: result.data, fromCache: false };
    } catch (error) {
      const staleData = this.state.state.cache[cacheKey];
      if (staleData !== null) {
        return { data: staleData, fromCache: true, stale: true };
      }
      throw error;
    }
  }

  // --- Realtime subscriptions ---
  initRealtime(userId) {
    try {
      if (!this.supabase || !userId) return;
      this.teardownRealtime();

      const channel = this.supabase.channel(`changes:${userId}`);

      // daily_tasks_instance changes (todayTasks)
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_tasks_instance',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          // Invalidate and refresh todayTasks and related scores if visible
          this.state.invalidateCache('todayTasks');
          const today = window.WITA?.today?.() || new Date().toISOString().slice(0, 10);
          try {
            await this.getTodayTasks(userId, today, true);
            this.state.invalidateCache('todayScore');
            this.state.invalidateCache('totalScore');
            await Promise.all([
              this.getTodayScore(userId, today, true),
              this.getTotalScore(userId, true),
            ]);
          } catch (_) {}
        },
      );

      // daily_tasks_template changes (templates)
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_tasks_template',
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          this.state.invalidateCache('templates');
          try {
            await this.getTemplates(userId, true);
            // Ensure today instances exist after template changes
            const today = window.WITA?.today?.() || new Date().toISOString().slice(0, 10);
            await this.syncFromTemplates(userId, today);
          } catch (_) {}
        },
      );

      // score_log changes (scores)
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'score_log', filter: `user_id=eq.${userId}` },
        async () => {
          this.state.invalidateCache('todayScore');
          this.state.invalidateCache('totalScore');
          const today = window.WITA?.today?.() || new Date().toISOString().slice(0, 10);
          try {
            await Promise.all([
              this.getTodayScore(userId, today, true),
              this.getTotalScore(userId, true),
            ]);
          } catch (_) {}
        },
      );

      channel.subscribe((status) => {
        // optional: console.log('Realtime status', status)
      });

      this._realtime = channel;

      // Window focus/visibility refresh for safety
      this._onFocus = () => this.refreshOnFocus(userId);
      this._onVisibility = () => {
        if (!document.hidden) this.refreshOnFocus(userId);
      };
      window.addEventListener('focus', this._onFocus);
      document.addEventListener('visibilitychange', this._onVisibility);
    } catch (_) {}
  }

  teardownRealtime() {
    try {
      if (this._realtime) {
        this.supabase.removeChannel(this._realtime);
        this._realtime = null;
      }
      if (this._onFocus) window.removeEventListener('focus', this._onFocus);
      if (this._onVisibility) document.removeEventListener('visibilitychange', this._onVisibility);
      this._onFocus = null;
      this._onVisibility = null;
    } catch (_) {}
  }

  async refreshOnFocus(userId) {
    try {
      const today = window.WITA?.today?.() || new Date().toISOString().slice(0, 10);
      await Promise.all([
        this.getTemplates(userId, true),
        this.getTodayTasks(userId, today, true),
        this.getTodayScore(userId, today, true),
        this.getTotalScore(userId, true),
      ]);
    } catch (_) {}
  }

  async toggleTask(taskId, userId, newStatus, taskName) {
    try {
      const now = new Date().toISOString();

      this.state.updateCacheItem('todayTasks', taskId, {
        is_completed: newStatus,
        checked_at: newStatus ? now : null,
      });

      const { error } = await this.supabase
        .from('daily_tasks_instance')
        .update({ is_completed: newStatus, checked_at: newStatus ? now : null })
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;

      const reward = Number.isFinite(parseFloat(window.userScoreReward))
        ? parseFloat(window.userScoreReward)
        : 1;
      const delta = newStatus ? reward : -reward;

      await this.logScoreChange(
        userId,
        delta,
        newStatus ? `Menyelesaikan: ${taskName}` : `Membatalkan: ${taskName}`,
      );

      // Force refresh scores to ensure consistency
      this.state.invalidateCache('todayScore');
      this.state.invalidateCache('totalScore');

      // Immediately update cache with new values
      try {
        const today = window.WITA?.today?.() || new Date().toISOString().slice(0, 10);
        await Promise.all([
          this.getTodayScore(userId, today, true),
          this.getTotalScore(userId, true),
        ]);
      } catch (e) {
        console.warn('Failed to refresh score cache:', e);
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  async syncFromTemplates(userId, today) {
    try {
      const templatesResult = await this.getTemplates(userId);
      const templates = templatesResult.data || [];

      const { data: existing } = await this.supabase
        .from('daily_tasks_instance')
        .select('task_id')
        .eq('user_id', userId)
        .eq('date', today);

      const existingIds = new Set((existing || []).map((i) => i.task_id).filter(Boolean));

      const toInsert = templates
        .filter((t) => !existingIds.has(t.id))
        .filter((t) => {
          const jenis = t.jenis_task || 'harian';
          if (jenis === 'harian') return true;
          if (jenis === 'deadline' && t.deadline_date) return t.deadline_date === today;
          return false;
        })
        .map((t) => ({
          user_id: userId,
          task_id: t.id,
          task_name: t.task_name,
          priority: t.priority,
          category: t.category,
          jenis_task: t.jenis_task || 'harian',
          deadline_date: t.deadline_date || null,
          date: today,
          is_completed: false,
        }));

      if (toInsert.length) {
        const { error } = await this.supabase.from('daily_tasks_instance').insert(toInsert);

        if (error && error.code !== '23505') throw error;
      }

      await this.getTodayTasks(userId, today, true);

      return { success: true, created: toInsert.length };
    } catch (error) {
      console.error('Error syncing from templates:', error);
      throw error;
    }
  }

  async getTodayTasks(userId, today, forceRefresh = false) {
    return this.fetchWithCache(
      'todayTasks',
      async () => {
        const result = await this.supabase
          .from('daily_tasks_instance')
          .select('*')
          .eq('user_id', userId)
          .eq('date', today)
          .order('created_at', { ascending: true });

        if (result.data) {
          result.data = result.data.filter((task) => {
            if (task.jenis_task !== 'deadline') return true;
            return task.deadline_date === today;
          });
        }

        return result;
      },
      forceRefresh,
    );
  }

  async getTemplates(userId, forceRefresh = false) {
    return this.fetchWithCache(
      'templates',
      async () => {
        return await this.supabase
          .from('daily_tasks_template')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });
      },
      forceRefresh,
    );
  }

  async getTodayScore(userId, today, forceRefresh = false) {
    return this.fetchWithCache(
      'todayScore',
      async () => {
        const result = await this.supabase
          .from('score_log')
          .select('score_delta')
          .eq('user_id', userId)
          .eq('date', today);

        const totalScore = (result.data || []).reduce(
          (sum, record) => sum + (record.score_delta || 0),
          0,
        );
        return { data: totalScore };
      },
      forceRefresh,
    );
  }

  async getTotalScore(userId, forceRefresh = false) {
    return this.fetchWithCache(
      'totalScore',
      async () => {
        // Get all scores from score_log
        const { data: scoreData, error: scoreError } = await this.supabase
          .from('score_log')
          .select('score_delta')
          .eq('user_id', userId);

        if (scoreError) throw scoreError;

        const totalFromLogs = (scoreData || []).reduce(
          (sum, record) => sum + (Number(record.score_delta) || 0),
          0,
        );

        // Check if there are any score logs for today
        const today = window.WITA?.today?.() || new Date().toISOString().slice(0, 10);
        const hasTodayLogs = (scoreData || []).some((log) => log.date === today);

        // If no logs for today, add computed score from today's tasks
        let totalScore = totalFromLogs;
        if (!hasTodayLogs) {
          try {
            // Direct database query to avoid cache dependency
            const { data: todayTasks, error: taskError } = await this.supabase
              .from('daily_tasks_instance')
              .select('is_completed')
              .eq('user_id', userId)
              .eq('date', today);

            if (!taskError && todayTasks) {
              // Get user reward/penalty settings
              const userMeta = window.user?.user_metadata || {};
              const reward = Number.isFinite(Number(userMeta.score_reward_complete))
                ? Number(userMeta.score_reward_complete)
                : Number(window.userScoreReward) || 1;
              const penalty = Number.isFinite(Number(userMeta.score_penalty_incomplete))
                ? Number(userMeta.score_penalty_incomplete)
                : Number(window.userScorePenalty) || 2;

              const completed = todayTasks.filter((t) => t.is_completed).length;
              const incomplete = todayTasks.length - completed;
              const todayComputed = completed * reward - incomplete * penalty;

              totalScore += todayComputed;
            }
          } catch (e) {
            console.warn('Failed to compute today score for total:', e);
          }
        }

        return { data: totalScore };
      },
      forceRefresh,
    );
  }

  async addAdHocTask(userId, taskName, today) {
    try {
      const { data, error } = await this.supabase
        .from('daily_tasks_instance')
        .insert([
          {
            user_id: userId,
            task_id: null,
            task_name: taskName.trim(),
            priority: 'sedang',
            category: null,
            date: today,
            is_completed: false,
          },
        ])
        .select();

      if (error) throw error;

      this.state.addCacheItem('todayTasks', data[0]);
      return { success: true, data: data[0] };
    } catch (error) {
      throw error;
    }
  }

  async deleteAdHocTask(taskId, userId) {
    try {
      const { error } = await this.supabase
        .from('daily_tasks_instance')
        .delete()
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;

      this.state.removeCacheItem('todayTasks', taskId);
      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  async logScoreChange(userId, delta, reason) {
    const today = window.WITA?.today?.() || new Date().toISOString().slice(0, 10);

    try {
      await this.supabase.from('score_log').insert([
        {
          user_id: userId,
          score_delta: delta,
          reason: reason,
          date: today,
          created_at: new Date().toISOString(),
        },
      ]);

      this.state.invalidateCache('todayScore');
      this.state.invalidateCache('totalScore');
    } catch (error) {
      console.warn('Score logging failed:', error);
    }
  }

  clearAllCache() {
    this.state.clearCache();
  }
}

window.DataService = DataService;
export default DataService;
