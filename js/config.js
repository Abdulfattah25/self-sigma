// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://wkkwvudhhmdzzthcsaml.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indra3d2dWRoaG1kenp0aGNzYW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExODU1NTYsImV4cCI6MjA2Njc2MTU1Nn0.kXnaIh3rRZvJlgpMZ3fmtqUXUZKs85ZFLLnhHxN9cmM'
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
