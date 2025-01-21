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
    const { data: adminData, error: adminCheckError } = await supabase
      .from('profiles')
      .select()
      .eq('email', 'admin.test@gmail.com')
      .single();

    if (!adminCheckError) {
      // Admin exists, try to sign in
      const { data: admin, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin.test@gmail.com',
        password: 'test123456'
      });

      if (signInError) throw signInError;
      console.log('✅ Signed in as existing admin');

      // 3. Ensure admin is associated with organization
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: org.id })
        .eq('id', admin.user.id);

      if (profileError) throw profileError;
      console.log('✅ Admin associated with organization');
    } else {
      // Admin doesn't exist, create one
      console.log('Creating new admin account...');
      const { data: admin, error: signUpError } = await supabase.auth.signUp({
        email: 'admin.test@gmail.com',
        password: 'test123456',
        options: {
          data: {
            role: 'admin'
          }
        }
      });

      if (signUpError) throw signUpError;
      throw new Error('Please verify the admin email and run the test again');
    }

    // Add delay before next operation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Create customer invite
    const { data: invite, error: inviteError } = await supabase.rpc(
      'create_customer_invite',
      {
        org_id: org.id,
        customer_email: 'customer.test@gmail.com'
      }
    );

    if (inviteError) throw inviteError;
    console.log('✅ Customer invite created');
    console.log('🔗 Invite link:', `/auth/customer/accept-invite?token=${invite}`);

    // 5. Create test customer account
    const { data: customer, error: customerError } = await supabase.auth.signUp({
      email: 'customer.test@gmail.com',
      password: 'test123456',
      options: {
        data: {
          role: 'customer'
        }
      }
    });

    if (customerError) throw customerError;
    console.log('✅ Test customer account created');

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