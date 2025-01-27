import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';
import { z } from 'zod';

const router = Router();

// Type guard for PostgrestError
function isPostgrestError(error: unknown): error is PostgrestError {
  return typeof error === 'object' && error !== null && 'message' in error;
}

// Validation schemas
const createInviteSchema = z.object({
  email: z.string().email(),
  organizationId: z.string().uuid(),
  message: z.string().optional(),
});

const acceptInviteSchema = z.object({
  token: z.string(),
  type: z.enum(['agent', 'customer']),
  password: z.string().min(8),
});

// POST /api/invites/agent - Create agent invite
router.post('/agent', async (req, res) => {
  try {
    // Validate request body
    const { email, organizationId, message } = createInviteSchema.parse(req.body);

    // Check if invite already exists
    const { data: existingInvite, error: checkError } = await supabaseAdmin
      .from('agent_organization_invites')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('email', email)
      .eq('accepted', false)
      .single();

    if (checkError && !checkError.message.includes('No rows found')) {
      throw checkError;
    }

    if (existingInvite) {
      return res.status(400).json({
        error: 'An active invite already exists for this email'
      });
    }

    // Create invite record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { data: invite, error: createError } = await supabaseAdmin
      .from('agent_organization_invites')
      .insert([
        {
          organization_id: organizationId,
          email,
          expires_at: expiresAt.toISOString(),
        }
      ])
      .select()
      .single();

    if (createError) throw createError;

    // TODO: Send invite email
    // For now, just return the invite data
    res.json({
      success: true,
      data: invite,
      message: 'Invite created successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      });
    }

    const message = isPostgrestError(error) ? error.message : 'An error occurred';
    res.status(500).json({ error: message });
  }
});

// POST /api/invites/customer - Create customer invite
router.post('/customer', async (req, res) => {
  try {
    // Validate request body
    const { email, organizationId, message } = createInviteSchema.parse(req.body);

    // Check if invite already exists
    const { data: existingInvite, error: checkError } = await supabaseAdmin
      .from('customer_organization_invites')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('email', email)
      .eq('accepted', false)
      .single();

    if (checkError && !checkError.message.includes('No rows found')) {
      throw checkError;
    }

    if (existingInvite) {
      return res.status(400).json({
        error: 'An active invite already exists for this email'
      });
    }

    // Create invite record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { data: invite, error: createError } = await supabaseAdmin
      .from('customer_organization_invites')
      .insert([
        {
          organization_id: organizationId,
          email,
          expires_at: expiresAt.toISOString(),
        }
      ])
      .select()
      .single();

    if (createError) throw createError;

    // TODO: Send invite email
    // For now, just return the invite data
    res.json({
      success: true,
      data: invite,
      message: 'Invite created successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      });
    }

    const message = isPostgrestError(error) ? error.message : 'An error occurred';
    res.status(500).json({ error: message });
  }
});

// POST /api/invites/accept - Accept an invite
router.post('/accept', async (req, res) => {
  try {
    // Validate request body
    const { token, type, password } = acceptInviteSchema.parse(req.body);
    
    const table = type === 'agent' ? 'agent_organization_invites' : 'customer_organization_invites';

    // Get invite details
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from(table)
      .select(`
        *,
        organizations (
          id,
          name,
          slug
        )
      `)
      .eq('token', token)
      .single();

    if (inviteError) throw inviteError;

    if (!invite) {
      return res.status(404).json({
        error: 'Invite not found'
      });
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return res.status(400).json({
        error: 'Invite has expired'
      });
    }

    // Check if already accepted
    if (invite.accepted) {
      return res.status(400).json({
        error: 'Invite has already been accepted'
      });
    }

    // Create user account
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;

    // Create profile with correct role
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          email: invite.email,
          role: type,
          organization_id: invite.organization_id,
        },
      ]);

    if (profileError) throw profileError;

    // Mark invite as accepted
    const { error: updateError } = await supabaseAdmin
      .from(table)
      .update({ 
        accepted: true,
        accepted_at: new Date().toISOString(),
        user_id: authData.user.id
      })
      .eq('token', token);

    if (updateError) throw updateError;

    // Return success with login credentials
    res.json({
      success: true,
      data: {
        email: invite.email,
        organization: invite.organizations,
      },
      message: 'Invite accepted successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Invalid request data',
        details: error.errors
      });
    }

    const message = isPostgrestError(error) ? error.message : 'An error occurred';
    res.status(500).json({ error: message });
  }
});

// GET /api/invites/check/:token - Check invite status
router.get('/check/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { type } = req.query;

    if (!type || (type !== 'agent' && type !== 'customer')) {
      return res.status(400).json({
        error: 'Invalid invite type'
      });
    }

    const table = type === 'agent' ? 'agent_organization_invites' : 'customer_organization_invites';

    // Check invite
    const { data: invite, error } = await supabaseAdmin
      .from(table)
      .select(`
        *,
        organizations (
          id,
          name,
          slug
        )
      `)
      .eq('token', token)
      .single();

    if (error) throw error;

    if (!invite) {
      return res.status(404).json({
        error: 'Invite not found'
      });
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return res.status(400).json({
        error: 'Invite has expired'
      });
    }

    // Check if already accepted
    if (invite.accepted) {
      return res.status(400).json({
        error: 'Invite has already been accepted'
      });
    }

    res.json({
      success: true,
      data: invite
    });

  } catch (error) {
    const message = isPostgrestError(error) ? error.message : 'An error occurred';
    res.status(500).json({ error: message });
  }
});

export default router;
