import { type FC } from 'react';
import { PublicLayout } from './PublicLayout';
import AdminLayout from './AdminLayout';
import { AgentLayout } from './AgentLayout';
import { PortalLayout } from './PortalLayout';

// Export layout role type based on database schema
export type LayoutRole = 'head_admin' | 'admin' | 'agent' | 'customer';

// Base layout props interface
export interface BaseLayoutProps {
  children: React.ReactNode;
  className?: string;
}

// Export all layouts
export {
  PublicLayout,
  AdminLayout,
  AgentLayout,
  PortalLayout
};

// Export layout-specific interfaces
export interface AdminLayoutProps extends BaseLayoutProps {
  role?: Extract<LayoutRole, 'head_admin' | 'admin'>;
}

export interface AgentLayoutProps extends BaseLayoutProps {
  role?: Extract<LayoutRole, 'agent'>;
}

export interface PortalLayoutProps extends BaseLayoutProps {
  role?: Extract<LayoutRole, 'customer'>;
}

export interface PublicLayoutProps extends BaseLayoutProps {} 