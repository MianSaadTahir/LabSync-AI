#!/usr/bin/env node
/**
 * Project Verification Script
 * Confirms all systems are ready before running
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('\n🔍 LabSync-AI - Project Verification\n');

let allGood = true;
const checks = [];

// 1. Check Node.js
try {
  const nodeVersion = execSync('node --version').toString().trim();
  checks.push({ name: 'Node.js', status: 'OK', details: nodeVersion });
} catch (e) {
  checks.push({ name: 'Node.js', status: 'MISSING', details: 'Required: v18+' });
  allGood = false;
}

// 2. Check npm
try {
  const npmVersion = execSync('npm --version').toString().trim();
  checks.push({ name: 'npm', status: 'OK', details: `v${npmVersion}` });
} catch (e) {
  checks.push({ name: 'npm', status: 'MISSING', details: 'Required' });
  allGood = false;
}

// 3. Check MongoDB installed
try {
  execSync('mongod --version', { stdio: 'ignore' });
  checks.push({ name: 'MongoDB', status: 'INSTALLED', details: 'Check if running' });
} catch (e) {
  checks.push({ name: 'MongoDB', status: 'NOT FOUND', details: 'Required - https://mongodb.com/download' });
  allGood = false;
}

// 4. Check .env files
const backendEnv = fs.existsSync(path.join(__dirname, 'backend/.env'));
checks.push({ name: 'Backend .env', status: backendEnv ? 'OK' : 'MISSING', details: backendEnv ? 'Configured' : 'Will be created' });

const frontendEnv = fs.existsSync(path.join(__dirname, 'frontend/.env.local'));
checks.push({ name: 'Frontend .env', status: frontendEnv ? 'OK' : 'MISSING', details: frontendEnv ? 'Configured' : 'Will be created' });

// 5. Check Gemini API Keys
if (backendEnv) {
  const envContent = fs.readFileSync(path.join(__dirname, 'backend/.env'), 'utf-8');
  const hasKeys = envContent.includes('AIzaSy');
  checks.push({ 
    name: 'Gemini API Keys', 
    status: hasKeys ? 'CONFIGURED' : 'MISSING', 
    details: hasKeys ? '✅ Ready for AI features' : '⚠️  Add keys to backend/.env'
  });
}

// 6. Check node_modules
const hasNodeModules = fs.existsSync(path.join(__dirname, 'node_modules'));
checks.push({ 
  name: 'Dependencies', 
  status: hasNodeModules ? 'INSTALLED' : 'NEED INSTALL', 
  details: hasNodeModules ? 'Ready' : 'Will install on first run'
});

// 7. Check workspaces
const workspaces = ['shared', 'agents', 'mcp-server', 'backend', 'frontend'];
let workspacesOk = 0;
workspaces.forEach(ws => {
  if (fs.existsSync(path.join(__dirname, ws, 'package.json'))) {
    workspacesOk++;
  }
});
checks.push({ 
  name: 'Project Structure', 
  status: workspacesOk === workspaces.length ? 'COMPLETE' : 'INCOMPLETE', 
  details: `${workspacesOk}/${workspaces.length} workspaces found`
});

// Print results
console.log('┌─ Verification Results');
checks.forEach((check, idx) => {
  const isLast = idx === checks.length - 1;
  const symbol = check.status.includes('OK') || check.status.includes('INSTALLED') || check.status.includes('CONFIGURED') || check.status.includes('COMPLETE') ? '✅' : '⚠️ ';
  console.log(`${isLast ? '└─' : '├─'} ${symbol} ${check.name.padEnd(20)} ${check.status.padEnd(12)} ${check.details}`);
});
console.log('');

if (allGood) {
  console.log('✅ All critical systems ready!\n');
  console.log('   Ready to run: npm run dev\n');
} else {
  console.log('⚠️  Please install missing components above before running npm run dev\n');
}

process.exit(allGood ? 0 : 1);
