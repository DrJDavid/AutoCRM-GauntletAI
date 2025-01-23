-- Add policy for viewing profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can view accessible profiles'
    ) THEN
        CREATE POLICY "Users can view accessible profiles" ON profiles
            FOR SELECT USING (
                -- Users can view their own profile
                auth.uid() = id
                OR
                -- Users can view profiles in their organization
                (
                    SELECT organization_id FROM profiles WHERE id = auth.uid()
                ) = organization_id
                OR
                -- Customers can view profiles related to their tickets
                EXISTS (
                    SELECT 1 FROM tickets t
                    WHERE t.customer_id = auth.uid()
                    AND (
                        t.assigned_agent_id = profiles.id
                        OR
                        EXISTS (
                            SELECT 1 FROM messages m
                            WHERE m.ticket_id = t.id
                            AND m.user_id = profiles.id
                        )
                    )
                )
            );
    END IF;
END $$;
