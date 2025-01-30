export interface CreateTicketForm {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'account' | 'billing' | 'technical_issue' | 'other';
}

export interface UpdateTicketForm {
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'open' | 'in_progress' | 'resolved' | 'closed' | 'pending';
  category?: 'account' | 'billing' | 'technical_issue' | 'other';
  assigned_to?: string | null;
}

export interface TicketFormProps {
  onSubmit: (data: CreateTicketForm | UpdateTicketForm) => void;
  initialData?: UpdateTicketForm;
} 