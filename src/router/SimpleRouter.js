// Router sederhana untuk menangani auth flow
class SimpleRouter {
  constructor() {
    this.routes = {
      '/': () => this.navigateToDefault(),
      '/signup': () => this.showSignUp(),
      '/signin': () => this.showSignIn(),
      '/dashboard': () => this.showDashboard(),
    };

    this.currentPath = window.location.pathname;
    this.init();
  }

  init() {
    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      this.currentPath = window.location.pathname;
      this.handleRoute();
    });

    // Handle initial load
    this.handleRoute();
  }

  async handleRoute() {
    const handler = this.routes[this.currentPath] || this.routes['/'];
    await handler();
  }

  push(path) {
    this.currentPath = path;
    window.history.pushState({}, '', path);
    this.handleRoute();
  }

  async navigateToDefault() {
    // Check if user is authenticated and has access
    const { AuthService } = await import('./services/authService.js');
    const { LicenseService } = await import('./services/licenseService.js');

    try {
      const user = await AuthService.getCurrentUser();
      if (user && (await LicenseService.checkUserAccess())) {
        this.push('/dashboard');
      } else {
        this.push('/signin');
      }
    } catch {
      this.push('/signin');
    }
  }

  async showSignUp() {
    // Check if already authenticated
    const { AuthService } = await import('./services/authService.js');
    const { LicenseService } = await import('./services/licenseService.js');

    try {
      const user = await AuthService.getCurrentUser();
      if (user && (await LicenseService.checkUserAccess())) {
        this.push('/dashboard');
        return;
      }
    } catch {
      // Continue to signup
    }

    this.renderAuthComponent('signup');
  }

  async showSignIn() {
    // Check if already authenticated
    const { AuthService } = await import('./services/authService.js');
    const { LicenseService } = await import('./services/licenseService.js');

    try {
      const user = await AuthService.getCurrentUser();
      if (user && (await LicenseService.checkUserAccess())) {
        this.push('/dashboard');
        return;
      }
    } catch {
      // Continue to signin
    }

    this.renderAuthComponent('signin');
  }

  async showDashboard() {
    // Check auth and access
    const { AuthService } = await import('./services/authService.js');
    const { LicenseService } = await import('./services/licenseService.js');

    try {
      const user = await AuthService.getCurrentUser();
      if (!user) {
        this.push('/signin');
        return;
      }

      const hasAccess = await LicenseService.checkUserAccess();
      if (!hasAccess) {
        await AuthService.signOut();
        this.push('/signup');
        return;
      }

      this.renderDashboard();
    } catch {
      this.push('/signin');
    }
  }

  renderAuthComponent(type) {
    const appContainer = document.getElementById('app');
    if (!appContainer) return;

    appContainer.innerHTML = `
      <div id="auth-container"></div>
    `;

    if (type === 'signup') {
      this.loadSignUpForm();
    } else {
      this.loadSignInForm();
    }
  }

  async loadSignUpForm() {
    const { validateSignUpForm, formatLicenseCode } = await import('./utils/validation.js');
    const { AuthService } = await import('./services/authService.js');

    const container = document.getElementById('auth-container');
    container.innerHTML = `
      <div class="signup-form" style="max-width: 400px; margin: 0 auto; padding: 2rem;">
        <h2>Daftar Akun Productivity</h2>
        
        <form id="signup-form">
          <div class="field" style="margin-bottom: 1rem;">
            <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Kode Lisensi</label>
            <input
              id="licenseCode"
              type="text"
              placeholder="Masukkan kode lisensi"
              style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px;"
            />
            <span id="licenseCode-error" class="error" style="color: #dc2626; font-size: 0.875rem; margin-top: 0.25rem; display: none;"></span>
          </div>

          <div class="field" style="margin-bottom: 1rem;">
            <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Nama Lengkap</label>
            <input
              id="name"
              type="text"
              placeholder="Nama lengkap"
              style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px;"
            />
            <span id="name-error" class="error" style="color: #dc2626; font-size: 0.875rem; margin-top: 0.25rem; display: none;"></span>
          </div>

          <div class="field" style="margin-bottom: 1rem;">
            <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Email</label>
            <input
              id="email"
              type="email"
              placeholder="email@domain.com"
              style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px;"
            />
            <span id="email-error" class="error" style="color: #dc2626; font-size: 0.875rem; margin-top: 0.25rem; display: none;"></span>
          </div>

          <div class="field" style="margin-bottom: 1rem;">
            <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Minimal 6 karakter"
              style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px;"
            />
            <span id="password-error" class="error" style="color: #dc2626; font-size: 0.875rem; margin-top: 0.25rem; display: none;"></span>
          </div>

          <button type="submit" id="signup-btn" style="width: 100%; padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 4px; font-weight: 500; cursor: pointer;">
            Daftar
          </button>
        </form>

        <div id="error-message" style="background: #fef2f2; color: #dc2626; padding: 0.75rem; border-radius: 4px; margin-top: 1rem; display: none;"></div>
        <div id="success-message" style="background: #f0fdf4; color: #166534; padding: 0.75rem; border-radius: 4px; margin-top: 1rem; display: none;"></div>

        <p style="text-align: center; margin-top: 1.5rem;">
          Sudah punya akun? <a href="/signin" style="color: #3b82f6; text-decoration: none;">Masuk di sini</a>
        </p>
      </div>
    `;

    // Form handling
    const form = document.getElementById('signup-form');
    const licenseInput = document.getElementById('licenseCode');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('signup-btn');

    // License code formatting
    licenseInput.addEventListener('input', (e) => {
      e.target.value = formatLicenseCode(e.target.value);
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = {
        licenseCode: licenseInput.value,
        name: nameInput.value,
        email: emailInput.value,
        password: passwordInput.value,
      };

      // Clear previous errors
      document.querySelectorAll('.error').forEach((el) => (el.style.display = 'none'));
      document.getElementById('error-message').style.display = 'none';

      const validation = validateSignUpForm(formData);

      if (!validation.isValid) {
        Object.keys(validation.errors).forEach((field) => {
          const errorEl = document.getElementById(`${field}-error`);
          if (errorEl) {
            errorEl.textContent = validation.errors[field];
            errorEl.style.display = 'block';
          }
        });
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Memproses...';

      try {
        const result = await AuthService.signUpWithLicense(
          formData.email,
          formData.password,
          formData.licenseCode,
          formData.name,
        );

        if (result.needsConfirmation) {
          document.getElementById('success-message').textContent =
            'Akun berhasil dibuat! Cek email untuk konfirmasi.';
          document.getElementById('success-message').style.display = 'block';
          localStorage.setItem('pendingLicense', JSON.stringify(result.pendingLicense));
        } else {
          this.push('/dashboard');
        }
      } catch (error) {
        document.getElementById('error-message').textContent = error.message;
        document.getElementById('error-message').style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Daftar';
      }
    });

    // Handle navigation links
    container.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        e.preventDefault();
        this.push(e.target.getAttribute('href'));
      }
    });
  }

  async loadSignInForm() {
    const { AuthService } = await import('./services/authService.js');

    const container = document.getElementById('auth-container');
    container.innerHTML = `
      <div class="signin-form" style="max-width: 400px; margin: 0 auto; padding: 2rem;">
        <h2>Masuk ke Productivity</h2>
        
        <form id="signin-form">
          <div class="field" style="margin-bottom: 1rem;">
            <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Email</label>
            <input
              id="email"
              type="email"
              placeholder="email@domain.com"
              style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px;"
            />
          </div>

          <div class="field" style="margin-bottom: 1rem;">
            <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Password"
              style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px;"
            />
          </div>

          <button type="submit" id="signin-btn" style="width: 100%; padding: 0.75rem; background: #3b82f6; color: white; border: none; border-radius: 4px; font-weight: 500; cursor: pointer;">
            Masuk
          </button>
        </form>

        <div id="error-message" style="background: #fef2f2; color: #dc2626; padding: 0.75rem; border-radius: 4px; margin-top: 1rem; display: none;"></div>

        <p style="text-align: center; margin-top: 1.5rem;">
          Belum punya akun? <a href="/signup" style="color: #3b82f6; text-decoration: none;">Daftar di sini</a>
        </p>
      </div>
    `;

    const form = document.getElementById('signin-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('signin-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      document.getElementById('error-message').style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Masuk...';

      try {
        await AuthService.signIn(emailInput.value, passwordInput.value);
        this.push('/dashboard');
      } catch (error) {
        document.getElementById('error-message').textContent = error.message;
        document.getElementById('error-message').style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Masuk';
      }
    });

    // Handle navigation links
    container.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        e.preventDefault();
        this.push(e.target.getAttribute('href'));
      }
    });
  }

  renderDashboard() {
    // Load the original app dashboard
    window.location.reload();
  }
}

export default SimpleRouter;
