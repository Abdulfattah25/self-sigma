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
    const { data, error } = await supabase.rpc('verify_license', {
      p_app_name: this.APP_NAME,
      p_license_code: licenseCode.toUpperCase(),
    });

    if (error) throw new Error(error.message);
    return !!data;
  }

  static async redeemLicense(licenseCode) {
    const { data, error } = await supabase.rpc('redeem_license', {
      p_app_name: this.APP_NAME,
      p_license_code: licenseCode.toUpperCase(),
    });

    if (error) {
      const errorMessages = {
        LICENSE_NOT_FOUND: 'Kode lisensi tidak ditemukan',
        LICENSE_ALREADY_USED: 'Kode lisensi sudah digunakan',
        LICENSE_EXPIRED: 'Kode lisensi sudah kadaluarsa',
      };

      const errorKey = Object.keys(errorMessages).find((key) => error.message.includes(key));
      throw new Error(errorKey ? errorMessages[errorKey] : error.message);
    }

    return data?.[0];
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
