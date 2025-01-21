import { supabase } from './test-supabase';

async function testCustomerInviteFlow() {
  console.log('🧪 Starting Customer Invite Flow Test');

  try {
    // 1. Get or create test organization
    let org;
    const { data: existingOrg, error: fetchError } = await supabase
      .from('organizations')
      .select()
      .eq('slug', 'test-org')
      .single();

    if (fetchError) {
      const { data: newOrg, error: createError } = await supabase
        .from('organizations')
        .insert([
          {
            name: 'Test Organization',
            slug: 'test-org'
          }
        ])
        .select()
        .single();

      if (createError) throw createError;
      org = newOrg;
      console.log('✅ Test organization created:', org.name);
    } else {
      org = existingOrg;
      console.log('✅ Using existing organization:', org.name);
    }

    // 2. Check if admin exists and sign in
    console.log('Checking for existing admin account...');
    const { data: adminData, error: adminCheckError } = await supabase
      .from('profiles')
      .select()
      .eq('email', 'admin.test@example.com')
      .single();

    let admin;
    if (!adminCheckError && adminData) {
      console.log('Found existing admin account, attempting to sign in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin.test@example.com',
        password: 'test123456'
      });

      if (signInError) {
        console.error('Failed to sign in:', signInError);
        throw signInError;
      }
      admin = signInData;
      console.log('✅ Signed in as existing admin');
    } else {
      console.log('No existing admin found, creating new account...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'admin.test@example.com',
        password: 'test123456',
        options: {
          data: {
            role: 'admin'
          }
        }
      });

      if (signUpError) {
        if (signUpError.status === 429) {
          console.log('Hit rate limit. Please wait a few minutes and try again.');
        }
        throw signUpError;
      }
      admin = signUpData;
      console.log('✅ Created new admin account - please check your email for verification');
      process.exit(0);
    }

    // 3. Ensure admin is associated with organization and has correct role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        organization_id: org.id,
        role: 'admin'
      })
      .eq('id', admin.user.id);

    if (profileError) throw profileError;
    console.log('✅ Admin role and organization set');

    // Add delay before next operation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Create customer invite
    const customerEmail = 'customer.test@example.com';
    const { data: invite, error: inviteError } = await supabase.rpc(
      'create_customer_invite',
      {
        org_id: org.id,
        customer_email: customerEmail
      }
    );

    if (inviteError) throw inviteError;
    console.log('✅ Customer invite created');
    console.log('🔗 Invite link:', `/auth/customer/accept-invite?token=${invite}`);

    // 5. Sign in as customer
    console.log('Signing in as customer...');
    const { data: customer, error: signInError } = await supabase.auth.signInWithPassword({
      email: customerEmail,
      password: 'test123456'
    });

    if (signInError) throw signInError;
    console.log('✅ Signed in as customer');

    // 6. Accept invite
    const { error: acceptError } = await supabase.rpc(
      'accept_customer_invite',
      { invite_token: invite }
    );

    if (acceptError) throw acceptError;
    console.log('✅ Customer invite accepted');

    // 7. Create test ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert([
        {
          title: 'Test Ticket',
          description: 'This is a test ticket',
          customer_id: customer.user!.id,
          organization_id: org.id,
          status: 'open',
          priority: 'medium'
        }
      ])
      .select()
      .single();

    if (ticketError) throw ticketError;
    console.log('✅ Test ticket created:', ticket.title);

    console.log('\n✨ Test completed successfully!');
    console.log('\nTest Credentials:');
    console.log('Admin Email: admin@autocrm-test.com');
    console.log('Admin Password: test123456');
    console.log('Customer Email: customer@autocrm-test.com');
    console.log('Customer Password: test123456');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCustomerInviteFlow(); 