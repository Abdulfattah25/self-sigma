<template>
  <!-- Mobile Bottom Navigation -->
  <nav class="mobile-bottom-nav d-md-none">
    <a href="#" 
       class="mobile-nav-item" 
       :class="{ active: currentView==='dashboard' }" 
       @click.prevent="$emit('set-view', 'dashboard')">
      <i class="bi bi-house"></i>
      <span>Home</span>
    </a>
    
    <a v-if="user" 
       href="#" 
       class="mobile-nav-item" 
       :class="{ active: currentView==='checklist' }" 
       @click.prevent="$emit('set-view', 'checklist')">
      <i class="bi bi-check2-square"></i>
      <span>Checklist</span>
    </a>
    
    <a v-if="user" 
       href="#" 
       class="mobile-nav-item" 
       :class="{ active: currentView==='tasks' }" 
       @click.prevent="$emit('set-view', 'tasks')">
      <i class="bi bi-list-task"></i>
      <span>Tasks</span>
    </a>
    
    <a v-if="user" 
       href="#" 
       class="mobile-nav-item" 
       :class="{ active: currentView==='report' }" 
       @click.prevent="$emit('set-view', 'report')">
      <i class="bi bi-graph-up"></i>
      <span>Report</span>
    </a>
    
    <a v-if="user && isAdmin" 
       href="#" 
       class="mobile-nav-item" 
       :class="{ active: currentView==='admin' }" 
       @click.prevent="$emit('set-view', 'admin')">
      <i class="bi bi-shield-lock"></i>
      <span>Admin</span>
    </a>
    
    <a v-if="user" 
       href="#" 
       class="mobile-nav-item" 
       :class="{ active: currentView==='profile' }" 
       @click.prevent="$emit('set-view', 'profile')">
      <i class="bi bi-person-circle"></i>
      <span>Saya</span>
    </a>
    
    <a v-if="!user" 
       href="#" 
       class="mobile-nav-item" 
       @click.prevent="$emit('show-auth')">
      <i class="bi bi-box-arrow-in-right"></i>
      <span>Login</span>
    </a>
  </nav>
</template>

<script setup>
defineProps({
  user: Object,
  currentView: String,
  isAdmin: Boolean
})

defineEmits(['set-view', 'show-auth'])
</script>