import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { TEST_USERS } from './utils/auth';
import { useUserStore } from '@/stores/userStore';

describe('Authentication', () => {
  // Reset store state before each test
  beforeEach(() => {
    useUserStore.setState({
      currentUser: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  });

  // Clean up after each test
  afterEach(async () => {
    await useUserStore.getState().logout();
  });

  describe('Team Login', () => {
    test('should successfully login as head admin via team login', async () => {
      const { login } = useUserStore.getState();
      
      await login({
        email: TEST_USERS.HEAD_ADMIN.email,
        password: TEST_USERS.HEAD_ADMIN.password,
        type: 'team',
        organizationSlug: 'acme-corp'
      });

      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.currentUser?.role).toBe('head_admin');
      expect(state.error).toBeNull();
    });

    test('should successfully login as admin via team login', async () => {
      const { login } = useUserStore.getState();
      
      await login({
        email: TEST_USERS.ADMIN.email,
        password: TEST_USERS.ADMIN.password,
        type: 'team',
        organizationSlug: 'acme-corp'
      });

      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.currentUser?.role).toBe('admin');
      expect(state.error).toBeNull();
    });

    test('should successfully login as agent via team login', async () => {
      const { login } = useUserStore.getState();
      
      await login({
        email: TEST_USERS.AGENT.email,
        password: TEST_USERS.AGENT.password,
        type: 'team',
        organizationSlug: 'acme-corp'
      });

      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.currentUser?.role).toBe('agent');
      expect(state.error).toBeNull();
    });

    test('should reject team login without organization slug', async () => {
      const { login } = useUserStore.getState();
      
      await expect(login({
        email: TEST_USERS.ADMIN.email,
        password: TEST_USERS.ADMIN.password,
        type: 'team'
      })).rejects.toThrow('Organization ID is required for team login');
    });

    test('should reject team login with invalid organization slug', async () => {
      const { login } = useUserStore.getState();
      
      await expect(login({
        email: TEST_USERS.ADMIN.email,
        password: TEST_USERS.ADMIN.password,
        type: 'team',
        organizationSlug: 'nonexistent-org'
      })).rejects.toThrow('Organization not found');
    });
  });

  describe('Customer Login', () => {
    test('should successfully login as customer', async () => {
      const { login } = useUserStore.getState();
      
      await login({
        email: TEST_USERS.CUSTOMER.email,
        password: TEST_USERS.CUSTOMER.password,
        type: 'customer'
      });

      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.currentUser?.role).toBe('customer');
      expect(state.error).toBeNull();
    });

    test('should reject customer using team login', async () => {
      const { login } = useUserStore.getState();
      
      await expect(login({
        email: TEST_USERS.CUSTOMER.email,
        password: TEST_USERS.CUSTOMER.password,
        type: 'team',
        organizationSlug: 'acme-corp'
      })).rejects.toThrow('This login is for team members only');
    });
  });

  describe('Invalid Login Attempts', () => {
    test('should handle invalid password', async () => {
      const { login } = useUserStore.getState();
      
      await expect(login({
        email: TEST_USERS.ADMIN.email,
        password: 'wrongpassword',
        type: 'team',
        organizationSlug: 'acme-corp'
      })).rejects.toThrow();

      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.currentUser).toBeNull();
      expect(state.error).not.toBeNull();
    });

    test('should handle non-existent user', async () => {
      const { login } = useUserStore.getState();
      
      await expect(login({
        email: 'nonexistent@example.com',
        password: 'testpass123!',
        type: 'team',
        organizationSlug: 'acme-corp'
      })).rejects.toThrow();

      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.currentUser).toBeNull();
      expect(state.error).not.toBeNull();
    });
  });

  describe('Logout', () => {
    test('should successfully logout', async () => {
      const { login, logout } = useUserStore.getState();
      
      // First login
      await login({
        email: TEST_USERS.ADMIN.email,
        password: TEST_USERS.ADMIN.password,
        type: 'team',
        organizationSlug: 'acme-corp'
      });

      // Then logout
      await logout();

      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.currentUser).toBeNull();
      expect(state.error).toBeNull();
    });
  });
}); 