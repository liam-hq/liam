# createPublicServerClient Testing Guide

## Overview
Detailed instructions for testing the `createPublicServerClient` function in a local environment. This function creates a Supabase client for anonymous access and serves as the foundation for the Public Share feature.

## Prerequisites
- Local Supabase environment is running
- Next.js app is running
- Environment variables are properly configured

## 1. Environment Check

### Check Supabase Status
```bash
cd frontend/internal-packages/db
pnpm supabase status
```

Expected output:
- API URL: http://127.0.0.1:54321
- anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

### Check Environment Variables
```bash
# In project root
cat .env | grep SUPABASE
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 2. Create Test API Endpoints

### Basic Connection Test
Create `frontend/apps/app/app/api/test-public-client/route.ts`:

```typescript
import { createPublicServerClient } from '@/libs/db/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test createPublicServerClient function
    const supabase = await createPublicServerClient()
    
    // Basic connection test
    const { data, error } = await supabase
      .from('public_share_settings')
      .select('*')
      .limit(1)
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: 'Failed to query public_share_settings table'
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'createPublicServerClient works correctly',
      data: data,
      clientInfo: {
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
```

### Public Data Access Test
Create `frontend/apps/app/app/api/test-public-access/route.ts`:

```typescript
import { createPublicServerClient } from '@/libs/db/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createPublicServerClient()
    
    // Get public design_sessions (testing RLS policies)
    const { data: publicSessions, error: sessionsError } = await supabase
      .from('design_sessions')
      .select(`
        id,
        name,
        created_at,
        public_share_settings!inner(created_at)
      `)
      .limit(5)
    
    if (sessionsError) {
      return NextResponse.json({ 
        success: false, 
        error: sessionsError.message,
        step: 'querying public design_sessions'
      }, { status: 500 })
    }
    
    // Get related artifacts
    const sessionIds = publicSessions?.map(s => s.id) || []
    const { data: artifacts, error: artifactsError } = await supabase
      .from('artifacts')
      .select('id, design_session_id, type, created_at')
      .in('design_session_id', sessionIds)
      .limit(10)
    
    if (artifactsError) {
      return NextResponse.json({ 
        success: false, 
        error: artifactsError.message,
        step: 'querying public artifacts'
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Public data access works correctly',
      data: {
        publicSessions: publicSessions,
        artifacts: artifacts,
        counts: {
          sessions: publicSessions?.length || 0,
          artifacts: artifacts?.length || 0
        }
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
```

## 3. Prepare Test Data

### Create Public Share Settings
Using Supabase Studio or direct SQL:

```sql
-- Verify test design_sessions exist
SELECT id, name FROM design_sessions LIMIT 5;

-- Create public share settings (example: make first session public)
INSERT INTO public_share_settings (design_session_id)
SELECT id FROM design_sessions LIMIT 1
ON CONFLICT (design_session_id) DO NOTHING;

-- Verify public settings
SELECT 
  pss.design_session_id,
  ds.name,
  pss.created_at
FROM public_share_settings pss
JOIN design_sessions ds ON pss.design_session_id = ds.id;
```

## 4. Run Tests

### Start Next.js App
```bash
# In project root
pnpm dev
```

### Test API Endpoints

#### Basic Connection Test
```bash
curl http://localhost:3001/api/test-public-client
```

Expected result:
```json
{
  "success": true,
  "message": "createPublicServerClient works correctly",
  "data": [...],
  "clientInfo": {
    "hasAnonKey": true,
    "supabaseUrl": "http://localhost:54321"
  }
}
```

#### Public Data Access Test
```bash
curl http://localhost:3001/api/test-public-access
```

Expected result:
```json
{
  "success": true,
  "message": "Public data access works correctly",
  "data": {
    "publicSessions": [...],
    "artifacts": [...],
    "counts": {
      "sessions": 1,
      "artifacts": 0
    }
  }
}
```

## 5. Browser Testing

### Create Test Page
Create `frontend/apps/app/app/test-public-client/page.tsx`:

```typescript
import { createPublicServerClient } from '@/libs/db/server'

export default async function TestPublicClientPage() {
  let result: any = {}
  let error: string | null = null
  
  try {
    const supabase = await createPublicServerClient()
    
    // Test fetching public data
    const { data: publicSessions, error: sessionsError } = await supabase
      .from('design_sessions')
      .select(`
        id,
        name,
        created_at,
        public_share_settings!inner(created_at)
      `)
      .limit(3)
    
    if (sessionsError) throw sessionsError
    
    result = {
      success: true,
      publicSessions,
      count: publicSessions?.length || 0
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error'
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">createPublicServerClient Test</h1>
      
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      ) : (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <strong>Success:</strong> createPublicServerClient is working correctly
          <pre className="mt-2 text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
```

Access `http://localhost:3001/test-public-client` in your browser

## 6. Verify RLS Policies

### Compare with Authenticated Client
```typescript
// Authenticated client
const authClient = await createClient()
const { data: authData } = await authClient.from('design_sessions').select('*')

// Anonymous client
const publicClient = await createPublicServerClient()
const { data: publicData } = await publicClient.from('design_sessions').select('*')

// publicData contains only publicly shared items, authData contains all within organization
```

## 7. Troubleshooting

### Common Issues

1. **Environment variables not set**
   ```bash
   # Check .env file
   cat .env | grep SUPABASE
   ```

2. **Supabase not running**
   ```bash
   cd frontend/internal-packages/db
   pnpm supabase start
   ```

3. **RLS policies not applied**
   ```sql
   -- Check policies
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
   FROM pg_policies 
   WHERE tablename IN ('design_sessions', 'artifacts', 'public_share_settings');
   ```

4. **No test data**
   ```sql
   -- Check public settings
   SELECT COUNT(*) FROM public_share_settings;
   ```

## 8. Expected Behavior

- ✅ `createPublicServerClient()` successfully returns a Supabase client
- ✅ Anonymous access can query `public_share_settings` table
- ✅ RLS policies ensure only publicly shared data is accessible
- ✅ No authentication required and can be executed server-side
- ✅ Cookie get/set is disabled (for anonymous access)

Following these steps confirms that the `createPublicServerClient` function is correctly implemented and ready to support the Public Share feature.