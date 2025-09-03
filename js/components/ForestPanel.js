// Komponen visual hutan/taman. Tambah dukungan prop 'plant' untuk memilih aset.
Vue.component("forest-panel", {
  props: {
    title: { type: String, default: "" },
    todayPercent: { type: Number, default: 0 },
    trees: { type: Array, default: () => [] }, // [{date, percent}]
    showTodayTile: { type: Boolean, default: true },
    plant: { type: String, default: "bonsai" }, // 'monstera' => garden, 'bonsai' => forest
  },

  computed: {
    // Label progres untuk badge header
    progressLabel() {
      const p = this.clampPercent(this.todayPercent);
      return `Hari ini: ${p}%`;
    },

    // Data tile "hari ini" untuk plant-tile
    todayTileData() {
      const p = this.clampPercent(this.todayPercent);
      return {
        date: this.getTodayIso(),
        percent: p,
        stage: this.percentToStage(p),
        src: this.resolveTileSrc(p),
      };
    },

    // Data historis untuk forest-grid
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

    // Back-compat jika ada penggunaan lama
    tiles() {
      return this.normalizedTrees;
    },
    todayTile() {
      return this.todayTileData;
    },
  },

  methods: {
    clampPercent(p) {
      const n = Number(p) || 0;
      return Math.max(0, Math.min(100, n));
    },
    getTodayIso() {
      try {
        return window.WITA && window.WITA.today ? window.WITA.today() : new Date().toISOString().slice(0, 10);
      } catch {
        return new Date().toISOString().slice(0, 10);
      }
    },
    // 0..100 -> 0..4
    percentToStage(percent) {
      const p = this.clampPercent(percent);
      // 0-24:0, 25-49:1, 50-74:2, 75-99:3, 100:4
      return Math.min(4, Math.floor(p / 25));
    },
    // Resolver aset sesuai spesifikasi:
    // - monstera -> asset/garden/1..5.png
    // - bonsai (default) -> asset/forest/plant-0-dead.png .. plant-4-perfect.png
    resolveTileSrc(percent) {
      const stage = this.percentToStage(percent);

      if (this.plant === "monstera") {
        return `assets/garden/${stage + 1}.png`;
      }

      // default (bonsai)
      const forestFiles = [
        "plant-0-dead.png",
        "plant-1-wilted.png",
        "plant-2-growing.png",
        "plant-3-better.png",
        "plant-4-perfect.png",
      ];
      return `assets/forest/${forestFiles[stage]}`;
    },
  },

  watch: {
    plant() {
      this.$forceUpdate();
    },
    trees() {
      this.$forceUpdate();
    },
    todayPercent() {
      this.$forceUpdate();
    },
  },

  template: `
    <div class="card py-2 forest-panel dashboard-card card-accent card-accent--success">
      <div class="card-body">
        <div class="panel-header">
          <div class="title"><span>🌱</span><span>{{ title }}</span></div>
          <span class="progress-badge">{{ progressLabel }}</span>
        </div>

        <!-- Hari ini: dibuat kecil + caption tanggal di bawah -->
        <div v-if="showTodayTile" class="today-tile">
          <plant-tile
            :tree="todayTileData"
            :plant="plant"
            :compact="true"
            :caption-below="true"
            :show-percent-overlay="false"
            :show-date-overlay="false">
          </plant-tile>
        </div>

        <!-- Grid historis -->
        <forest-grid :trees="normalizedTrees" :plant="plant"></forest-grid>
        <small class="text-body-secondary d-block mt-2">Ilustrasi berubah sesuai persentase penyelesaian tugas.</small>
      </div>
    </div>
  `,
});
