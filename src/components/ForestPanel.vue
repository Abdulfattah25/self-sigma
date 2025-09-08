<template>
  <div class="card py-2 forest-panel dashboard-card card-accent card-accent--success">
    <div class="card-body">
      <div class="panel-header">
        <div class="title">
          <span>🌱</span><span>{{ title }}</span>
        </div>
        <span class="progress-badge">{{ progressLabel }}</span>
      </div>
      <div v-if="showTodayTile" class="today-tile">
        <plant-tile
          :tree="todayTileData"
          :plant="plant"
          :compact="true"
          :caption-below="true"
          :show-percent-overlay="false"
          :show-date-overlay="false"
        />
      </div>
      <forest-grid :trees="normalizedTrees" :plant="plant" />
      <small class="text-body-secondary d-block mt-2"
        >Ilustrasi berubah sesuai persentase penyelesaian tugas.</small
      >
    </div>
  </div>
</template>

<script>
export default {
  name: 'ForestPanel',
  props: {
    title: { type: String, default: '' },
    todayPercent: { type: Number, default: 0 },
    trees: { type: Array, default: () => [] },
    showTodayTile: { type: Boolean, default: true },
    plant: { type: String, default: 'bonsai' },
  },
  computed: {
    progressLabel() {
      const p = this.clampPercent(this.todayPercent);
      return `Hari ini: ${p}%`;
    },
    todayTileData() {
      const p = this.clampPercent(this.todayPercent);
      return {
        date: this.getTodayIso(),
        percent: p,
        stage: this.percentToStage(p),
        src: this.resolveTileSrc(p),
      };
    },
    normalizedTrees() {
      return (this.trees || []).map((t) => {
        const percent = this.clampPercent(t?.percent);
        return {
          ...t,
          percent,
          stage: this.percentToStage(percent),
          src: this.resolveTileSrc(percent),
        };
      });
    },
  },
  methods: {
    clampPercent(p) {
      const n = Number(p) || 0;
      return Math.max(0, Math.min(100, n));
    },
    getTodayIso() {
      try {
        return window.WITA && window.WITA.today
          ? window.WITA.today()
          : new Date().toISOString().slice(0, 10);
      } catch {
        return new Date().toISOString().slice(0, 10);
      }
    },
    percentToStage(percent) {
      const p = this.clampPercent(percent);
      return Math.min(4, Math.floor(p / 25));
    },
    resolveTileSrc(percent) {
      const stage = this.percentToStage(percent);
      if (this.plant === 'monstera') return `assets/garden/${stage + 1}.png`;
      const forestFiles = [
        'plant-0-dead.png',
        'plant-1-wilted.png',
        'plant-2-growing.png',
        'plant-3-better.png',
        'plant-4-perfect.png',
      ];
      return `assets/forest/${forestFiles[stage]}`;
    },
  },
};
</script>
