import { reactive } from 'vue';

class StateManager {
  constructor() {
    this.state = reactive({
      cache: {},
      cacheTimestamps: {},
      isOnline: navigator.onLine,
    });

    // Simple pub/sub per cache key
    this._subscribers = new Map(); // key -> Set<fn>

    this.cacheTTL = {
      todayTasks: 20 * 60 * 1000, // 20 menit
      templates: 60 * 60 * 1000, // 1 jam
      todayScore: 15 * 60 * 1000, // 15 menit
      totalScore: 30 * 60 * 1000, // 30 menit
      userProfile: 60 * 60 * 1000, // 1 jam
      firstActiveDate: 24 * 60 * 60 * 1000, // 24 jam
    };

    this.setupNetworkMonitoring();
    this.loadFromLocalStorage();
    this.setupCleanup();
  }

  // --- Pub/Sub ---
  subscribe(key, cb, { immediate = true } = {}) {
    if (!this._subscribers.has(key)) this._subscribers.set(key, new Set());
    const set = this._subscribers.get(key);
    set.add(cb);
    // Call immediately with current value if requested
    if (immediate) {
      try {
        cb(this.state.cache[key] ?? null);
      } catch (_) {}
    }
    // Return unsubscribe function
    return () => {
      try {
        const s = this._subscribers.get(key);
        if (s) s.delete(cb);
      } catch (_) {}
    };
  }
  _notify(key) {
    const subs = this._subscribers.get(key);
    if (!subs || subs.size === 0) return;
    const value = this.state.cache[key] ?? null;
    subs.forEach((fn) => {
      try {
        fn(value);
      } catch (_) {}
    });
  }

  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.state.isOnline = true;
    });

    window.addEventListener('offline', () => {
      this.state.isOnline = false;
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.cleanupExpiredCache();
      }
    });
  }

  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('app_cache');
      if (stored) {
        const data = JSON.parse(stored);
        if (data.cache && data.cacheTimestamps) {
          this.state.cache = data.cache;
          this.state.cacheTimestamps = data.cacheTimestamps;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  saveToLocalStorage() {
    try {
      const data = {
        cache: this.state.cache,
        cacheTimestamps: this.state.cacheTimestamps,
      };
      localStorage.setItem('app_cache', JSON.stringify(data));
    } catch (e) {
      // ignore
    }
  }

  setCache(key, data) {
    if (data !== null && data !== undefined) {
      this.state.cache[key] = data;
      this.state.cacheTimestamps[key] = Date.now();
      this.saveToLocalStorage();
      this._notify(key);
    }
  }

  getFromCache(key) {
    if (!this.isCacheValid(key)) return null;
    return this.state.cache[key] ?? null;
  }

  isCacheValid(key) {
    const ts = this.state.cacheTimestamps[key];
    if (!ts) return false;
    const age = Date.now() - ts;
    const ttl = this.cacheTTL[key] || 15 * 60 * 1000;
    return age < ttl;
  }

  invalidateCache(key) {
    if (key === 'all') {
      this.state.cache = {};
      this.state.cacheTimestamps = {};
      this.saveToLocalStorage();
      // Notify known keys to update listeners with null
      for (const k of this._subscribers.keys()) this._notify(k);
      return;
    }
    delete this.state.cache[key];
    delete this.state.cacheTimestamps[key];
    this.saveToLocalStorage();
    this._notify(key);
  }

  updateCacheItem(key, itemId, updates) {
    const list = this.state.cache[key];
    if (Array.isArray(list)) {
      const item = list.find((it) => it.id === itemId);
      if (item) {
        Object.assign(item, updates);
        this.saveToLocalStorage();
        this._notify(key);
      }
    }
  }

  addCacheItem(key, newItem) {
    const list = this.state.cache[key];
    if (Array.isArray(list)) {
      list.push(newItem);
      this.saveToLocalStorage();
      this._notify(key);
    } else if (list === undefined) {
      // Initialize as list for convenience
      this.state.cache[key] = [newItem];
      this.state.cacheTimestamps[key] = Date.now();
      this.saveToLocalStorage();
      this._notify(key);
    }
  }

  removeCacheItem(key, itemId) {
    const list = this.state.cache[key];
    if (Array.isArray(list)) {
      const idx = list.findIndex((it) => it.id === itemId);
      if (idx > -1) {
        list.splice(idx, 1);
        this.saveToLocalStorage();
        this._notify(key);
      }
    }
  }

  cleanupExpiredCache() {
    const now = Date.now();
    for (const [key, ts] of Object.entries(this.state.cacheTimestamps)) {
      const ttl = this.cacheTTL[key] || 15 * 60 * 1000;
      if (now - ts > ttl * 2) {
        delete this.state.cache[key];
        delete this.state.cacheTimestamps[key];
        this._notify(key);
      }
    }
    this.saveToLocalStorage();
  }

  setupCleanup() {
    this._cleanupTimer = setInterval(() => this.cleanupExpiredCache(), 10 * 60 * 1000);
  }

  clearCache() {
    this.invalidateCache('all');
  }
}

const stateManager = new StateManager();
export default stateManager;
