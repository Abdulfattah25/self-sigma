/**
 * Score Helper - Manages score calculation with hybrid approach
 * Only recalculates today and future dates when settings change
 */

/**
 * Recalculate score untuk satu hari berdasarkan state task
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {number} reward - Point per completed task
 * @param {number} penalty - Point per incomplete task (positive number)
 * @returns {Promise<number>} Final score for the day
 */
async function recalculateDailyScore(supabase, userId, date, reward, penalty) {
  try {
    // 1. Get all tasks for this date
    const { data: tasks, error } = await supabase
      .from('daily_tasks_instance')
      .select('is_completed, task_id')
      .eq('user_id', userId)
      .eq('date', date);

    if (error) throw error;

    // 2. Only count template tasks (yang punya task_id)
    const templateTasks = (tasks || []).filter((t) => t.task_id);

    if (templateTasks.length === 0) {
      return 0; // No template tasks = no score
    }

    // 3. Calculate score
    const completed = templateTasks.filter((t) => t.is_completed).length;
    const incomplete = templateTasks.length - completed;

    const finalScore = completed * reward + incomplete * -penalty;

    console.log(`📊 Recalculate ${date}:`, {
      total: templateTasks.length,
      completed,
      incomplete,
      reward,
      penalty,
      finalScore,
    });

    return finalScore;
  } catch (error) {
    console.error('Error recalculating daily score:', error);
    return 0;
  }
}

/**
 * Update score_log untuk tanggal tertentu
 * Menghapus entry lama dan insert baru dengan final score
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {number} finalScore - Final calculated score
 * @returns {Promise<boolean>} Success status
 */
async function updateScoreLog(supabase, userId, date, finalScore) {
  try {
    // 1. Delete existing log for this date
    await supabase.from('score_log').delete().eq('user_id', userId).eq('date', date);

    // 2. Insert new log (only if non-zero or to keep record)
    const { error } = await supabase.from('score_log').insert([
      {
        user_id: userId,
        date: date,
        score_delta: finalScore,
        reason: 'auto_recalculate', // ✅ FIX: Add required reason column
      },
    ]);

    if (error) throw error;

    console.log(`✅ Score log updated for ${date}: ${finalScore}`);
    return true;
  } catch (error) {
    console.error('Error updating score log:', error);
    return false;
  }
}

/**
 * 🔥 HYBRID: Recalculate hanya TODAY saat task berubah
 * Called from Checklist when toggle task completion
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {number} reward - Reward per completed task
 * @param {number} penalty - Penalty per incomplete task
 * @returns {Promise<number>} Final score for today
 */
async function syncTodayScore(supabase, userId, reward = 1, penalty = 2) {
  try {
    const today =
      window.WITA && window.WITA.today
        ? window.WITA.today()
        : new Date().toISOString().slice(0, 10);

    // 1. Recalculate score
    const finalScore = await recalculateDailyScore(supabase, userId, today, reward, penalty);

    // 2. Update score_log
    await updateScoreLog(supabase, userId, today, finalScore);

    // 3. Update cache
    if (window.stateManager) {
      window.stateManager.setCache('todayScore', finalScore);
    }

    // 4. Trigger event untuk update dashboard
    window.dispatchEvent(
      new CustomEvent('score-updated', {
        detail: { date: today, score: finalScore },
      }),
    );

    return finalScore;
  } catch (error) {
    console.error('Error syncing today score:', error);
    return 0;
  }
}

/**
 * 🔥 HYBRID: Recalculate TODAY + FUTURE saat setting berubah
 * Called from Settings when user changes reward/penalty
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID
 * @param {number} newReward - New reward setting
 * @param {number} newPenalty - New penalty setting
 * @returns {Promise<Object>} Recalculation result
 */
async function recalculateTodayAndFuture(supabase, userId, newReward, newPenalty) {
  try {
    const today =
      window.WITA && window.WITA.today
        ? window.WITA.today()
        : new Date().toISOString().slice(0, 10);

    console.log('🔄 Recalculating scores from today onwards with new settings:', {
      today,
      newReward,
      newPenalty,
    });

    // 1. Get all unique dates >= today dari daily_tasks_instance
    const { data: instances, error: instanceError } = await supabase
      .from('daily_tasks_instance')
      .select('date')
      .eq('user_id', userId)
      .gte('date', today);

    if (instanceError) throw instanceError;

    // 2. Get unique dates
    const uniqueDates = [...new Set((instances || []).map((i) => i.date))].sort();

    if (uniqueDates.length === 0) {
      console.log('ℹ️ No tasks found for today or future dates');
      return { recalculated: 0, dates: [] };
    }

    console.log(`📅 Found ${uniqueDates.length} dates to recalculate:`, uniqueDates);

    // 3. Recalculate each date
    const recalculatedDates = [];
    for (const date of uniqueDates) {
      const score = await recalculateDailyScore(supabase, userId, date, newReward, newPenalty);
      await updateScoreLog(supabase, userId, date, score);
      recalculatedDates.push({ date, score });
    }

    // 4. Recalculate total score (dari semua score_log)
    const { data: allScores, error: scoreError } = await supabase
      .from('score_log')
      .select('score_delta')
      .eq('user_id', userId);

    if (scoreError) throw scoreError;

    const newTotalScore = (allScores || []).reduce((sum, row) => sum + (row.score_delta || 0), 0);

    // 5. Update cache
    if (window.stateManager) {
      // Update today's score if exists
      const todayScore = recalculatedDates.find((d) => d.date === today);
      if (todayScore) {
        window.stateManager.setCache('todayScore', todayScore.score);
      }

      window.stateManager.setCache('totalScore', newTotalScore);
    }

    // 6. Trigger events
    window.dispatchEvent(
      new CustomEvent('scores-recalculated', {
        detail: {
          dates: recalculatedDates,
          totalScore: newTotalScore,
          reward: newReward,
          penalty: newPenalty,
        },
      }),
    );

    console.log('✅ Recalculation complete:', {
      recalculated: recalculatedDates.length,
      newTotalScore,
    });

    return {
      recalculated: recalculatedDates.length,
      dates: recalculatedDates,
      totalScore: newTotalScore,
    };
  } catch (error) {
    console.error('Error recalculating today and future scores:', error);
    throw error;
  }
}

/**
 * Get current reward/penalty settings from user metadata
 * @param {Object} user - User object with metadata
 * @returns {Object} { reward, penalty }
 */
function getScoreSettings(user) {
  const meta = (user && user.user_metadata) || {};
  const reward = Number.isFinite(Number(meta.score_reward_complete))
    ? Number(meta.score_reward_complete)
    : 1;
  const penalty = Number.isFinite(Number(meta.score_penalty_incomplete))
    ? Number(meta.score_penalty_incomplete)
    : 2;

  return { reward, penalty };
}

// Export to window for global access
if (typeof window !== 'undefined') {
  window.scoreHelper = {
    recalculateDailyScore,
    updateScoreLog,
    syncTodayScore,
    recalculateTodayAndFuture,
    getScoreSettings,
  };
}

export {
  recalculateDailyScore,
  updateScoreLog,
  syncTodayScore,
  recalculateTodayAndFuture,
  getScoreSettings,
};
