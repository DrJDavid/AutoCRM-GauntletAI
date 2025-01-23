export interface User {
  id: string;
  email: string;
  created_at: string;
  organization_id: string | null;
  role: 'admin' | 'agent' | 'customer';
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  owner_id: string;
}

export interface Customer {
  id: string;
  email: string;
  organization_id: string;
  created_at: string;
}

export interface Agent {
  id: string;
  email: string;
  organization_id: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  customer_id: string;
  organization_id: string;
  assigned_agent_id: string | null;
  customer?: Customer;
  assigned_agent?: Agent;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  ticket_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  created_at: string;
}

export interface Message {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Comment {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Activity {
  id: string;
  ticket_id: string;
  user_id: string;
  action: string;
  details: Record<string, any>;
  created_at: string;
  user?: User;
}
