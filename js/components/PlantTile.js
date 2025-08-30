// Komponen petak pohon + caption tanggal di bawah (opsional)
(function () {
  function localSceneFor(percent) {
    const p = Math.max(0, Math.min(100, Number(percent) || 0));
    if (p <= 10) return 'plant0.mp4';
    if (p <= 25) return 'plant-1-wilted.png';
    if (p <= 50) return 'plant-2-growing.png';
    if (p <= 89) return 'plant-3-better.png';
    return 'plant-4-perfect.png';
  }
  function localAssetUrl(fileName) {
    return `assets/forest/${fileName}`;
  }

  Vue.component('plant-tile', {
    props: {
      tree: { type: Object, required: true }, // { date:'YYYY-MM-DD', percent:0..100, poster? }
      compact: { type: Boolean, default: false }, // sembunyikan overlay
      captionBelow: { type: Boolean, default: false }, // tampilkan tanggal di bawah gambar (non-overlay)
      showPercentOverlay: { type: Boolean, default: true }, // kontrol overlay persen jika tidak compact/caption
      showDateOverlay: { type: Boolean, default: true } // kontrol overlay tanggal jika tidak compact/caption
    },
    computed: {
      fileName() {
        if (window.ForestUtils && typeof ForestUtils.sceneFor === 'function') {
          return ForestUtils.sceneFor(this.tree.percent);
        }
        return localSceneFor(this.tree.percent);
      },
      src() {
        if (window.ForestUtils && typeof ForestUtils.assetUrl === 'function') {
          return ForestUtils.assetUrl(this.fileName);
        }
        return localAssetUrl(this.fileName);
      },
      isVideo() {
        return /\.(mp4|webm)$/i.test(this.fileName);
      },
      poster() {
        if (this.tree.poster) {
          if (window.ForestUtils && typeof ForestUtils.assetUrl === 'function') {
            return ForestUtils.assetUrl(this.tree.poster);
          }
          return localAssetUrl(this.tree.poster);
        }
        return localAssetUrl('plant-3-better.png');
      },
      dateLabel() {
        try {
          const d = new Date(this.tree.date);
          return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
        } catch {
          return this.tree.date || '';
        }
      },
      altText() {
        return `Pohon ${this.tree.percent}% pada ${this.dateLabel}`;
      }
    },
    mounted() {
      if (!this.isVideo) return;
      const el = this.$refs.vid;
      const onIntersect = (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) el.play().catch(() => {});
          else el.pause();
        }
      };
      this._io = new IntersectionObserver(onIntersect, { threshold: 0.25 });
      this._io.observe(el);
    },
    beforeDestroy() { if (this._io) this._io.disconnect(); },
    template: `
      <div class="plant-item">
        <div class="plant-tile" :title="altText">
          <span v-if="!compact && !captionBelow && showDateOverlay && dateLabel" class="plant-badge">{{ dateLabel }}</span>
          <span v-if="!compact && !captionBelow && showPercentOverlay" class="plant-percent">{{ tree.percent }}%</span>

          <video v-if="isVideo"
                 class="plant-media"
                 :poster="poster"
                 :src="src"
                 muted playsinline loop preload="none"
                 ref="vid">
          </video>
          <img v-else class="plant-media" :src="src" :alt="altText" loading="lazy" />
        </div>

        <div v-if="captionBelow && dateLabel" class="plant-caption" :title="dateLabel">{{ dateLabel }}</div>
      </div>
    `
  });
})();