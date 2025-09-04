#!/usr/bin/env node

// === pgTAP Extension Test ===
import { PGlite } from '@electric-sql/pglite'
import { pgtap } from '../src/extensions/pgtap'

async function testPgTAPExtension() {
  console.log('🧪 Testing pgTAP via PGlite Extension mechanism...')
  console.log('─'.repeat(50))
  
  try {
    // Create PGlite instance with pgTAP extension
    console.log('📦 Creating PGlite instance with pgTAP extension...')
    const db = new PGlite({
      extensions: {
        pgtap: pgtap
      }
    })
    
    console.log('✅ PGlite instance created successfully')
    
    // Check available extensions
    console.log('\n🔍 Checking available extensions...')
    const extensionsResult = await db.query(`
      SELECT name, default_version, installed_version, comment 
      FROM pg_available_extensions 
      WHERE name = 'pgtap'
      ORDER BY name;
    `)
    
    console.log('Available extensions:', extensionsResult.rows)
    
    // Try to create the extension
    console.log('\n🔧 Attempting to create pgTAP extension...')
    try {
      const createResult = await db.exec('CREATE EXTENSION IF NOT EXISTS pgtap;')
      console.log('Extension creation result:', {
        length: createResult.length,
        errors: createResult.filter(r => r.error).length,
        firstError: createResult.find(r => r.error)?.error
      })
      
      if (createResult.some(r => r.error)) {
        console.log('❌ Extension creation had errors')
        return false
      }
      
      console.log('✅ Extension created successfully')
      
    } catch (createError) {
      console.error('❌ Extension creation failed:', createError)
      return false
    }
    
    // Verify extension is installed
    console.log('\n🔍 Verifying extension installation...')
    const installedResult = await db.query(`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'pgtap';
    `)
    
    console.log('Installed extensions:', installedResult.rows)
    
    if (installedResult.rows.length === 0) {
      console.log('❌ pgTAP extension not found in installed extensions')
      return false
    }
    
    // Test pgTAP functions
    console.log('\n🧪 Testing pgTAP functions via extension...')
    
    // Test plan function
    const planResult = await db.query('SELECT plan(1);')
    console.log('Plan result:', planResult.rows)
    
    // Test ok function
    const okResult = await db.query("SELECT ok(true, 'Extension-based test');")
    console.log('Ok result:', okResult.rows)
    
    // Test finish function
    const finishResult = await db.query('SELECT finish();')
    console.log('Finish result:', finishResult.rows)
    
    console.log('\n✅ Extension-based pgTAP test successful!')
    return true
    
  } catch (error) {
    console.error('❌ Extension test error:', error)
    return false
  } finally {
    // Note: db.close() might not be available in all versions
    try {
      await db.close?.()
    } catch (e) {
      // Ignore close errors
    }
  }
}

async function testPgTAPAdvancedFunctions() {
  console.log('\n🚀 Testing advanced pgTAP functions via extension...')
  console.log('─'.repeat(50))
  
  try {
    // Create PGlite instance with pgTAP extension
    const db = new PGlite({
      extensions: {
        pgtap: pgtap
      }
    })
    
    // Install extension
    await db.exec('CREATE EXTENSION IF NOT EXISTS pgtap;')
    
    // Create a test table
    console.log('📋 Creating test table...')
    await db.exec(`
      CREATE TABLE IF NOT EXISTS test_users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE
      );
    `)
    
    // Test advanced pgTAP assertions
    console.log('🔍 Running advanced pgTAP tests...')
    const testResult = await db.query(`
      SELECT plan(5);
      SELECT has_table('test_users', 'Should have test_users table');
      SELECT has_column('test_users', 'id', 'Should have id column');
      SELECT has_column('test_users', 'name', 'Should have name column');
      SELECT col_type_is('test_users', 'id', 'integer', 'id should be integer');
      SELECT col_not_null('test_users', 'name', 'name should be NOT NULL');
      SELECT finish();
    `)
    
    console.log('\n🎯 Advanced TAP Test Output:')
    if (testResult.rows && testResult.rows.length > 0) {
      testResult.rows.forEach((row, index) => {
        const output = Object.values(row)[0]
        console.log(`  ${index + 1}: ${output}`)
      })
    }
    
    console.log('\n✅ Advanced pgTAP test successful!')
    return true
    
  } catch (error) {
    console.error('❌ Advanced test error:', error)
    return false
  }
}

async function debug() {
  console.log('🚀 pgTAP Extension Integration Test')
  console.log(`🕐 Started at: ${new Date().toISOString()}`)
  console.log('═'.repeat(60))
  
  const results = {
    basicExtension: false,
    advancedFunctions: false
  }
  
  // Test basic extension functionality
  results.basicExtension = await testPgTAPExtension()
  
  // Test advanced pgTAP functions if basic test passed
  if (results.basicExtension) {
    results.advancedFunctions = await testPgTAPAdvancedFunctions()
  }
  
  console.log('\n📊 Test Summary:')
  console.log('═'.repeat(60))
  console.log(`Basic Extension Test: ${results.basicExtension ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Advanced Functions Test: ${results.advancedFunctions ? '✅ PASS' : '❌ FAIL'}`)
  
  if (results.basicExtension && results.advancedFunctions) {
    console.log('\n🎉 pgTAP Extension integration is fully working!')
    console.log('🔧 Extension bundle mechanism is operational')
    console.log('💡 Ready for QA agent integration')
  } else if (results.basicExtension) {
    console.log('\n⚠️ Basic extension works but advanced functions failed')
    console.log('🔧 May need to check pgTAP SQL completeness')
  } else {
    console.log('\n❌ Extension mechanism is not working')
    console.log('🔧 Fall back to direct SQL loading approach')
    console.log('💡 Check bundle path and extension setup')
  }
  
  console.log(`\n🕐 Completed at: ${new Date().toISOString()}`)
}

debug().catch(err => {
  console.error('❌ Debug failed:', err)
  process.exit(1)
})