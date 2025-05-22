const { config } = require('dotenv');
const { writeFileSync } = require('fs');

config();

const targetPath = './src/environments/environment.ts';

const envConfigFile = `
export const environment = {
    production: false,
    bypassAuth: true,
    supabaseUrl: '${process.env['SUPABASE_URL']}',
    supabaseKey: '${process.env['SUPABASE_KEY']}'
};
`;

writeFileSync(targetPath, envConfigFile);
console.log(`✅ Dev environment written to ${targetPath}`);
