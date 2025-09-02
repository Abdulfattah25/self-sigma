// Komponen petak pohon + caption tanggal di bawah (opsional)
(function () {
  function localSceneFor(percent) {
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    // Gunakan hanya gambar PNG untuk semua kondisi
    if (p <= 10) return "plant-0-dead.png";
    if (p <= 25) return "plant-1-wilted.png";
    if (p <= 50) return "plant-2-growing.png";
    if (p <= 89) return "plant-3-better.png";
    return "plant-4-perfect.png";
  }
  function localAssetUrl(fileName) {
    return `assets/forest/${fileName}`;
  }

  Vue.component("plant-tile", {
    props: {
      tree: { type: Object, required: true }, // { date:'YYYY-MM-DD', percent:0..100, poster? }
      compact: { type: Boolean, default: false }, // sembunyikan overlay
      captionBelow: { type: Boolean, default: false }, // tampilkan tanggal di bawah gambar (non-overlay)
      showPercentOverlay: { type: Boolean, default: true }, // kontrol overlay persen jika tidak compact/caption
      showDateOverlay: { type: Boolean, default: true }, // kontrol overlay tanggal jika tidak compact/caption
    },
    computed: {
      fileName() {
        if (window.ForestUtils && typeof ForestUtils.sceneFor === "function") {
          return ForestUtils.sceneFor(this.tree.percent);
        }
        return localSceneFor(this.tree.percent);
      },
      src() {
        if (window.ForestUtils && typeof ForestUtils.assetUrl === "function") {
          return ForestUtils.assetUrl(this.fileName);
        }
        return localAssetUrl(this.fileName);
      },
      dateLabel() {
        try {
          const d = new Date(this.tree.date);
          return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
        } catch {
          return this.tree.date || "";
        }
      },
      altText() {
        return `Pohon ${this.tree.percent}% pada ${this.dateLabel}`;
      },
    },
    // Tidak ada penggunaan <video> lagi
    template: `
      <div class="plant-item">
        <div class="plant-tile" :title="altText">
          <span v-if="!compact && !captionBelow && showDateOverlay && dateLabel" class="plant-badge">{{ dateLabel }}</span>
          <span v-if="!compact && !captionBelow && showPercentOverlay" class="plant-percent">{{ tree.percent }}%</span>

          <img class="plant-media" :src="src" :alt="altText" loading="lazy" />
        </div>

        <div v-if="captionBelow && dateLabel" class="plant-caption" :title="dateLabel">{{ dateLabel }}</div>
      </div>
    `,
  });
})();
