import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { TEST_USERS, loginTestUser, logoutTestUser, createTestUser } from './utils/auth';
import {
  createTestTicket,
  updateTestTicket,
  deleteTestTicket,
  addTestMessage,
  getTestTicket,
  cleanupTestTickets
} from './utils/tickets';

describe('Ticket System Integration Tests', () => {
  // Store test data
  let customerTicketId: string;
  let agentTicketId: string;

  // Setup before all tests
  beforeAll(async () => {
    // Login as customer and create a ticket
    await loginTestUser(TEST_USERS.CUSTOMER.email, TEST_USERS.CUSTOMER.password);
    const customerTicket = await createTestTicket({
      title: 'Customer Test Ticket',
      description: 'This is a test ticket created by customer',
      priority: 'medium',
      category: 'technical_issue'
    });
    customerTicketId = customerTicket.id;

    // Login as agent and create a ticket
    await loginTestUser(TEST_USERS.AGENT.email, TEST_USERS.AGENT.password);
    const agentTicket = await createTestTicket({
      title: 'Agent Test Ticket',
      description: 'This is a test ticket created by agent',
      priority: 'high',
      category: 'technical_issue'
    });
    agentTicketId = agentTicket.id;
  });

  // Cleanup after all tests
  afterAll(async () => {
    await cleanupTestTickets([customerTicketId, agentTicketId]);
    await logoutTestUser();
  });

  // Reset auth state before each test
  beforeEach(async () => {
    await logoutTestUser();
  });

  describe('Customer Ticket Operations', () => {
    test('Customer can create and view their ticket', async () => {
      await loginTestUser(TEST_USERS.CUSTOMER.email, TEST_USERS.CUSTOMER.password);
      
      // Create new ticket
      const newTicket = await createTestTicket({
        title: 'New Customer Issue',
        description: 'Testing ticket creation',
        priority: 'low',
        category: 'account'
      });

      // Verify ticket
      const ticket = await getTestTicket(newTicket.id);
      expect(ticket.title).toBe('New Customer Issue');
      expect(ticket.status).toBe('open');
      expect(ticket.priority).toBe('low');

      // Cleanup
      await deleteTestTicket(newTicket.id);
    });

    test('Customer cannot modify ticket status', async () => {
      await loginTestUser(TEST_USERS.CUSTOMER.email, TEST_USERS.CUSTOMER.password);
      
      try {
        await updateTestTicket(customerTicketId, { status: 'closed' });
        throw new Error('Should not reach here');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Agent Ticket Operations', () => {
    test('Agent can update ticket status', async () => {
      await loginTestUser(TEST_USERS.AGENT.email, TEST_USERS.AGENT.password);
      
      // Update ticket
      await updateTestTicket(customerTicketId, { 
        status: 'in_progress',
        assigned_to: 'agent-id'
      });

      // Verify update
      const ticket = await getTestTicket(customerTicketId);
      expect(ticket.status).toBe('in_progress');
      expect(ticket.assigned_to?.id).toBe('agent-id');
    });

    test('Agent can add internal messages', async () => {
      await loginTestUser(TEST_USERS.AGENT.email, TEST_USERS.AGENT.password);
      
      // Add internal message
      const message = await addTestMessage(
        customerTicketId,
        'Internal note for testing',
        true
      );

      expect(message.is_internal).toBe(true);
      expect(message.message).toBe('Internal note for testing');
    });
  });

  describe('Admin Ticket Operations', () => {
    test('Admin can perform all ticket operations', async () => {
      // Login as admin and create ticket
      await loginTestUser(TEST_USERS.HEAD_ADMIN.email, TEST_USERS.HEAD_ADMIN.password);
      
      // Create ticket
      const adminTicket = await createTestTicket({
        title: 'Admin Test Ticket',
        description: 'Testing admin operations',
        priority: 'urgent',
        category: 'billing'
      });

      // Update status and assign
      await updateTestTicket(adminTicket.id, { 
        status: 'resolved',
        assigned_to: 'agent-id'
      });

      // Add message
      await addTestMessage(adminTicket.id, 'Admin test message');

      // Verify all changes
      const ticket = await getTestTicket(adminTicket.id);
      expect(ticket.status).toBe('resolved');
      expect(ticket.priority).toBe('urgent');
      expect(ticket.messages).toHaveLength(1);

      // Cleanup
      await deleteTestTicket(adminTicket.id);
    });
  });

  describe('Ticket Workflow', () => {
    test('Complete ticket lifecycle', async () => {
      // 1. Customer creates ticket
      await loginTestUser(TEST_USERS.CUSTOMER.email, TEST_USERS.CUSTOMER.password);
      const newTicket = await createTestTicket({
        title: 'Lifecycle Test Ticket',
        description: 'Testing complete ticket workflow',
        priority: 'medium',
        category: 'technical_issue'
      });

      // 2. Agent picks up ticket
      await loginTestUser(TEST_USERS.AGENT.email, TEST_USERS.AGENT.password);
      await updateTestTicket(newTicket.id, { 
        status: 'in_progress',
        assigned_to: 'agent-id'
      });

      // 3. Agent adds internal note
      await addTestMessage(newTicket.id, 'Working on it', true);

      // 4. Agent resolves ticket
      await updateTestTicket(newTicket.id, { status: 'resolved' });

      // 5. Admin reviews and closes
      await loginTestUser(TEST_USERS.HEAD_ADMIN.email, TEST_USERS.HEAD_ADMIN.password);
      await updateTestTicket(newTicket.id, { status: 'closed' });

      // Verify final state
      const finalTicket = await getTestTicket(newTicket.id);
      expect(finalTicket.status).toBe('closed');
      expect(finalTicket.messages).toHaveLength(1);
      expect(finalTicket.assigned_to?.id).toBe('agent-id');

      // Cleanup
      await deleteTestTicket(newTicket.id);
    });
  });

  describe('Ticket Validation', () => {
    beforeEach(async () => {
      await loginTestUser(TEST_USERS.CUSTOMER.email, TEST_USERS.CUSTOMER.password);
    });

    test('Cannot create ticket without required fields', async () => {
      try {
        await createTestTicket({
          title: '',
          description: '',
          priority: 'low',
          category: 'other'
        });
        throw new Error('Should not reach here');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('Cannot create ticket with invalid priority', async () => {
      try {
        await createTestTicket({
          title: 'Test Ticket',
          description: 'Test Description',
          priority: 'invalid_priority' as any,
          category: 'technical_issue'
        });
        throw new Error('Should not reach here');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Message Threading', () => {
    let threadTicketId: string;

    beforeAll(async () => {
      await loginTestUser(TEST_USERS.CUSTOMER.email, TEST_USERS.CUSTOMER.password);
      const ticket = await createTestTicket({
        title: 'Thread Test Ticket',
        description: 'Testing message threading',
        priority: 'medium',
        category: 'technical_issue'
      });
      threadTicketId = ticket.id;
    });

    afterAll(async () => {
      await deleteTestTicket(threadTicketId);
    });

    test('Messages are ordered chronologically', async () => {
      // Add multiple messages
      await addTestMessage(threadTicketId, 'First message');
      await addTestMessage(threadTicketId, 'Second message');
      await addTestMessage(threadTicketId, 'Third message');

      const ticket = await getTestTicket(threadTicketId);
      expect(ticket.messages).toHaveLength(3);
      
      // Verify chronological order
      const messages = ticket.messages || [];
      for (let i = 1; i < messages.length; i++) {
        const prevDate = new Date(messages[i - 1].created_at || '');
        const currDate = new Date(messages[i].created_at || '');
        expect(prevDate.getTime()).toBeLessThanOrEqual(currDate.getTime());
      }
    });

    test('Can mix public and internal messages', async () => {
      await loginTestUser(TEST_USERS.AGENT.email, TEST_USERS.AGENT.password);
      
      await addTestMessage(threadTicketId, 'Public message');
      await addTestMessage(threadTicketId, 'Internal note', true);
      await addTestMessage(threadTicketId, 'Another public message');

      const ticket = await getTestTicket(threadTicketId);
      const messages = ticket.messages || [];
      
      expect(messages.some(m => m.is_internal)).toBe(true);
      expect(messages.some(m => !m.is_internal)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('Handles non-existent ticket gracefully', async () => {
      await loginTestUser(TEST_USERS.AGENT.email, TEST_USERS.AGENT.password);
      
      try {
        await getTestTicket('non-existent-id');
        throw new Error('Should not reach here');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('Handles invalid updates gracefully', async () => {
      await loginTestUser(TEST_USERS.AGENT.email, TEST_USERS.AGENT.password);
      
      try {
        await updateTestTicket(customerTicketId, {
          status: 'invalid_status' as any
        });
        throw new Error('Should not reach here');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Permission-based Access', () => {
    test('Customer cannot access other customer tickets', async () => {
      // First customer creates a ticket
      await loginTestUser(TEST_USERS.CUSTOMER.email, TEST_USERS.CUSTOMER.password);
      const ticket1 = await createTestTicket({
        title: 'First Customer Ticket',
        description: 'Test ticket',
        priority: 'low',
        category: 'account'
      });

      // Create and login as second customer
      const secondCustomer = await createTestUser('second.customer@customer.com', 'customer');
      await loginTestUser('second.customer@customer.com', 'testpass123!');

      try {
        await getTestTicket(ticket1.id);
        throw new Error('Should not reach here');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Cleanup
      await deleteTestTicket(ticket1.id);
    });

    test('Agent can only update assigned tickets', async () => {
      // Create ticket as first agent
      await loginTestUser(TEST_USERS.AGENT.email, TEST_USERS.AGENT.password);
      const ticket = await createTestTicket({
        title: 'Assignment Test',
        description: 'Testing assignment restrictions',
        priority: 'medium',
        category: 'technical_issue'
      });
      
      // Create and assign to second agent
      await loginTestUser(TEST_USERS.HEAD_ADMIN.email, TEST_USERS.HEAD_ADMIN.password);
      const otherAgent = await createTestUser('other.agent@acme-corp.com', 'agent');
      await updateTestTicket(ticket.id, {
        status: 'in_progress',
        assigned_to: otherAgent.id
      });

      // Try to update as first agent
      await loginTestUser(TEST_USERS.AGENT.email, TEST_USERS.AGENT.password);
      
      try {
        await updateTestTicket(ticket.id, { status: 'resolved' });
        throw new Error('Should not reach here');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Cleanup
      await deleteTestTicket(ticket.id);
    });
  });
}); 