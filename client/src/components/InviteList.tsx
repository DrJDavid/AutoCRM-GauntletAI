import { useState, useEffect } from 'react';
import { useInviteStore } from '@/stores/inviteStore';
import { useUserStore } from '@/stores/userStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/types/supabase';

type Invite = Database['public']['Tables']['invitations']['Row'];
type InvitationStatus = Database['public']['Enums']['invitation_status'];

interface InviteListProps {
  type: 'team' | 'customer';
}

export const InviteList = ({ type }: InviteListProps) => {
  const { currentUser } = useUserStore();
  const { toast } = useToast();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'created_at' | 'expires_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<InvitationStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 10;

  // Load invites from Supabase
  const loadInvites = async () => {
    if (!currentUser?.organization_id) {
      toast({
        title: 'Error',
        description: 'No organization found',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('invitations')
        .select('*', { count: 'exact' })
        .eq('organization_id', currentUser.organization_id)
        .eq('type', type)
        .order(sortField, { ascending: sortOrder === 'asc' })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, count, error } = await query;

      if (error) throw error;

      setInvites(data || []);
      setHasMore(count ? count > page * pageSize : false);
    } catch (err) {
      console.error('Failed to load invites:', err);
      setError('Failed to load invites. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load invites. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete an invite
  const deleteInvite = async (id: string) => {
    if (!currentUser?.organization_id) {
      toast({
        title: 'Error',
        description: 'No organization found',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', id)
        .eq('organization_id', currentUser.organization_id)
        .eq('status', 'pending');

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Invite cancelled successfully',
      });

      // Refresh the list
      loadInvites();
    } catch (err) {
      console.error('Failed to cancel invite:', err);
      toast({
        title: 'Error',
        description: 'Failed to cancel invite. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Load invites when component mounts or dependencies change
  useEffect(() => {
    loadInvites();
  }, [currentUser?.organization_id, type, sortField, sortOrder, statusFilter, page]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortField} onValueChange={(value: any) => setSortField(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Created Date</SelectItem>
            <SelectItem value="expires_at">Expiry Date</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
        >
          {sortOrder === 'asc' ? '↑' : '↓'}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invites.map((invite) => (
              <TableRow key={invite.id}>
                <TableCell>{invite.email}</TableCell>
                <TableCell>
                  <Badge variant={
                    invite.status === 'accepted' ? "default" :
                    invite.status === 'expired' ? "destructive" :
                    "secondary"
                  }>
                    {invite.status}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(invite.created_at || ''), 'PP')}</TableCell>
                <TableCell>{format(new Date(invite.expires_at || ''), 'PP')}</TableCell>
                <TableCell className="text-right">
                  {invite.status === 'pending' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteInvite(invite.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {invites.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No invites found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Previous
        </Button>
        <span>Page {page}</span>
        <Button
          variant="outline"
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasMore}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
