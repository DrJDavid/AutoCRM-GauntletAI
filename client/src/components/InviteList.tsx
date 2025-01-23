import { useState, useEffect } from 'react';
import { useInviteStore } from '../stores/inviteStore';
import { useAuthStore } from '../stores/authStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { supabase } from '../lib/supabaseClient';

// Types for our invite data
interface Invite {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
  accepted: boolean;
}

interface InviteListProps {
  type: 'agent' | 'customer';
}

export const InviteList = ({ type }: InviteListProps) => {
  const { user } = useAuthStore();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'created_at' | 'expires_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const pageSize = 10;

  // Load invites from Supabase
  const loadInvites = async () => {
    if (!user?.organization_id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const table = type === 'agent' ? 'agent_organization_invites' : 'customer_organization_invites';
      
      let query = supabase
        .from(table)
        .select('*', { count: 'exact' })
        .eq('organization_id', user.organization_id)
        .order(sortField, { ascending: sortOrder === 'asc' })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (statusFilter !== 'all') {
        query = query.eq('accepted', statusFilter === 'accepted');
      }

      const { data, count, error } = await query;

      if (error) throw error;

      setInvites(data || []);
      setHasMore(count ? count > page * pageSize : false);
    } catch (err) {
      console.error('Failed to load invites:', err);
      setError('Failed to load invites. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete an invite
  const deleteInvite = async (id: string) => {
    if (!user?.organization_id) return;
    
    try {
      const table = type === 'agent' ? 'agent_organization_invites' : 'customer_organization_invites';
      
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id)
        .eq('organization_id', user.organization_id); // RLS will enforce this anyway

      if (error) throw error;

      // Refresh the list
      loadInvites();
    } catch (err) {
      console.error('Failed to delete invite:', err);
      setError('Failed to delete invite. Please try again.');
    }
  };

  // Load invites when component mounts or dependencies change
  useEffect(() => {
    loadInvites();
  }, [user?.organization_id, type, sortField, sortOrder, statusFilter, page]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          {type === 'agent' ? 'Team Member' : 'Customer'} Invites
        </h2>
        
        <div className="flex space-x-4">
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortField}
            onValueChange={(value) => setSortField(value as typeof sortField)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Created Date</SelectItem>
              <SelectItem value="expires_at">Expiry Date</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invites.map((invite) => (
            <TableRow key={invite.id}>
              <TableCell>{invite.email}</TableCell>
              <TableCell>{format(new Date(invite.created_at), 'MMM d, yyyy')}</TableCell>
              <TableCell>{format(new Date(invite.expires_at), 'MMM d, yyyy')}</TableCell>
              <TableCell>
                <Badge variant={invite.accepted ? "success" : "default"}>
                  {invite.accepted ? 'Accepted' : 'Pending'}
                </Badge>
              </TableCell>
              <TableCell>
                {!invite.accepted && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteInvite(invite.id)}
                  >
                    Delete
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

      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          disabled={page === 1 || isLoading}
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </Button>
        <span>Page {page}</span>
        <Button
          variant="outline"
          disabled={!hasMore || isLoading}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
