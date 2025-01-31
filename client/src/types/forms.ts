import type { TicketPriority, UserRole } from './database';

export interface CreateOrgFormData {
  name: string;
  slug: string;
  adminEmail: string;
  adminPassword: string;
}

export interface InviteFormData {
  email: string;
  role: UserRole;
  message?: string;
}

export interface TicketFormData {
  title: string;
  description?: string;
  priority?: TicketPriority;
  attachments?: File[];
}

export interface MessageFormData {
  message: string;
  isInternal?: boolean;
  attachments?: File[];
}

export interface ProfileFormData {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  title?: string;
  department?: string;
  avatarUrl?: string;
}

export interface OrganizationSettingsFormData {
  name: string;
  settings: {
    supportEmail: string;
    billingEmail?: string;
    timezone: string;
    businessHours: {
      start: string;
      end: string;
      timezone: string;
    };
    ticketSettings: {
      autoAssignment: boolean;
      defaultPriority: TicketPriority;
      allowCustomerPriority: boolean;
    };
  };
}

export interface CreateTicketForm {
  title: string;
  description?: string;
  priority: TicketPriority;
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