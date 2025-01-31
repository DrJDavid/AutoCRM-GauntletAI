import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { Command } from 'commander'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY is required')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const program = new Command()

program
  .name('manage-local-users')
  .description('CLI to manage local Supabase users')

program.command('list')
  .description('List all users')
  .action(async () => {
    try {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
      if (error) throw error

      console.log('\nUsers:')
      users.forEach(user => {
        console.log(`- ${user.email} (${user.id})`)
      })
      console.log('\n')
    } catch (error) {
      console.error('Error listing users:', error)
    }
  })

program.command('delete')
  .description('Delete a user by email')
  .argument('<email>', 'email of the user to delete')
  .action(async (email) => {
    try {
      // First find the user
      const { data: { users }, error: findError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1,
        page: 1,
        filter: {
          email: email
        }
      })

      if (findError) throw findError
      if (!users || users.length === 0) {
        console.error(`No user found with email: ${email}`)
        return
      }

      const user = users[0]

      // Get user's profile
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()

      // Delete organization if user is the only admin
      if (profile?.organization_id && profile.role === 'head_admin') {
        const { data: otherAdmins } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('organization_id', profile.organization_id)
          .eq('role', 'head_admin')
          .neq('id', user.id)

        if (!otherAdmins || otherAdmins.length === 0) {
          await supabaseAdmin
            .from('organizations')
            .delete()
            .eq('id', profile.organization_id)
          console.log(`Deleted organization: ${profile.organization_id}`)
        }
      }

      // Delete profile
      await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', user.id)
      console.log('Deleted user profile')

      // Delete auth user
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      if (deleteError) throw deleteError

      console.log(`Successfully deleted user: ${email}`)
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  })

program.parse() 