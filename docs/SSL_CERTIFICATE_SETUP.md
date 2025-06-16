# SSL Certificate Configuration Guide

This document provides guidance on properly configuring SSL certificates for the LIAM application, particularly when working with Supabase connections.

## Common SSL Certificate Issues

### Warning: Ignoring extra certs from certificate file

If you encounter warnings like:
```
Warning: Ignoring extra certs from $(pwd)/supabase-ca-from-env.crt, load failed: error:80000002:system library::No such file or directory
```

This typically indicates that Node.js is trying to load additional CA certificates from a file that doesn't exist.

## Root Causes and Solutions

### 1. NODE_EXTRA_CA_CERTS Environment Variable

The most common cause is the `NODE_EXTRA_CA_CERTS` environment variable pointing to a non-existent certificate file.

**Check for the variable:**
```bash
echo $NODE_EXTRA_CA_CERTS
```

**Solution:**
- If the variable points to a non-existent file, either:
  - Remove the environment variable: `unset NODE_EXTRA_CA_CERTS`
  - Or provide the correct path to a valid certificate file

### 2. Shell Profile Configuration

Check your shell profile files for SSL certificate configurations:
- `~/.bashrc`
- `~/.profile` 
- `~/.zshrc`

Look for lines like:
```bash
export NODE_EXTRA_CA_CERTS=/path/to/certificate.crt
```

### 3. Docker Environment Variables

If using Docker, check for SSL certificate environment variables in:
- Docker Compose files
- Dockerfile ENV statements
- Docker run commands with `-e` flags

## Local Development Setup

For local development with Supabase, SSL certificates are typically not required since the local Supabase instance runs over HTTP.

The default configuration in `.env.template` uses:
```
SUPABASE_URL=http://127.0.0.1:54321
```

## Production SSL Configuration

For production environments connecting to hosted Supabase instances:

1. **Use HTTPS URLs:**
   ```
   SUPABASE_URL=https://your-project.supabase.co
   ```

2. **If custom certificates are needed:**
   - Download the certificate file from your Supabase project settings
   - Place it in a secure location (e.g., `./certs/supabase-ca.crt`)
   - Set the environment variable:
     ```
     NODE_EXTRA_CA_CERTS=./certs/supabase-ca.crt
     ```

## Verification

After making changes, verify the setup:

1. **Start the application:**
   ```bash
   pnpm dev
   ```

2. **Check for SSL warnings in the console output**

3. **Test Supabase connectivity by using the application features**

## Troubleshooting

If you continue to see SSL certificate warnings:

1. **Check all environment variables:**
   ```bash
   printenv | grep -i cert
   printenv | grep -i ssl
   ```

2. **Verify certificate file exists:**
   ```bash
   ls -la /path/to/certificate/file
   ```

3. **Check Docker container environment (if applicable):**
   ```bash
   docker exec container_name printenv | grep -i cert
   ```

## Best Practices

1. **Never commit certificate files to version control**
2. **Use environment variables for certificate paths**
3. **Validate certificate file existence before setting NODE_EXTRA_CA_CERTS**
4. **Document SSL requirements in your deployment guides**
5. **Use relative paths when possible for portability**

## Support

If you continue to experience SSL certificate issues, please:
1. Check this documentation first
2. Verify your environment configuration
3. Test with a minimal reproduction case
4. Provide full error messages when seeking help
