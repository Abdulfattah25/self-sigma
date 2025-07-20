// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://your-project-id.supabase.co',
    anonKey: 'your-anon-key-here'
}

// App Configuration
const APP_CONFIG = {
    name: 'Productivity Tracker',
    version: '1.0.0',
    author: 'Your Name'
}

// Make available globally
window.SUPABASE_CONFIG = SUPABASE_CONFIG
window.APP_CONFIG = APP_CONFIG
