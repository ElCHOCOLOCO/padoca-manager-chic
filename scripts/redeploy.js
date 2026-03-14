import fs from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const redeployPath = './.redeploy';
const timestamp = new Date().toISOString();
const content = `redeploy trigger ${timestamp}\n`;

console.log(`\n🔄 Triggering redeploy...`);
fs.writeFileSync(redeployPath, content);
console.log(`✅ Updated .redeploy with timestamp: ${timestamp}`);

// Try to commit and push
try {
  const PAT = process.env.GITHUB_TOKEN;
  if (!PAT) throw new Error('GITHUB_TOKEN not found in .env');
  
  const REPO = 'github.com/ElCHOCOLOCO/padoca-manager-chic.git';
  
  console.log('📦 Committing changes...');
  execSync('git add .');
  execSync('git commit -m "feat: Marx Gestão V4.5 - Voice commands and Sales Heatmap"');
  
  console.log('🚀 Pushing to GitHub...');
  // Use x-access-token and disable terminal prompt to ensure non-interactive push
  execSync(`git -c credential.helper= push https://x-access-token:${PAT}@${REPO} main --force`, {
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }
  });
  console.log('✅ Changes pushed successfully!');
} catch (err) {
  console.log('❌ Error during git operations:', err.message);
  if (err.stdout) console.log('STDOUT:', err.stdout.toString());
  if (err.stderr) console.log('STDERR:', err.stderr.toString());
}
