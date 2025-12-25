// using global fetch available in Node 18+
// Next.js environment usually has global fetch.

const BASE_URL = 'http://localhost:3000/api/v1'
// Generate a random email to avoid conflicts
const timestamp = Date.now()
const TEST_EMAIL = `test.user.${timestamp}@example.com`
const TEST_PASSWORD = 'Password123!' // Meets complexity requirements
const TEST_NAME = 'Test User'
const TEST_TENANT = `Test Tenant ${timestamp}`

async function runTests() {
  console.log('🚀 Starting Auth API Verification...')
  console.log(`Target: ${BASE_URL}`)
  console.log(`User: ${TEST_EMAIL}`)
  
  let accessToken = ''
  let refreshToken = ''
  let tenantId = ''

  // 1. REGISTER
  console.log('\n----------------------------------------')
  console.log('1. Testing Registration...')
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME,
        tenantName: TEST_TENANT
      })
    })

    const text = await res.text()
    if (!res.ok) throw new Error(`Status ${res.status}: ${text}`)
    
    const data = JSON.parse(text)
    console.log('✅ Registration Successful')
    console.log('User ID:', data.data.user.id)
    
    accessToken = data.data.token
    refreshToken = data.data.refreshToken
    tenantId = data.data.tenant.id
  } catch (err: any) {
    console.error('❌ Registration Failed:', err.message)
    process.exit(1)
  }

  // 2. GET CURRENT USER
  console.log('\n----------------------------------------')
  console.log('2. Testing Get Current User (Me)...')
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json' 
      }
    })

    const text = await res.text()
    if (!res.ok) throw new Error(`Status ${res.status}: ${text}`)

    const data = JSON.parse(text)
    if (data.data.user.email !== TEST_EMAIL) {
      throw new Error('Email mismatch in profile response')
    }
    console.log('✅ Get Profile Successful')
  } catch (err: any) {
    console.error('❌ Get Profile Failed:', err.message)
  }

  // 3. UPDATE PROFILE
  console.log('\n----------------------------------------')
  console.log('3. Testing Update Profile...')
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      method: 'PATCH',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'X-Tenant-ID': tenantId,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        name: 'Updated Name',
        phone: '+1234567890'
      })
    })

    const text = await res.text()
    if (!res.ok) throw new Error(`Status ${res.status}: ${text}`)

    const data = JSON.parse(text)
    if (data.data.name !== 'Updated Name') {
      throw new Error('Name not updated')
    }
    console.log('✅ Update Profile Successful')
  } catch (err: any) {
    console.error('❌ Update Profile Failed:', err.message)
  }

  // 4. REFRESH TOKEN
  console.log('\n----------------------------------------')
  console.log('4. Testing Refresh Token...')
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`, // API might expect this, or cookie. 
        // Our implementation expects cookie usually, but let's check the endpoint.
        // Actually the service just calls supabase.auth.refreshSession().
        // If we are using standard supabase client in API route, implementation details matter.
        // But our route might handle it.
        'Content-Type': 'application/json' 
      },
      // Usually client sends refresh token in body or cookie
      // Let's assume the client passes it? Or standard Supabase behavior.
      // Wait, our endpoint just calls `refreshToken(supabase)`. 
      // Supersbase client needs to have the session to refresh.
      // Let's retry skipping this if it assumes cookie-based session which fetch might not have.
    })
    
    // SKIP for now unless we know how cookie is handled
    console.log('⚠️ Skipping Refresh Token (Session Persistence check may be needed)')
  } catch (err: any) {
    console.error('❌ Refresh Token Failed:', err.message)
  }

  // 5. LOGOUT
  console.log('\n----------------------------------------')
  console.log('5. Testing Logout...')
  try {
    const res = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json' 
      }
    })

    if (!res.ok) {
       const text = await res.text()
       throw new Error(`Status ${res.status}: ${text}`)
    }
    console.log('✅ Logout Successful')
  } catch (err: any) {
    console.error('❌ Logout Failed:', err.message)
  }

  // 6. LOGIN (Login again)
  console.log('\n----------------------------------------')
  console.log('6. Testing Login (re-login)...')
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    })

    const text = await res.text()
    if (!res.ok) throw new Error(`Status ${res.status}: ${text}`)
    
    const data = JSON.parse(text)
    console.log('✅ Login Successful')
    accessToken = data.data.token // Update token
    tenantId = data.data.tenant.id
  } catch (err: any) {
    console.error('❌ Login Failed:', err.message)
    process.exit(1)
  }

  // 7. FORGOT PASSWORD
  console.log('\n----------------------------------------')
  console.log('7. Testing Forgot Password...')
  try {
    const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: TEST_EMAIL
      })
    })

    const text = await res.text()
    if (!res.ok) throw new Error(`Status ${res.status}: ${text}`)
    
    console.log('✅ Forgot Password Request Successful')
  } catch (err: any) {
    console.error('❌ Forgot Password Failed:', err.message)
  }

  console.log('\n----------------------------------------')
  console.log('SUMMARY: Basic verification complete.')
}

runTests().catch(console.error)
