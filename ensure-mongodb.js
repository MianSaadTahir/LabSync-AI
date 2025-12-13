#!/usr/bin/env node
/**
 * MongoDB Startup Helper
 * Checks if MongoDB is running and starts it if needed (Windows)
 */

const { execSync, spawn } = require('child_process');
const path = require('path');

async function checkMongoDBRunning() {
  try {
    // Try to connect to MongoDB using mongosh or mongo
    execSync('mongosh --eval "db.runCommand({ping: 1})" --quiet 2>nul', {
      stdio: 'ignore',
      timeout: 5000
    });
    return true;
  } catch (e) {
    // Try legacy mongo command
    try {
      execSync('mongo --eval "db.runCommand({ping: 1})" --quiet 2>nul', {
        stdio: 'ignore',
        timeout: 5000
      });
      return true;
    } catch (e2) {
      return false;
    }
  }
}

async function startMongoDB() {
  try {
    console.log('🚀 Starting MongoDB...');

    // Try to start MongoDB service on Windows
    try {
      execSync('net start MongoDB', { stdio: 'inherit' });
      console.log('✅ MongoDB service started');
      return true;
    } catch (e) {
      // Service might not be installed or need admin rights, try direct mongod command
      console.log('   Service start failed (may need admin rights), trying direct start...');
      try {
        // Try with default data path
        const dataPath = 'C:\\data\\db';
        const mongod = spawn('mongod', ['--dbpath', dataPath], {
          stdio: 'ignore',
          detached: true,
          shell: true,
          windowsHide: true
        });
        mongod.unref();
        console.log('✅ MongoDB started (direct) with data path:', dataPath);
        // Wait for MongoDB to be ready
        await new Promise(resolve => setTimeout(resolve, 3000));
        return true;
      } catch (e2) {
        console.log('   Direct start also failed:', e2.message);
        return false;
      }
    }
  } catch (error) {
    return false;
  }
}

async function ensureMongoDB() {
  try {
    console.log('🔍 Checking MongoDB status...');

    const isRunning = await checkMongoDBRunning();

    if (isRunning) {
      console.log('✅ MongoDB is already running');
      return true;
    }

    console.log('⚠️  MongoDB is not running, attempting to start...');
    const started = await startMongoDB();

    if (started) {
      // Verify it's actually running
      await new Promise(resolve => setTimeout(resolve, 2000));
      const verifying = await checkMongoDBRunning();
      if (verifying) {
        console.log('✅ MongoDB verification successful');
        return true;
      }
    }

    console.log('');
    console.log('⚠️  MongoDB could not be started automatically');
    console.log('📝 Please start MongoDB manually:');
    console.log('   Option 1: Run in a separate terminal: mongod --dbpath C:\\data\\db');
    console.log('   Option 2: Start Windows Service: net start MongoDB (as Admin)');
    console.log('   Option 3: Open Services.msc -> MongoDB -> Start');
    console.log('');

    // Don't fail - let the app try to connect anyway
    return false;
  } catch (error) {
    console.error('Error checking MongoDB:', error.message);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  ensureMongoDB().then(success => {
    // Always exit with 0 to not block npm run dev
    // The backend will show clear error if MongoDB isn't running
    process.exit(0);
  });
}

module.exports = { ensureMongoDB, checkMongoDBRunning };
