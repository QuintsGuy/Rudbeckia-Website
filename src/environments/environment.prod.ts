declare const NG_ENV: any;

export const environment = {
    production: true,
    SUPABASE_URL: NG_ENV.SUPABASE_URL,
    SUPABASE_KEY: NG_ENV.SUPABASE_KEY,
    BYPASS_AUTH: NG_ENV.BYPASS_AUTH === 'true'
};