import { useEffect } from 'react';
import { useTicketStore } from '../stores/ticketStore';
import type { CreateTicketForm, UpdateTicketForm } from '../types';

export const useTicket = (ticketId: string) => {
  const {
    selectedTicket,
    messages,
    isLoading,
    error,
    fetchTicket,
    fetchTicketMessages,
    createTicket,
    updateTicket,
    addMessage
  } = useTicketStore();

  // Fetch ticket and messages when ID changes
  useEffect(() => {
    fetchTicket(ticketId);
    fetchTicketMessages(ticketId);
  }, [ticketId, fetchTicket, fetchTicketMessages]);

  // Create a new ticket
  const handleCreate = async (data: CreateTicketForm) => {
    await createTicket(data);
  };

  // Update ticket details
  const handleUpdate = async (data: UpdateTicketForm) => {
    if (!ticketId) return;
    await updateTicket(ticketId, data);
  };

  // Add a new message
  const handleAddMessage = async (content: string, isInternal = false) => {
    if (!ticketId) return;
    await addMessage(ticketId, content, isInternal);
  };

  return {
    ticket: selectedTicket,
    messages,
    isLoading,
    error,
    handleCreate,
    handleUpdate,
    handleAddMessage
  };
}; 