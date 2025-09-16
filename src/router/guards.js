import { AuthService } from '@/services/authService.js';
import { LicenseService } from '@/services/licenseService.js';

export const requireAuth = async (to, from, next) => {
  try {
    const user = await AuthService.getCurrentUser();
    if (!user) return next('/signin');

    const hasAccess = await LicenseService.checkUserAccess();
    if (!hasAccess) {
      await AuthService.signOut();
      return next('/signup');
    }

    next();
  } catch {
    next('/signin');
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
