<template>
  <div class="auth-layout">
    <div class="auth-container">
      <div class="auth-header">
        <h1>Productivity App</h1>
        <p>Aplikasi manajemen tugas harian dengan sistem gamifikasi</p>
      </div>

      <slot />
    </div>
  </div>
</template>

<script setup>
// Layout component untuk halaman auth
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.auth-container {
  background: white;
  border-radius: 12px;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  padding: 2rem;
  width: 100%;
  max-width: 420px;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h1 {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.auth-header p {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
}

@media (max-width: 480px) {
  .auth-container {
    margin: 1rem;
    padding: 1.5rem;
  }

  .auth-header h1 {
    font-size: 1.5rem;
  }
}
</style>
