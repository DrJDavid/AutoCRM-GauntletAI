import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { inviteService } from '../client/src/services/inviteService';

// Define base URL for tests
const BASE_URL = 'http://localhost:3000';

// Mock server setup
const handlers = [
  // Mock agent invite endpoint
  http.post(`${BASE_URL}/api/invites/agent`, async ({ request }) => {
    const body = await request.json();
    const { email, organizationId } = body;
    
    if (!email || !organizationId) {
      return HttpResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        id: 'mock-invite-id',
        email,
        organization_id: organizationId,
        token: 'mock-token',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  }),

  // Mock customer invite endpoint
  http.post(`${BASE_URL}/api/invites/customer`, async ({ request }) => {
    const body = await request.json();
    const { email, organizationId } = body;
    
    if (!email || !organizationId) {
      return HttpResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        id: 'mock-invite-id',
        email,
        organization_id: organizationId,
        token: 'mock-token',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  }),

  // Mock check invite endpoint
  http.get(`${BASE_URL}/api/invites/check/:token`, ({ params, request }) => {
    const { token } = params;
    const type = new URL(request.url).searchParams.get('type');

    if (!token || !type) {
      return HttpResponse.json(
        { success: false, error: 'Missing token or type' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        id: 'mock-invite-id',
        token,
        type,
        email: 'test@example.com',
        organization: {
          id: 'mock-org-id',
          name: 'Test Org',
          slug: 'test-org',
        },
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  }),

  // Mock accept invite endpoint
  http.post(`${BASE_URL}/api/invites/accept`, async ({ request }) => {
    const body = await request.json();
    const { token, type, password } = body;

    if (!token || !type || !password) {
      return HttpResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return HttpResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        email: 'test@example.com',
        organization: {
          id: 'mock-org-id',
          name: 'Test Org',
          slug: 'test-org',
        },
      },
    });
  }),
];

const server = setupServer(...handlers);

// Start mock server before tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());

describe('Invite Service', () => {
  describe('createAgentInvite', () => {
    it('should create an agent invite successfully', async () => {
      const response = await inviteService.createAgentInvite({
        email: 'agent@example.com',
        organizationId: 'mock-org-id',
      });

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.email).toBe('agent@example.com');
    });

    it('should handle missing fields', async () => {
      const response = await inviteService.createAgentInvite({
        email: '',
        organizationId: 'mock-org-id',
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe('createCustomerInvite', () => {
    it('should create a customer invite successfully', async () => {
      const response = await inviteService.createCustomerInvite({
        email: 'customer@example.com',
        organizationId: 'mock-org-id',
      });

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.email).toBe('customer@example.com');
    });

    it('should handle missing fields', async () => {
      const response = await inviteService.createCustomerInvite({
        email: '',
        organizationId: 'mock-org-id',
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe('checkInvite', () => {
    it('should check invite status successfully', async () => {
      const response = await inviteService.checkInvite('mock-token', 'agent');

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.token).toBe('mock-token');
    });

    it('should handle invalid token', async () => {
      server.use(
        http.get(`${BASE_URL}/api/invites/check/:token`, () => {
          return HttpResponse.json(
            { success: false, error: 'Invite not found' },
            { status: 404 }
          );
        })
      );

      const response = await inviteService.checkInvite('invalid-token', 'agent');

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe('acceptInvite', () => {
    it('should accept invite successfully', async () => {
      const response = await inviteService.acceptInvite({
        token: 'mock-token',
        type: 'agent',
        password: 'password123',
      });

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.email).toBe('test@example.com');
    });

    it('should handle invalid password', async () => {
      const response = await inviteService.acceptInvite({
        token: 'mock-token',
        type: 'agent',
        password: '123',
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });
});
