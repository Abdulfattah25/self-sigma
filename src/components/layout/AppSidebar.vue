<template>
  <!-- Desktop Fixed Sidebar -->
  <aside v-if="user" class="sidebar-fixed d-none d-md-block">
    <div class="sidebar-inner">
      <div class="list-group list-group-flush sidebar-menu">
        <a
          href="#"
          class="list-group-item list-group-item-action d-flex align-items-center"
          :class="{ active: currentView === 'dashboard' }"
          @click.prevent="$emit('set-view', 'dashboard')"
        >
          <i class="bi bi-house-fill me-2 text-primary"></i>
          <span>Dashboard</span>
        </a>

        <a
          v-if="user"
          href="#"
          class="list-group-item list-group-item-action d-flex align-items-center"
          :class="{ active: currentView === 'checklist' }"
          @click.prevent="$emit('set-view', 'checklist')"
        >
          <i class="bi bi-check2-square me-2 text-success"></i>
          <span>Checklist</span>
        </a>

        <a
          v-if="user"
          href="#"
          class="list-group-item list-group-item-action d-flex align-items-center"
          :class="{ active: currentView === 'tasks' }"
          @click.prevent="$emit('set-view', 'tasks')"
        >
          <i class="bi bi-list-task me-2 text-info"></i>
          <span>Task Manager</span>
        </a>

        <a
          v-if="user"
          href="#"
          class="list-group-item list-group-item-action d-flex align-items-center"
          :class="{ active: currentView === 'report' }"
          @click.prevent="$emit('set-view', 'report')"
        >
          <i class="bi bi-graph-up-arrow me-2 text-warning"></i>
          <span>Report</span>
        </a>

        <a
          v-if="user && isAdmin"
          href="#"
          class="list-group-item list-group-item-action d-flex align-items-center"
          :class="{ active: currentView === 'admin' }"
          @click.prevent="$emit('set-view', 'admin')"
        >
          <i class="bi bi-shield-lock-fill me-2 text-danger"></i>
          <span>Admin</span>
        </a>

        <!-- Divider -->
        <div class="sidebar-divider my-2"></div>

        <!-- Account Section -->
        <a
          v-if="user"
          href="#"
          class="list-group-item list-group-item-action d-flex align-items-center"
          :class="{ active: currentView === 'profile' }"
          @click.prevent="$emit('set-view', 'profile')"
        >
          <i class="bi bi-person-circle me-2 text-secondary"></i>
          <span>Akun Saya</span>
        </a>
      </div>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  user: Object,
  currentView: String,
  isAdmin: Boolean,
});

defineEmits(['set-view']);
</script>

<style scoped>
/* Sidebar Divider */
.sidebar-divider {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  margin: 0.5rem 1rem;
}

/* Account Section Styling */
.list-group-item:last-child {
  border-bottom: none;
}

.list-group-item.active {
  background-color: var(--bs-primary);
  border-color: var(--bs-primary);
  color: white;
}

.list-group-item.active i {
  color: white !important;
}

.list-group-item:hover:not(.active) {
  background-color: rgba(0, 0, 0, 0.05);
}

/* Icon consistency */
.list-group-item i {
  width: 20px;
  text-align: center;
}
</style>
