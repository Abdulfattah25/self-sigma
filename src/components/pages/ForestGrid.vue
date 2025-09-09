<template>
  <div class="forest-grid">
    <plant-tile
      v-for="t in safeTrees"
      :key="t.id + '-' + t.percent"
      :tree="t"
      :plant="plant"
      :caption-below="true"
      :compact="true"
      :show-percent-overlay="false"
      :show-date-overlay="false"
    />
  </div>
</template>

<script>
export default {
  name: 'ForestGrid',
  props: {
    trees: { type: Array, default: () => [] },
    plant: { type: String, default: 'forest' },
  },
  computed: {
    safeTrees() {
      if (!Array.isArray(this.trees)) return [];
      return this.trees.map((t, idx) => {
        const date = t && t.date ? String(t.date) : '';
        let percent = Number(t && t.percent);
        if (!Number.isFinite(percent)) percent = 0;
        percent = Math.max(0, Math.min(100, Math.round(percent)));
        const id = t && (t.id || date) ? t.id || date : `row-${idx}`;
        const poster = t && t.poster ? t.poster : null;
        return { id, date, percent, poster };
      });
    },
  },
};
</script>
