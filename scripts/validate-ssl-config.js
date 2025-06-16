#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating SSL Certificate Configuration...\n');

let hasIssues = false;

function checkEnvironmentVariable(varName) {
  const value = process.env[varName];
  if (value) {
    console.log(`✓ Found ${varName}: ${value}`);
    
    if (varName === 'NODE_EXTRA_CA_CERTS') {
      const certPath = path.resolve(value);
      if (fs.existsSync(certPath)) {
        console.log(`  ✓ Certificate file exists: ${certPath}`);
      } else {
        console.log(`  ❌ Certificate file does not exist: ${certPath}`);
        console.log(`     This will cause SSL certificate warnings in Node.js`);
        hasIssues = true;
      }
    }
  }
}

const sslEnvVars = [
  'NODE_EXTRA_CA_CERTS',
  'SSL_CERT_FILE',
  'SSL_CERT_DIR',
  'NODE_TLS_REJECT_UNAUTHORIZED'
];

console.log('Checking SSL-related environment variables:');
sslEnvVars.forEach(checkEnvironmentVariable);

console.log('\nChecking for common certificate file patterns:');
const commonCertPaths = [
  './supabase-ca-from-env.crt',
  './certs/supabase-ca.crt',
  './prod-ca-2021.crt'
];

commonCertPaths.forEach(certPath => {
  if (fs.existsSync(certPath)) {
    console.log(`✓ Found certificate file: ${certPath}`);
  }
});

console.log('\nChecking Supabase configuration:');
const supabaseUrl = process.env.SUPABASE_URL;
if (supabaseUrl) {
  console.log(`✓ SUPABASE_URL: ${supabaseUrl}`);
  if (supabaseUrl.startsWith('https://')) {
    console.log('  ℹ️  Using HTTPS - SSL certificates may be required');
  } else if (supabaseUrl.startsWith('http://')) {
    console.log('  ℹ️  Using HTTP - SSL certificates not required');
  }
} else {
  console.log('❌ SUPABASE_URL not set');
  hasIssues = true;
}

console.log('\n' + '='.repeat(50));
if (hasIssues) {
  console.log('❌ SSL configuration issues detected!');
  console.log('Please review the issues above and consult docs/SSL_CERTIFICATE_SETUP.md');
  process.exit(1);
} else {
  console.log('✅ SSL configuration looks good!');
  process.exit(0);
}
