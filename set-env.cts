const { config } = require('dotenv');
const { writeFileSync } = require('fs');

config();

const targetPath = './src/environments/environment.prod.ts';

const envConfigFile = `
export const environment = {
    production: true,
    bypassAuth: false,
    supabaseUrl: '${process.env['SUPABASE_URL']}',
    supabaseKey: '${process.env['SUPABASE_KEY']}'
};
`;

writeFileSync(targetPath, envConfigFile);
console.log(`✅ Dev environment written to ${targetPath}`);
