/**
 * Auth Service
 * 
 * Business logic for authentication and authorization.
 * Implements TDD Green phase - functions pass tests.
 */

import type { SupabaseClient, User } from '@supabase/supabase-js'

import type { Database } from '@/types/database/database.types'
import { 
  RegisterSchema, 
  LoginSchema, 
  UpdateProfileSchema 
} from '@/lib/validation/schemas'
import { 
  ValidationError, 
  ConflictError, 
  UnauthorizedError 
} from '@/lib/errors'

// =============================================================================
// TYPES
// =============================================================================

export interface AuthResponse {
  token: string
  refreshToken: string
  expiresAt: number
  user: {
    id: string
    email: string
    name: string
    role: string
    avatarUrl?: string
  }
  tenant: {
    id: string
    name: string
    subdomain?: string
  }
}

export interface RegisterPayload {
  email: string
  password: string
  name: string
  phone?: string
  tenantName?: string
  inviteCode?: string
}

export interface LoginPayload {
  email: string
  password: string
  tenantId?: string
}

export interface UpdateProfilePayload {
  name?: string
  phone?: string
  avatarUrl?: string | null
}

export interface CurrentUserResponse {
  user: {
    id: string
    email: string
    name: string
    role: string
    avatarUrl?: string
    phone?: string
    createdAt: string
  }
  tenant: {
    id: string
    name: string
    subdomain?: string
  }
}

export interface TokenResponse {
  token: string
  refreshToken: string
  expiresAt: number
}

// =============================================================================
// REGISTRATION
// =============================================================================

/**
 * Register a new user and optionally create a new tenant.
 * @throws ValidationError for invalid input
 * @throws ConflictError if email already exists
 */
export async function registerUser(
  supabase: SupabaseClient<Database>,
  payload: RegisterPayload
): Promise<AuthResponse> {
  // Validate input
  const validation = RegisterSchema.safeParse(payload)

  if (!validation.success) {
    throw ValidationError.fromZodError(validation.error)
  }

  const { email, password, name, phone, tenantName, inviteCode } = validation.data

  // Use admin API to create user (auto-confirms, bypasses email confirmation)
  // Note: supabase must be an admin client for this to work
  const { data: authData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      name,
      phone,
    },
  })

  let authUserId: string

  if (createError) {
    if (createError.message.includes('already been registered') || 
        createError.message.includes('already exists') ||
        (createError as any).code === 'email_exists') {
      
      // Check if user exists in our public.users table
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existingProfile) {
        throw new ConflictError('User with this email already exists')
      }

      // If no public profile exists, it's an orphaned auth user
      // We retrieve the ID and proceed
      const { data: userData } = await supabase.auth.admin.listUsers()
      const existingAuthUser = userData.users.find(u => u.email === email)
      
      if (!existingAuthUser) {
        throw new Error('User exists in Auth but could not be retrieved')
      }
      
      authUserId = existingAuthUser.id
      console.log('Adopting orphaned auth user:', authUserId)
    } else {
      throw new Error(createError.message)
    }
  } else {
    if (!authData.user) {
      throw new Error('Registration failed: No user data returned')
    }

    authUserId = authData.user.id
  }

  let tenantId: string
  let tenantData: { id: string; name: string; subdomain?: string }

  // Create new tenant or join existing
  if (tenantName) {
    // Create new tenant
    const { data: newTenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: tenantName,
        status: 'active',
        plan: 'free',
      })
      .select()
      .single()

    if (tenantError || !newTenant) {
      console.error('Tenant creation error:', tenantError)
      throw new Error(`Failed to create tenant: ${tenantError?.message || 'Unknown error'}`)
    }

    tenantId = newTenant.id
    tenantData = {
      id: newTenant.id,
      name: newTenant.name,
      subdomain: newTenant.subdomain ?? undefined,
    }
  } else if (inviteCode) {
    // TODO: Implement invite code lookup
    throw new Error('Invite code not yet implemented')
  } else {
    throw new ValidationError('Either tenantName or inviteCode is required')
  }

  // Create user record with tenant association
  const { data: userRecord, error: userError } = await supabase
    .from('users')
    .insert({
      id: authUserId,
      tenant_id: tenantId,
      email,
      name,
      phone: phone ?? null,
      role: 'admin', // First user is admin
      status: 'active',
    })
    .select()
    .single()

  if (userError || !userRecord) {
    console.error('User record creation error:', userError)
    throw new Error('Failed to create user record')
  }

  // Update user metadata in Supabase Auth to include tenant_id and role
  // This ensures the JWT issued during sign-in contains the tenant context
  const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
    authUserId,
    {
      user_metadata: {
        tenant_id: tenantId,
        role: userRecord.role,
      }
    }
  )

  if (updateAuthError) {
    console.error('Failed to update auth user metadata:', updateAuthError)

    // We don't necessarily want to fail here if the record was already created,
    // but for registration safety we should probably know about it.
  }

  // Sign in the user to get a session
  const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError || !sessionData.session) {
    throw new Error('Failed to create session after registration')
  }

  return {
    token: sessionData.session.access_token,
    refreshToken: sessionData.session.refresh_token,
    expiresAt: sessionData.session.expires_at ?? Date.now() + 3600000,
    user: {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role,
      avatarUrl: userRecord.avatar_url ?? undefined,
    },
    tenant: tenantData,
  }
}

// =============================================================================
// LOGIN
// =============================================================================

/**
 * Login user with email and password.
 * @throws UnauthorizedError for invalid credentials
 */
export async function loginUser(
  supabase: SupabaseClient<Database>,
  payload: LoginPayload
): Promise<AuthResponse> {
  // Validate input
  const validation = LoginSchema.safeParse(payload)

  if (!validation.success) {
    throw ValidationError.fromZodError(validation.error)
  }

  const { email, password, tenantId } = validation.data

  // Sign in with Supabase Auth
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError || !authData.user || !authData.session) {
    throw new UnauthorizedError('Invalid credentials')
  }

  // Get user record
  let userQuery = supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)

  if (tenantId) {
    userQuery = userQuery.eq('tenant_id', tenantId)
  }

  const { data: userRecord, error: userError } = await userQuery.single()

  if (userError || !userRecord) {
    throw new UnauthorizedError('Invalid credentials')
  }

  // Get tenant info
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, subdomain')
    .eq('id', userRecord.tenant_id)
    .single()

  if (tenantError || !tenantData) {
    throw new Error('Tenant not found')
  }

  // Update last login
  await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userRecord.id)

  return {
    token: authData.session.access_token,
    refreshToken: authData.session.refresh_token,
    expiresAt: authData.session.expires_at ?? Date.now() + 3600000,
    user: {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role,
      avatarUrl: userRecord.avatar_url ?? undefined,
    },
    tenant: {
      id: tenantData.id,
      name: tenantData.name,
      subdomain: tenantData.subdomain ?? undefined,
    },
  }
}

// =============================================================================
// LOGOUT
// =============================================================================

/**
 * Logout current user and invalidate session.
 */
export async function logoutUser(
  supabase: SupabaseClient<Database>
): Promise<void> {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }
}

// =============================================================================
// GET CURRENT USER
// =============================================================================

/**
 * Get current authenticated user info.
 * @param supabase - Supabase client
 * @param user - Optional already authenticated user object
 * @throws UnauthorizedError if not authenticated
 */
export async function getCurrentUser(
  supabase: SupabaseClient<Database>,
  user?: User
): Promise<CurrentUserResponse> {
  // Use provided user or fetch from session
  const currentUser = user || (await supabase.auth.getUser()).data.user

  if (!currentUser) {
    throw new UnauthorizedError('Not authenticated')
  }

  // Get user record
  const { data: userRecord, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', currentUser.id)
    .single()

  if (userError || !userRecord) {
    throw new UnauthorizedError('User record not found')
  }

  // Get tenant info
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, subdomain')
    .eq('id', userRecord.tenant_id)
    .single()

  if (tenantError || !tenantData) {
    throw new Error('Tenant not found')
  }

  return {
    user: {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role,
      avatarUrl: userRecord.avatar_url ?? undefined,
      phone: userRecord.phone ?? undefined,
      createdAt: userRecord.created_at,
    },
    tenant: {
      id: tenantData.id,
      name: tenantData.name,
      subdomain: tenantData.subdomain ?? undefined,
    },
  }
}

// =============================================================================
// UPDATE PROFILE
// =============================================================================

/**
 * Update current user's profile.
 * @param supabase - Supabase client
 * @param payload - Update payload
 * @param user - Optional already authenticated user object
 * @throws UnauthorizedError if not authenticated
 * @throws ValidationError for invalid input
 */
export async function updateUserProfile(
  supabase: SupabaseClient<Database>,
  payload: UpdateProfilePayload,
  user?: User
): Promise<{ id: string; name: string; phone?: string; avatarUrl?: string }> {
  // Validate input
  const validation = UpdateProfileSchema.safeParse(payload)

  if (!validation.success) {
    throw ValidationError.fromZodError(validation.error)
  }

  // Use provided user or fetch from session
  const currentUser = user || (await supabase.auth.getUser()).data.user

  if (!currentUser) {
    throw new UnauthorizedError('Not authenticated')
  }

  const updateData: Record<string, unknown> = {}

  if (payload.name !== undefined) updateData.name = payload.name
  if (payload.phone !== undefined) updateData.phone = payload.phone
  if (payload.avatarUrl !== undefined) updateData.avatar_url = payload.avatarUrl

  const { data: updated, error: updateError } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', currentUser.id)
    .select('id, name, phone, avatar_url')
    .single()

  if (updateError || !updated) {
    throw new Error('Failed to update profile')
  }

  return {
    id: updated.id,
    name: updated.name,
    phone: updated.phone ?? undefined,
    avatarUrl: updated.avatar_url ?? undefined,
  }
}

// =============================================================================
// REFRESH TOKEN
// =============================================================================

/**
 * Refresh access token.
 * @throws UnauthorizedError if refresh token is invalid
 */
export async function refreshToken(
  supabase: SupabaseClient<Database>
): Promise<TokenResponse> {
  const { data, error } = await supabase.auth.refreshSession()

  if (error || !data.session) {
    throw new UnauthorizedError('Invalid refresh token')
  }

  return {
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresAt: data.session.expires_at ?? Date.now() + 3600000,
  }
}

// =============================================================================
// PASSWORD RESET
// =============================================================================

/**
 * Request password reset email.
 */
export async function forgotPassword(
  supabase: SupabaseClient<Database>,
  email: string
): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  })

  // Don't reveal if email exists or not
  if (error) {
    console.error('Password reset error:', error.message)
  }
}

/**
 * Reset password with reset token.
 * @throws ValidationError for invalid or expired token
 */
export async function resetPassword(
  supabase: SupabaseClient<Database>,
  token: string,
  newPassword: string
): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw new ValidationError('Invalid or expired reset token')
  }
}
