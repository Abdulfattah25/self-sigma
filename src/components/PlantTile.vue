<template>
  <div class="plant-item">
    <div class="plant-tile" :title="altText">
      <span v-if="!compact && !captionBelow && showDateOverlay && dateLabel" class="plant-badge">{{
        dateLabel
      }}</span>
      <span v-if="!compact && !captionBelow && showPercentOverlay" class="plant-percent"
        >{{ tree.percent }}%</span
      >
      <img class="plant-media" :src="src" :alt="altText" loading="lazy" />
    </div>
    <div v-if="captionBelow && dateLabel" class="plant-caption" :title="dateLabel">
      {{ dateLabel }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlantTile',
  props: {
    tree: { type: Object, required: true },
    compact: { type: Boolean, default: false },
    captionBelow: { type: Boolean, default: false },
    showPercentOverlay: { type: Boolean, default: true },
    showDateOverlay: { type: Boolean, default: true },
    plant: { type: String, default: 'bonsai' },
  },
  computed: {
    src() {
      const percent = Math.max(0, Math.min(100, Number(this.tree?.percent) || 0));
      const stage = Math.min(4, Math.floor(percent / 25));
      if (this.plant === 'monstera') {
        return `assets/garden/${stage + 1}.png`;
      }
      const forestFiles = [
        'plant-0-dead.png',
        'plant-1-wilted.png',
        'plant-2-growing.png',
        'plant-3-better.png',
        'plant-4-perfect.png',
      ];
      return `assets/forest/${forestFiles[stage]}`;
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
    },
  },
};
</script>
