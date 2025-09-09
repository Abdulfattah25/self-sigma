/**
 * Global State Manager untuk aplikasi Vue.js
 * Mengelola state global dan caching data untuk mencegah data hilang saat ganti view
 */

class StateManager {
  constructor() {
    this.state = {
      // Cache untuk data yang sering digunakan
      cache: {
        todayTasks: null,
        templates: null,
        todayScore: null,
        userProfile: null,
        plantData: null,
        reportData: null,
        lastFetch: {},
      },

      // Subscribers untuk reactive updates
      subscribers: {},

      // Config untuk cache TTL (Time To Live) dalam milidetik
      cacheTTL: {
        todayTasks: 2 * 60 * 1000, // 2 menit
        templates: 5 * 60 * 1000, // 5 menit
        todayScore: 1 * 60 * 1000, // 1 menit
        userProfile: 10 * 60 * 1000, // 10 menit
        plantData: 5 * 60 * 1000, // 5 menit
        reportData: 3 * 60 * 1000, // 3 menit
      },
    };
  }

  /**
   * Subscribe ke perubahan data tertentu
   */
  subscribe(key, callback) {
    if (!this.state.subscribers[key]) {
      this.state.subscribers[key] = [];
    }
    this.state.subscribers[key].push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.state.subscribers[key].indexOf(callback);
      if (index > -1) {
        this.state.subscribers[key].splice(index, 1);
      }
    };
  }

  /**
   * Notify subscribers tentang perubahan data
   */
  notify(key, data) {
    if (this.state.subscribers[key]) {
      this.state.subscribers[key].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in state subscriber:', error);
        }
      });
    }
  }

  /**
   * Cek apakah cache masih valid
   */
  isCacheValid(key) {
    const lastFetch = this.state.cache.lastFetch[key];
    if (!lastFetch) return false;

    const ttl = this.state.cacheTTL[key] || 5 * 60 * 1000; // default 5 menit
    const now = Date.now();

    return now - lastFetch < ttl;
  }

  /**
   * Get data dari cache jika valid, atau return null
   */
  getFromCache(key) {
    if (this.isCacheValid(key) && this.state.cache[key] !== null) {
      console.log(`📦 Using cached data for: ${key}`);
      return this.state.cache[key];
    }
    return null;
  }

  /**
   * Set data ke cache dan notify subscribers
   */
  setCache(key, data) {
    this.state.cache[key] = data;
    this.state.cache.lastFetch[key] = Date.now();

    console.log(`💾 Cached data for: ${key}`);
    this.notify(key, data);
  }

  /**
   * Update specific item dalam cache array (untuk optimistic updates)
   */
  updateCacheItem(key, itemId, updates, idField = 'id') {
    const cachedData = this.state.cache[key];
    if (!Array.isArray(cachedData)) return;

    const index = cachedData.findIndex((item) => item[idField] === itemId);
    if (index > -1) {
      // Update item dalam cache
      cachedData[index] = { ...cachedData[index], ...updates };
      console.log(`🔄 Updated cache item ${itemId} in ${key}`);
      this.notify(key, cachedData);
    }
  }

  /**
   * Add item ke cache array
   */
  addCacheItem(key, newItem) {
    const cachedData = this.state.cache[key];
    if (Array.isArray(cachedData)) {
      cachedData.push(newItem);
      console.log(`➕ Added item to cache: ${key}`);
      this.notify(key, cachedData);
    }
  }

  /**
   * Remove item dari cache array
   */
  removeCacheItem(key, itemId, idField = 'id') {
    const cachedData = this.state.cache[key];
    if (Array.isArray(cachedData)) {
      const index = cachedData.findIndex((item) => item[idField] === itemId);
      if (index > -1) {
        cachedData.splice(index, 1);
        console.log(`➖ Removed item ${itemId} from cache: ${key}`);
        this.notify(key, cachedData);
      }
    }
  }

  /**
   * Invalidate cache untuk key tertentu
   */
  invalidateCache(key) {
    if (key === 'all') {
      this.state.cache = {
        todayTasks: null,
        templates: null,
        todayScore: null,
        userProfile: null,
        plantData: null,
        reportData: null,
        lastFetch: {},
      };
      console.log('🧹 Cleared all cache');
    } else {
      this.state.cache[key] = null;
      delete this.state.cache.lastFetch[key];
      console.log(`🧹 Invalidated cache for: ${key}`);
    }
  }

  /**
   * Get cache info untuk debugging
   */
  getCacheInfo() {
    const info = {};
    Object.keys(this.state.cache.lastFetch).forEach((key) => {
      const lastFetch = this.state.cache.lastFetch[key];
      const isValid = this.isCacheValid(key);
      const age = Date.now() - lastFetch;

      info[key] = {
        lastFetch: new Date(lastFetch).toLocaleTimeString(),
        ageSeconds: Math.round(age / 1000),
        isValid,
        hasData: this.state.cache[key] !== null,
      };
    });
    return info;
  }
}

// Create singleton instance
const stateManager = new StateManager();

// Export untuk digunakan di komponen
window.stateManager = stateManager;
export default stateManager;
