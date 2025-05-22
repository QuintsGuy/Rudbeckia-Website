declare const NG_ENV: any;

export const environment = {
    production: true,
    bypassAuth: false,
    SUPABASE_URL: NG_ENV.NG_SUPABASE_URL,
    SUPABASE_KEY: NG_ENV.NG_SUPABASE_KEY
};
