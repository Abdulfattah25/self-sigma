<template>
  <div class="card mt-3" v-if="showDebug">
    <div class="card-header">
      <h6 class="mb-0">
        🛠️ Cache Debug Info
        <button class="btn btn-sm btn-outline-secondary ms-2" @click="refreshInfo">🔄</button>
        <button class="btn btn-sm btn-outline-danger ms-1" @click="clearAllCache">
          🧹 Clear All
        </button>
      </h6>
    </div>
    <div class="card-body">
      <div class="row">
        <div v-for="(info, key) in cacheInfo" :key="key" class="col-md-4 mb-2">
          <div class="card bg-light">
            <div class="card-body p-2">
              <h6 class="card-title h6 mb-1">{{ key }}</h6>
              <small class="text-muted d-block">
                ⏰ {{ info.lastFetch }}<br />
                📊 {{ info.ageSeconds }}s ago<br />
                ✅ {{ info.isValid ? 'Valid' : 'Expired' }}<br />
                💾 {{ info.hasData ? 'Has Data' : 'No Data' }}
              </small>
            </div>
          </div>
        </div>
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
    };
  },
  mounted() {
    // Show debug di development atau jika ada query param
    this.showDebug = import.meta.env.DEV || window.location.search.includes('debug=cache');

    if (this.showDebug) {
      this.refreshInfo();

      // Auto refresh every 5 seconds
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
      }
    },
    clearAllCache() {
      if (window.dataService) {
        window.dataService.clearAllCache();
        this.refreshInfo();
        alert('Cache cleared!');
      }
    },
  },
};
</script>
