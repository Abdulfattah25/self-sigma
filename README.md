# Productivity Tracker (Vue 2.7 + Vite)

Aplikasi productivity tracker yang telah dimigrasikan dari Vue CDN ke NPM dengan Vite sebagai build tool.

## Setup dan Instalasi

### Prerequisites

- Node.js (versi 16 atau lebih baru)
- npm atau yarn

### Langkah Instalasi

1. **Clone repository**

   ```bash
   git clone [repository-url]
   cd self-sigma
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup environment variables**
   - Copy file `.env.example` ke `.env`
   - Isi konfigurasi Supabase:
     ```env
     VITE_SUPABASE_URL=your_supabase_url_here
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
     ```

4. **Jalankan development server**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:5173`

## Scripts yang Tersedia

- `npm run dev` - Menjalankan development server
- `npm run build` - Build aplikasi untuk production
- `npm run preview` - Preview build hasil production
- `npm run lint` - Linting kode dengan ESLint
- `npm run format` - Format kode dengan Prettier

## Struktur Aplikasi

```
src/
├── asset/              # Asset statis (gambar, CSS)
│   ├── css/           # Custom CSS files
│   ├── forest/        # Gambar tanaman hutan
│   └── garden/        # Gambar tanaman taman
├── components/        # Komponen Vue
│   ├── auth/         # Komponen autentikasi
│   ├── landing/      # Komponen landing page
│   ├── layout/       # Komponen layout
│   └── pages/        # Komponen halaman utama
├── data/             # Data statis
├── lib/              # Library dan utilitas
├── utils/            # Fungsi utilitas
├── App.vue           # Root component
├── main.js           # Entry point aplikasi
└── vue-global.js     # Setup Vue global
```

## Teknologi yang Digunakan

- **Vue 2.7** - Framework JavaScript
- **Vite** - Build tool dan dev server
- **Bootstrap 5** - CSS framework
- **Chart.js** - Library untuk grafik
- **Supabase** - Backend as a Service
- **html2pdf.js** - Export PDF

## Fitur Utama

- Dashboard produktivitas dengan visualisasi pohon
- Manajemen tugas harian
- Sistem skor produktivitas
- Export laporan PDF
- Autentikasi pengguna
- Theme forest dan garden

## Troubleshooting

### PowerShell Execution Policy Error

Jika mengalami error "execution policy" di PowerShell:

1. Buka PowerShell sebagai Administrator
2. Jalankan: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Atau gunakan command prompt (cmd) sebagai alternatif

### Asset Loading Issues

Pastikan semua path asset menggunakan `/src/asset/` bukan `assets/`

### Supabase Connection

Pastikan file `.env` sudah dikonfigurasi dengan benar dengan URL dan key Supabase yang valid.
