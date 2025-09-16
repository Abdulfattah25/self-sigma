import { supabase } from '@/lib/supabaseClient.js';

export class LicenseService {
  static APP_NAME = 'productivity';

  static async checkUserAccess() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      const { data } = await supabase
        .from('admin_app_users')
        .select('status')
        .eq('app_name', this.APP_NAME)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      return !!data;
    } catch {
      return false;
    }
  }

  static async verifyLicense(licenseCode) {
    const { data, error } = await supabase.rpc('validate_license', {
      p_code: String(licenseCode || '').toUpperCase(),
    });
    if (error) throw new Error(error.message);
    // validate_license returns boolean
    return !!data;
  }

  static async redeemLicense(licenseCode, email) {
    let targetEmail = email;
    if (!targetEmail) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      targetEmail = user?.email || '';
    }

    const { data, error } = await supabase.rpc('use_license', {
      p_code: String(licenseCode || '').toUpperCase(),
      p_email: targetEmail,
    });

    if (error) throw new Error(error.message);
    // use_license returns boolean success
    if (!data) throw new Error('Kode lisensi tidak valid atau sudah digunakan');
    return true;
  }

  static async getUserLicenseInfo() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('admin_app_users')
        .select('app_name, status, activated_at')
        .eq('user_id', user.id)
        .eq('app_name', this.APP_NAME)
        .single();

      return data;
    } catch {
      return null;
    }
  }
}
