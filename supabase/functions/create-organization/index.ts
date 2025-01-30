// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface CreateOrganizationRequest {
  name: string
  slug: string
  adminEmail: string
  adminPassword: string
}

console.log("Hello from Functions!")

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
      })
    }

    // Only allow POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parse request body
    const { name, slug, adminEmail, adminPassword } = await req.json() as CreateOrganizationRequest

    // Validate required fields
    if (!name || !slug || !adminEmail || !adminPassword) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Check if organization with slug already exists
    const { data: existingOrgs, error: slugError } = await supabaseAdmin
      .from('organizations')
      .select('id, slug')
      .eq('slug', slug)
      .eq('is_active', true)

    if (slugError) {
      console.error('Slug check error:', slugError)
      return new Response(
        JSON.stringify({ error: 'Error checking organization slug' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (existingOrgs && existingOrgs.length > 0) {
      return new Response(
        JSON.stringify({ error: `Organization with slug "${slug}" already exists` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create the user account
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true // Auto-confirm email for development
    })

    if (signUpError) {
      console.error('Auth signup error:', signUpError)
      return new Response(
        JSON.stringify({ error: 'Error creating user account' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'No user data returned' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create the organization
    const { data: orgData, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert([
        {
          name,
          slug,
          settings: {
            support_hours: '24/7',
            default_language: 'en',
            support_email: `support@${slug}.com`,
            billing_email: `billing@${slug}.com`
          },
          metadata: {},
          is_active: true
        }
      ])
      .select()
      .single()

    if (orgError) {
      console.error('Organization creation error:', orgError)
      // Cleanup: Delete the user if org creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: 'Error creating organization' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Create the admin profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          email: adminEmail,
          role: 'head_admin',
          organization_id: orgData.id,
          is_active: true
        }
      ])
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Cleanup: Delete the org and user if profile creation fails
      await supabaseAdmin.from('organizations').delete().eq('id', orgData.id)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return new Response(
        JSON.stringify({ error: 'Error creating admin profile' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Return success response
    return new Response(
      JSON.stringify({
        message: 'Organization created successfully',
        data: {
          organizationId: orgData.id,
          adminId: authData.user.id
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-organization' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
