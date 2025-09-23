<template>
  <div class="card mt-3" v-if="showDebug">
    <div class="card-header">
      <h6 class="mb-0">
        🛠️ Cache & Performance Monitor
        <button class="btn btn-sm btn-outline-secondary ms-2" @click="refreshInfo">🔄</button>
        <button class="btn btn-sm btn-outline-danger ms-1" @click="clearAllCache">
          🧹 Clear All
        </button>
      </h6>
    </div>
    <div class="card-body">
      <div class="row mb-3">
        <div class="col-md-4">
          <div class="card bg-light">
            <div class="card-body p-2 text-center">
              <h6 class="mb-1">🌐 Network</h6>
              <span :class="isOnline ? 'badge bg-success' : 'badge bg-danger'">
                {{ isOnline ? 'Online' : 'Offline' }}
              </span>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-light">
            <div class="card-body p-2 text-center">
              <h6 class="mb-1">📦 Cache Hit Rate</h6>
              <span class="badge bg-info">{{ cacheHitRate }}%</span>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-light">
            <div class="card-body p-2 text-center">
              <h6 class="mb-1">⚡ Active Caches</h6>
              <span class="badge bg-primary">{{ activeCacheCount }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="row">
        <div v-for="(info, key) in cacheInfo" :key="key" class="col-md-4 mb-2">
          <div class="card" :class="info.isValid ? 'bg-light' : 'bg-warning bg-opacity-25'">
            <div class="card-body p-2">
              <h6 class="card-title h6 mb-1">{{ key }}</h6>
              <small class="text-muted d-block">
                ⏰ {{ info.lastFetch }}<br />
                📊 {{ info.ageSeconds }}s ago<br />
                ✅ {{ info.isValid ? 'Valid' : 'Expired' }}<br />
                💾 {{ info.hasData ? `${formatSize(info.dataSize)}` : 'No Data' }}
              </small>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-3">
        <small class="text-muted">
          💡 Tips: Expired cache akan direfresh otomatis saat dibutuhkan. Cache hit rate yang tinggi
          menunjukkan performa yang baik.
        </small>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CacheDebugger',
  data() {
    return {
      showDebug: false,
      cacheInfo: {},
      isOnline: true,
      cacheHitRate: 0,
      activeCacheCount: 0,
    };
  },
  computed: {},
  mounted() {
    this.showDebug = import.meta.env.DEV || window.location.search.includes('debug=cache');

    if (this.showDebug) {
      this.refreshInfo();

      this.interval = setInterval(() => {
        this.refreshInfo();
      }, 5000);
    }
  },
  beforeDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  },
  methods: {
    refreshInfo() {
      if (window.stateManager) {
        this.cacheInfo = window.stateManager.getCacheInfo();
        this.isOnline = window.stateManager.state.app.isOnline;

        const validCaches = Object.values(this.cacheInfo).filter(
          (info) => info.isValid && info.hasData,
        );
        const totalCaches = Object.keys(this.cacheInfo).length;

        this.activeCacheCount = validCaches.length;
        this.cacheHitRate =
          totalCaches > 0 ? Math.round((validCaches.length / totalCaches) * 100) : 0;
      }
    },
    clearAllCache() {
      if (window.dataService) {
        window.dataService.clearAllCache();
        this.refreshInfo();
        if (window.showToast) {
          window.showToast('Cache telah dibersihkan!', 'success');
        } else {
          alert('Cache cleared!');
        }
      }
    },
    formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
      return Math.round(bytes / (1024 * 1024)) + ' MB';
    },
  },
};
</script>
