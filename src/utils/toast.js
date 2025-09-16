// Toast utility untuk notifikasi
export const showToast = (message, type = 'info', duration = 4000) => {
  // Buat toast element
  const toastId = `toast-${Date.now()}`;
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.className = `toast align-items-center text-bg-${type} border-0`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');

  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  // Cari atau buat container
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
  }

  container.appendChild(toast);

  // Initialize bootstrap toast
  const bsToast = new window.bootstrap.Toast(toast, {
    delay: duration,
  });

  // Auto remove dari DOM setelah hidden
  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });

  bsToast.show();

  return bsToast;
};

// Shortcuts untuk tipe-tipe umum
export const showSuccess = (message, duration) => showToast(message, 'success', duration);
export const showError = (message, duration) => showToast(message, 'danger', duration);
export const showWarning = (message, duration) => showToast(message, 'warning', duration);
export const showInfo = (message, duration) => showToast(message, 'info', duration);

// Export sebagai global untuk kompatibilitas dengan kode lama
if (typeof window !== 'undefined') {
  window.showToast = showToast;
  window.showSuccess = showSuccess;
  window.showError = showError;
  window.showWarning = showWarning;
  window.showInfo = showInfo;
}
