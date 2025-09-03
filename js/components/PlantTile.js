// Komponen petak pohon + caption tanggal di bawah (opsional)
(function () {
  Vue.component("plant-tile", {
    props: {
      tree: { type: Object, required: true }, // { date:'YYYY-MM-DD', percent:0..100, poster? }
      compact: { type: Boolean, default: false }, // sembunyikan overlay
      captionBelow: { type: Boolean, default: false }, // tampilkan tanggal di bawah gambar (non-overlay)
      showPercentOverlay: { type: Boolean, default: true }, // kontrol overlay persen jika tidak compact/caption
      showDateOverlay: { type: Boolean, default: true }, // kontrol overlay tanggal jika tidak compact/caption
      // tipe tanaman: 'bonsai' (default -> assets/forest) atau 'monstera' (-> assets/garden)
      plant: { type: String, default: "bonsai" },
    },
    computed: {
      src() {
        const percent = Math.max(0, Math.min(100, Number(this.tree?.percent) || 0));
        // 0..100 -> stage 0..4
        const stage = Math.min(4, Math.floor(percent / 25));
        if (this.plant === "monstera") {
          // assets/garden/1..5.png
          return `assets/garden/${stage + 1}.png`;
        }
        // default bonsai -> assets/forest/plant-*.png
        const forestFiles = [
          "plant-0-dead.png",
          "plant-1-wilted.png",
          "plant-2-growing.png",
          "plant-3-better.png",
          "plant-4-perfect.png",
        ];
        return `assets/forest/${forestFiles[stage]}`;
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
