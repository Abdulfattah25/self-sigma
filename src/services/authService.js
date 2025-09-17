import { supabase } from '@/lib/supabaseClient.js';
import { LicenseService } from './licenseService.js';

export class AuthService {
  static async signUpWithLicense(email, password, licenseCode, name) {
    await LicenseService.verifyLicense(licenseCode);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) throw error;

    if (data.user?.email_confirmed_at) {
      await LicenseService.redeemLicense(licenseCode);
      return { user: data.user, needsConfirmation: false };
    }

    return {
      user: data.user,
      needsConfirmation: true,
      pendingLicense: { code: licenseCode, email },
    };
  }

  static async redeemAfterEmailConfirmation(licenseCode, email) {
    await LicenseService.redeemLicense(licenseCode, email);
  }

  static async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const hasAccess = await LicenseService.checkUserAccess();
    if (!hasAccess) {
      await supabase.auth.signOut();
      throw new Error('Akses tidak ditemukan untuk aplikasi ini');
    }

    return data;
  }

  static async signOut() {
    try {
      // Force global signout
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
    } catch (error) {
      // If global signout fails, try local signout
      await supabase.auth.signOut({ scope: 'local' });
    }

    // Clear all Supabase storage
    const clearStorage = (storage) => {
      try {
        const keys = Object.keys(storage).filter((k) => k.startsWith('sb-'));
        keys.forEach((k) => storage.removeItem(k));
      } catch {}
    };

    clearStorage(localStorage);
    clearStorage(sessionStorage);
  }

  static async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  }
}
