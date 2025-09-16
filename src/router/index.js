import { createRouter, createWebHistory } from 'vue-router';
import { requireAuth, requireGuest } from './guards.js';

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/test-license',
    name: 'TestLicense',
    component: () => import('@/components/TestLicense.vue'),
  },
  {
    path: '/signup',
    name: 'SignUp',
    component: () => import('@/components/auth/SignUp.vue'),
    beforeEnter: requireGuest,
  },
  {
    path: '/signin',
    name: 'SignIn',
    component: () => import('@/components/auth/SignIn.vue'),
    beforeEnter: requireGuest,
  },
  {
    path: '/',
    component: () => import('@/components/layout/MainLayout.vue'),
    beforeEnter: requireAuth,
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/components/pages/Dashboard.vue'),
      },
      {
        path: 'tasks',
        name: 'TaskManager',
        component: () => import('@/components/pages/TaskManager.vue'),
      },
      {
        path: 'checklist',
        name: 'Checklist',
        component: () => import('@/components/pages/Checklist.vue'),
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/components/pages/Profile.vue'),
      },
      {
        path: 'report',
        name: 'Report',
        component: () => import('@/components/pages/Report.vue'),
      },
      {
        path: 'admin',
        name: 'Admin',
        component: () => import('@/components/pages/Admin.vue'),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
