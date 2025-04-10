export const environment = {
    production: true,
    SUPABASE_URL: process.env['SUPABASE_URL'] || '',
    SUPABASE_KEY: process.env['SUPABASE_KEY'] || '',
    bypassAuth: process.env['BYPASS_AUTH'] === 'false'
};