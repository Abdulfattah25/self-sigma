// Grid hutan: render daftar tanggal sebagai tile tanaman.
// Catatan:
// - Hindari self-closing tag untuk custom element di Vue 2 runtime template.
// - Gunakan kebab-case untuk atribut agar dipetakan ke prop camelCase di komponen.
Vue.component("forest-grid", {
  props: {
    // Array of { id?, date: 'YYYY-MM-DD', percent: number, poster? }
    trees: { type: Array, default: () => [] },
    // tipe tanaman yang dipakai tile: 'bonsai' | 'monstera'
    plant: { type: String, default: "bonsai" },
  },
  computed: {
    safeTrees() {
      if (!Array.isArray(this.trees)) return [];
      return this.trees.map((t, idx) => {
        const date = t && t.date ? String(t.date) : "";
        let percent = Number(t && t.percent);
        if (!Number.isFinite(percent)) percent = 0;
        percent = Math.max(0, Math.min(100, Math.round(percent)));
        const id = t && (t.id || date) ? t.id || date : `row-${idx}`;
        const poster = t && t.poster ? t.poster : null;
        return { id, date, percent, poster };
      });
    },
  },
  template: `
    <div class="forest-grid">
      <plant-tile
        v-for="t in safeTrees"
        :key="t.id + '-' + t.percent"
        :tree="t"
  :plant="plant"
        :caption-below="true"
        :compact="true"
        :show-percent-overlay="false"
        :show-date-overlay="false">
      </plant-tile>
    </div>
  `,
});
