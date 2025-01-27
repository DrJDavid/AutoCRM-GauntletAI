import { useLocation as useWouterLocation } from 'wouter';

/**
 * Custom hook that wraps wouter's useLocation
 * Provides type-safe navigation and location state
 */
export function useLocation() {
  return useWouterLocation();
}
