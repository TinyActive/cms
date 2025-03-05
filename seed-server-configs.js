#!/usr/bin/env node

/**
 * Script to seed server configuration data
 * Run with: node seed-server-configs.js
 */

console.log('Running migration...');
const { execSync } = require('child_process');

try {
  // Run migration
  execSync('npx prisma migrate dev', { stdio: 'inherit' });
  
  console.log('Seeding server configuration data...');
  // Run the seed script
  execSync('npx ts-node --compiler-options \'{"module":"CommonJS"}\' prisma/seed-server-configs.ts', { stdio: 'inherit' });
  
  console.log('Server configuration data seeded successfully!');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
} 