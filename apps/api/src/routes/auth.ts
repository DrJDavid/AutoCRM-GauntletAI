import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';

const router = Router();

// Type guard for PostgrestError
function isPostgrestError(error: unknown): error is PostgrestError {
  return typeof error === 'object' && error !== null && 'message' in error;
}

// Invite agent to organization
router.post('/invite/agent', async (req, res) => {
  try {
    const { email, organizationId } = req.body;
    
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        organization_id: organizationId,
        role: 'agent'
      }
    });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    const message = isPostgrestError(error) ? error.message : 'An error occurred';
    res.status(500).json({ error: message });
  }
});

// Get team members
router.get('/team/:organizationId', async (req, res) => {
  try {
    const { organizationId } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select(`
        *,
        organizations (
          id,
          name,
          slug
        )
      `)
      .eq('organization_id', organizationId);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    const message = isPostgrestError(error) ? error.message : 'An error occurred';
    res.status(500).json({ error: message });
  }
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, role, organizationId } = req.body;

    // Create user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) throw authError;

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          email,
          role,
          organization_id: organizationId,
        },
      ]);

    if (profileError) throw profileError;

    res.json({ success: true, user: authData.user });
  } catch (error) {
    const message = isPostgrestError(error) ? error.message : 'An error occurred';
    res.status(500).json({ error: message });
  }
});

// Verify invite
router.get('/verify-invite/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { type } = req.query;

    const table = type === 'agent' ? 'agent_organization_invites' : 'customer_organization_invites';
    
    const { data, error } = await supabaseAdmin
      .from(table)
      .select('*, organizations(*)')
      .eq('token', token)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    const message = isPostgrestError(error) ? error.message : 'An error occurred';
    res.status(500).json({ error: message });
  }
});

export default router; 