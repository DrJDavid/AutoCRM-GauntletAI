import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: {
    id: string
    organization_id: string
    email: string
    token: string
    created_at: string
    expires_at: string
  }
  schema: string
  old_record: null
}

serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json()
    
    // Only proceed for new invite inserts
    if (payload.type !== 'INSERT' || payload.table !== 'customer_organization_invites') {
      return new Response(JSON.stringify({ message: 'Not a new invite' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get organization details
    const { data: org, error: orgError } = await supabaseClient
      .from('organizations')
      .select('name')
      .eq('id', payload.record.organization_id)
      .single()

    if (orgError) throw orgError

    // For now, just log the email details
    console.log('Would send email to:', {
      to: payload.record.email,
      subject: `Invitation to join ${org.name} on AutoCRM`,
      inviteUrl: `${Deno.env.get('PUBLIC_SITE_URL')}/auth/accept-invite?token=${payload.record.token}`,
      organization: org.name,
      expiresAt: new Date(payload.record.expires_at).toLocaleDateString()
    })

    // TODO: Integrate with email service (e.g. Resend)
    // const emailResponse = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     from: 'AutoCRM <noreply@your-domain.com>',
    //     to: payload.record.email,
    //     subject: `Invitation to join ${org.name} on AutoCRM`,
    //     html: `
    //       <h1>You've been invited!</h1>
    //       <p>You've been invited to join ${org.name} on AutoCRM.</p>
    //       <p>Click the link below to accept the invitation:</p>
    //       <a href="${Deno.env.get('PUBLIC_SITE_URL')}/auth/accept-invite?token=${payload.record.token}">
    //         Accept Invitation
    //       </a>
    //       <p>This invite expires on ${new Date(payload.record.expires_at).toLocaleDateString()}</p>
    //     `
    //   })
    // })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error processing invite:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}) 