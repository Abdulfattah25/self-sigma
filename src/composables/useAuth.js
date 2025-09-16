import { ref, computed } from 'vue';
import { AuthService } from '@/services/authService.js';
import { LicenseService } from '@/services/licenseService.js';

const user = ref(null);
const loading = ref(false);

export function useAuth() {
  const isAuthenticated = computed(() => !!user.value);

  const signUp = async (email, password, licenseCode, name) => {
    loading.value = true;
    try {
      const result = await AuthService.signUpWithLicense(email, password, licenseCode, name);
      if (!result.needsConfirmation) user.value = result.user;
      return result;
    } finally {
      loading.value = false;
    }
  };

  const signIn = async (email, password) => {
    loading.value = true;
    try {
      const { user: authUser } = await AuthService.signIn(email, password);
      user.value = authUser;
      return authUser;
    } finally {
      loading.value = false;
    }
  };

  const signOut = async () => {
    await AuthService.signOut();
    user.value = null;
  };

  const checkAuth = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser && (await LicenseService.checkUserAccess())) {
        user.value = currentUser;
      }
    } catch {
      user.value = null;
    }
  };

  return {
    user: computed(() => user.value),
    loading: computed(() => loading.value),
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    checkAuth,
  };
}
