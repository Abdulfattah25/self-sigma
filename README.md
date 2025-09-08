# Productivity Tracker (Vue via NPM + Vite)

Project telah dimigrasikan ke Vite + Vue 2.7 (NPM). Komponen legacy tetap berjalan, dan kita mulai migrasi bertahap ke SFC.

Menjalankan proyek:

- Install: npm install
- Dev: npm run dev
- Build: npm run build
- Lint: npm run lint
- Format: npm run format

Konfigurasi:

- Env: atur `.env` dengan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` (lihat `.env.example`).
- Aset publik tetap di `assets/` (publicDir Vite).

Tooling:

- ESLint + Prettier diaktifkan (aturan dasar untuk Vue 2 dan kompatibilitas).
- Vite code-splitting: vendor chunk terpisah untuk performa.

Migrasi SFC (bertahap):

- Komponen `forest-panel` sudah dipindahkan ke `src/components/ForestPanel.vue` dan diregistrasi global agar API/props tetap sama di template.
- Komponen legacy lain akan dipindah bertahap. Saat memindahkan:
  1. Buat file `.vue` dengan prop dan computed/methods sama.
  2. Registrasi global di `src/main.js`: `Vue.component('nama', Sfc)`.
  3. Nonaktifkan file legacy JS untuk menghindari double registration.
