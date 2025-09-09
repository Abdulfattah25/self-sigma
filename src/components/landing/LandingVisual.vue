<template>
  <div class="landing-visual glass-card p-0">
    <div class="p-4">
      <div class="row g-3">
        <div class="col-6">
          <div class="mini-card">
            <div class="d-flex align-items-center">
              <div class="icon-bubble bg-success-subtle text-success me-1">
                <i class="bi bi-check2-circle"></i>
              </div>
              <div>
                <div class="small text-muted">Checklist Selesai</div>
                <div class="h4 mb-0 fw-bold text-muted">12</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6">
          <div class="mini-card">
            <div class="d-flex align-items-center">
              <div class="icon-bubble bg-primary-subtle text-primary me-3">
                <i class="bi bi-lightning-charge-fill"></i>
              </div>
              <div>
                <div class="small text-muted">Skor Hari Ini</div>
                <div class="h4 mb-0 fw-bold text-muted">+24</div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12">
          <div class="mock-panel">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <strong class="text-dark">Task Harian</strong>
              <span class="badge bg-success-subtle text-success">On Track</span>
            </div>
            <div class="task-row">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" checked />
              </div>
              <div class="flex-grow-1 text-muted">Minum 2L air putih</div>
              <span class="badge rounded-pill bg-success-subtle text-success">+2</span>
            </div>
            <div class="task-row">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" />
              </div>
              <div class="flex-grow-1 text-muted">Olahraga 20 menit</div>
              <span class="badge rounded-pill bg-success-subtle text-success">+4</span>
            </div>
            <div class="task-row">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" />
              </div>
              <div class="flex-grow-1 text-muted">Belajar 45 menit</div>
              <span class="badge rounded-pill bg-success-subtle text-success">+6</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// No script needed for this static component
</script>