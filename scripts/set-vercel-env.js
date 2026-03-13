import dotenv from 'dotenv';
dotenv.config();

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECTS = [
  'prj_q06PEDHIWYH1BRpaozC1XTaTnynr', // padoca-manager-chic
  'prj_ZnmbP7A99hfjEA0NMMUKUeHEmFKW'  // marx-vendas-central-36
];

// Load envs from process.env (populated by dotenv from .env file)
const ENVS = {
  VITE_SUPABASE_URL_MARX: process.env.VITE_SUPABASE_URL_MARX,
  VITE_SUPABASE_ANON_KEY_MARX: process.env.VITE_SUPABASE_ANON_KEY_MARX,
  VITE_SUPABASE_URL_PADARIA: process.env.VITE_SUPABASE_URL_PADARIA,
  VITE_SUPABASE_ANON_KEY_PADARIA: process.env.VITE_SUPABASE_ANON_KEY_PADARIA,
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN
};

async function setEnvs() {
  if (!VERCEL_TOKEN) {
    console.log('❌ Error: VERCEL_TOKEN not found in .env');
    return;
  }

  for (const projectId of PROJECTS) {
    console.log(`\n🚀 Setting envs for project: ${projectId}`);
    for (const [key, value] of Object.entries(ENVS)) {
      if (!value) {
        console.log(`- ${key}: ⚠️ Skipped (value not found in .env)`);
        continue;
      }
      try {
        const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${VERCEL_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key,
            value,
            type: 'encrypted',
            target: ['production', 'preview', 'development'],
          }),
        });
        const data = await res.json();
        if (data.error && data.error.code === 'env_already_exists') {
          console.log(`- ${key}: ✅ Already exists`);
        } else if (data.key) {
          console.log(`- ${key}: ✅ Success`);
        } else {
          console.log(`- ${key}: ❌ Error: ${JSON.stringify(data)}`);
        }
      } catch (err) {
        console.log(`- ${key}: ❌ Error: ${err.message}`);
      }
    }
  }
}

setEnvs();
