// Panel siap pakai untuk Dashboard
Vue.component("forest-panel", {
  props: {
    title: { type: String, default: "Taman Produktivitas" },
    todayPercent: { type: Number, default: null }, // persen hari ini
    trees: { type: Array, default: () => [] }, // riwayat harian
    showTodayTile: { type: Boolean, default: true },
  },
  computed: {
    normalizedTrees() {
      const arr = Array.isArray(this.trees) ? this.trees.slice() : [];
      return arr;
    },
    todayTileData() {
      const todayIso = window.WITA && window.WITA.today ? window.WITA.today() : new Date().toISOString().slice(0, 10);
      const pct = Number.isFinite(this.todayPercent)
        ? this.todayPercent
        : this.normalizedTrees.find((t) => t.date === todayIso)?.percent ?? 0;
      return { date: todayIso, percent: Math.max(0, Math.min(100, pct)) };
    },
    progressLabel() {
      const v = Number.isFinite(this.todayPercent) ? this.todayPercent : this.todayTileData.percent;
      return `${v}%`;
    },
  },
  template: `
    <div class="card forest-panel">
      <div class="card-body">
        <div class="panel-header">
          <div class="title"><span>🌱</span><span>{{ title }}</span></div>
          <span class="progress-badge">{{ progressLabel }}</span>
        </div>

        <!-- Hari ini: dibuat kecil + caption tanggal di bawah -->
        <div v-if="showTodayTile" class="today-tile">
          <plant-tile
            :tree="todayTileData"
            :compact="true"
            :caption-below="true"
            :show-percent-overlay="false"
            :show-date-overlay="false">
          </plant-tile>
        </div>

        <forest-grid :trees="normalizedTrees"></forest-grid>
        <small class="text-body-secondary d-block mt-2">Ilustrasi berubah sesuai persentase penyelesaian tugas.</small>
      </div>
    </div>
  `,
});
