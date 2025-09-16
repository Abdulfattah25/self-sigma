<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <h4>🧪 Test License Integration</h4>
          </div>
          <div class="card-body">
            <!-- Test License Verification -->
            <div class="mb-4">
              <h6>1. Test Verifikasi License</h6>
              <div class="input-group mb-3">
                <input
                  v-model="testLicenseCode"
                  type="text"
                  class="form-control"
                  placeholder="Masukkan kode lisensi"
                />
                <button
                  class="btn btn-outline-primary"
                  @click="testVerifyLicense"
                  :disabled="loading"
                >
                  {{ loading ? 'Testing...' : 'Verify' }}
                </button>
              </div>
            </div>

            <!-- Test User Access -->
            <div class="mb-4">
              <h6>2. Test User Access</h6>
              <div class="input-group mb-3">
                <input
                  v-model="testUserId"
                  type="text"
                  class="form-control"
                  placeholder="User ID"
                />
                <button class="btn btn-outline-success" @click="testUserAccess" :disabled="loading">
                  Check Access
                </button>
              </div>
            </div>

            <!-- Results -->
            <div v-if="result" class="mt-3">
              <div :class="['alert', result.success ? 'alert-success' : 'alert-danger']">
                <strong>{{ result.success ? '✅ Success' : '❌ Error' }}</strong>
                <pre class="mt-2 mb-0">{{ JSON.stringify(result.data, null, 2) }}</pre>
              </div>
            </div>

            <!-- Quick Database Info -->
            <div class="mt-4 pt-3 border-top">
              <h6>📊 Database Connection Info</h6>
              <small class="text-muted">
                Supabase URL: {{ supabaseUrl ? '✅ Connected' : '❌ Not configured' }}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { createClient } from '@supabase/supabase-js';

// Reactive data
const testLicenseCode = ref('');
const testUserId = ref('');
const result = ref(null);
const loading = ref(false);

// Supabase setup from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
);

// Test functions
async function testVerifyLicense() {
  if (!testLicenseCode.value) {
    result.value = {
      success: false,
      data: { error: 'Masukkan kode lisensi' },
    };
    return;
  }

  loading.value = true;
  result.value = null;

  try {
    // Simulate license verification
    const response = await supabase.rpc('verify_license', {
      license_code: testLicenseCode.value,
    });

    result.value = {
      success: !response.error,
      data: response.error || response.data,
    };
  } catch (error) {
    result.value = {
      success: false,
      data: { error: error.message },
    };
  } finally {
    loading.value = false;
  }
}

async function testUserAccess() {
  if (!testUserId.value) {
    result.value = {
      success: false,
      data: { error: 'Masukkan User ID' },
    };
    return;
  }

  loading.value = true;
  result.value = null;

  try {
    // Check if user has access
    const { data, error } = await supabase
      .from('admin_app_users')
      .select('*')
      .eq('user_id', testUserId.value)
      .single();

    result.value = {
      success: !error,
      data: error || data,
    };
  } catch (error) {
    result.value = {
      success: false,
      data: { error: error.message },
    };
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
pre {
  font-size: 0.875rem;
  max-height: 200px;
  overflow-y: auto;
}

.card {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
</style>
