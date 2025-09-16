# 🔐 License Integration - User Flow Documentation

## 🎯 Konsep License System

### **License hanya diperlukan saat SIGNUP pertama kali**

- ✅ **Signup**: User wajib memasukkan kode license
- ❌ **Login**: User TIDAK perlu memasukkan license lagi

## 📋 Alur User Flow

### 1. **New User - First Time Signup**

```
1. User membuka /signup
2. User memasukkan kode license dari admin app
3. System verifikasi license secara real-time
4. Jika valid, user melanjutkan isi form (nama, email, password)
5. System mendaftarkan user + redeem license
6. User berhasil signup dan dapat langsung login
```

### 2. **Existing User - Login**

```
1. User membuka /signin
2. User hanya memasukkan email + password
3. System cek apakah user sudah punya akses (dari admin_app_users table)
4. Jika punya akses, user langsung masuk dashboard
5. Jika tidak punya akses, redirect ke signup untuk aktivasi license
```

- `src/components/layout/AuthLayout.vue` - Layout untuk halaman auth

### 5. Router & Guards

- `src/router/index.js` - Router configuration Vue 3
- `src/router/guards.js` - Route guards untuk auth dan license check

### 6. Utilities

- `src/utils/validation.js` - Form validation utilities
- `src/utils/toast.js` - Toast notification system

### 7. Main Application

- `src/main.js` - Updated Vue 3 app initialization
- `src/App.vue` - Updated main app component dengan license integration

## Environment Variables Required

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup Required

1. Jalankan SQL dari `database/schema.sql` untuk setup tables dan functions
2. Pastikan database dari admin app sudah setup dengan RPC functions:
   - `verify_license(p_app_name, p_license_code)`
   - `redeem_license(p_app_name, p_license_code)`

## Flow Aplikasi

### 1. Signup Flow

1. User mengisi form signup dengan license code
2. License diverifikasi melalui admin system
3. Jika valid, akun dibuat dan license di-redeem
4. User dapat langsung login

### 2. Login Flow

1. User login dengan email/password
2. System cek akses ke aplikasi melalui `admin_app_users` table
3. Jika tidak ada akses, redirect ke signup
4. Jika ada akses, allow masuk aplikasi

### 3. Route Protection

- Semua route protected kecuali `/signin` dan `/signup`
- Route guards cek authentication dan app access
- Redirect otomatis berdasarkan status

## Features Implemented

✅ License verification sebelum signup
✅ License redemption setelah signup berhasil  
✅ Access control berdasarkan admin_app_users table
✅ Route protection dengan Vue Router guards
✅ Error handling dan user feedback
✅ Form validation
✅ Loading states
✅ Toast notifications
✅ Responsive auth layouts

## Usage Instructions

1. Install dependencies yang diperlukan untuk Vue 3
2. Update environment variables
3. Jalankan database migrations
4. Start development server
5. Test signup flow dengan license code dari admin app
6. Test login flow dengan existing users

## Integration Points dengan Admin App

- Menggunakan RPC functions yang sama untuk verify/redeem license
- Shared `admin_app_users` table untuk access control
- Compatible dengan existing admin license management

## Notes

- Semua query Supabase sudah dioptimasi (select specific columns, error handling)
- DRY principle diterapkan dengan composables dan utilities
- No unnecessary boilerplate - hanya kode yang relevan
- Vue 3 Composition API digunakan konsisten
- Bootstrap styling untuk UI consistency
