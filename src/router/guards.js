import { AuthService } from '@/services/authService.js';
import { LicenseService } from '@/services/licenseService.js';

export const requireAuth = async (to, from, next) => {
  try {
    const user = await AuthService.getCurrentUser();
    if (!user) return next('/');

    const hasAccess = await LicenseService.checkUserAccess();
    if (!hasAccess) {
      await AuthService.signOut();
      return next({ path: '/', query: { auth: 'signup' } });
    }

    next();
  } catch {
    next('/');
  }
};

export const requireGuest = async (to, from, next) => {
  try {
    const user = await AuthService.getCurrentUser();
    if (user && (await LicenseService.checkUserAccess())) {
      return next('/dashboard');
    }
    next();
  } catch {
    next();
  }
};
