import { supabase } from '../client/src/lib/supabaseClient';

async function checkDatabase() {
  console.log('Checking database...');

  // Check organizations
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('*')
    .eq('is_system', true);

  console.log('System Organizations:', { orgs, orgsError });

  if (orgs?.length) {
    // Check AI agents
    const { data: agents, error: agentsError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('organization_id', orgs[0].id);

    console.log('AI Agents:', { agents, agentsError });
  }
}

checkDatabase(); 