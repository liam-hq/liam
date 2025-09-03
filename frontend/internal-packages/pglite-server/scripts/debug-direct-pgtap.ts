#!/usr/bin/env node

// === Direct pgTAP SQL Test ===
import { PGlite } from '@electric-sql/pglite'

async function testDirectPgTAPSQL() {
  console.log('🧪 Testing pgTAP SQL directly without extension bundle...')
  
  const db = new PGlite()
  
  try {
    // Read the pgTAP SQL content directly
    const fs = await import('fs/promises')
    const sqlContent = await fs.readFile('/tmp/pgtap-bundle/share/postgresql/extension/pgtap--1.3.4.sql', 'utf8')
    
    console.log('📁 SQL content length:', sqlContent.length)
    console.log('📋 First 500 characters:', sqlContent.substring(0, 500))
    
    // Try to execute the SQL directly
    console.log('\n🔍 Executing pgTAP SQL directly...')
    const result = await db.exec(sqlContent)
    console.log('Direct SQL execution result:', {
      length: result.length,
      errors: result.filter(r => r.error).length,
      firstError: result.find(r => r.error)?.error
    })
    
    if (result.some(r => r.error)) {
      console.log('❌ Direct SQL execution had errors')
      return false
    }
    
    // Test basic pgTAP functions
    console.log('\n🧪 Testing pgTAP functions after direct SQL load...')
    const planResult = await db.query('SELECT plan(1);')
    console.log('Plan result:', planResult)
    
    const okResult = await db.query("SELECT ok(true, 'Direct load test');")
    console.log('Ok result:', okResult)
    
    const finishResult = await db.query('SELECT finish();')
    console.log('Finish result:', finishResult)
    
    console.log('\n✅ Direct pgTAP SQL execution successful!')
    return true
    
  } catch (error) {
    console.error('❌ Direct SQL test error:', error)
    return false
  } finally {
    await db.close()
  }
}

async function testExtensionCreationFromSQL() {
  console.log('\n🔧 Testing manual extension creation...')
  
  const db = new PGlite()
  
  try {
    // Try to create extension files manually in the database
    console.log('📝 Creating extension manually...')
    
    // Read SQL content
    const fs = await import('fs/promises')
    const sqlContent = await fs.readFile('/tmp/pgtap-bundle/share/postgresql/extension/pgtap--1.3.4.sql', 'utf8')
    
    // Execute the SQL content directly (simulating extension installation)
    await db.exec(sqlContent)
    
    // Now test if pgTAP functions are available
    const testResult = await db.query(`
      SELECT plan(2);
      SELECT ok(1 = 1, 'Basic equality test');
      SELECT is(42, 42, 'Number comparison test');  
      SELECT finish();
    `)
    
    console.log('Manual extension test result:', testResult)
    
    // Check the TAP output
    if (testResult.rows && testResult.rows.length > 0) {
      console.log('\n🎯 TAP Output:')
      testResult.rows.forEach((row, index) => {
        const output = Object.values(row)[0]
        console.log(`  ${index + 1}: ${output}`)
      })
    }
    
    console.log('\n✅ Manual extension creation successful!')
    return true
    
  } catch (error) {
    console.error('❌ Manual extension creation error:', error)
    return false
  } finally {
    await db.close()
  }
}

async function debug() {
  console.log('🚀 Direct pgTAP SQL Test')
  console.log(`🕐 Started at: ${new Date().toISOString()}`)
  console.log('═'.repeat(50))
  
  const results = {
    directSQL: false,
    manualExtension: false
  }
  
  results.directSQL = await testDirectPgTAPSQL()
  results.manualExtension = await testExtensionCreationFromSQL()
  
  console.log('\n📊 Test Summary:')
  console.log('═'.repeat(50))
  console.log(`Direct SQL execution: ${results.directSQL ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Manual extension creation: ${results.manualExtension ? '✅ PASS' : '❌ FAIL'}`)
  
  if (results.directSQL && results.manualExtension) {
    console.log('\n🎉 pgTAP SQL works perfectly with PGlite!')
    console.log('🔧 Problem is in the extension bundle mechanism')
    console.log('💡 Solution: Use direct SQL loading instead of extension bundle')
  } else {
    console.log('\n❌ pgTAP has SQL compatibility issues with PGlite')
  }
  
  console.log(`\n🕐 Completed at: ${new Date().toISOString()}`)
}

debug().catch(err => {
  console.error('❌ Debug failed:', err)
  process.exit(1)
})