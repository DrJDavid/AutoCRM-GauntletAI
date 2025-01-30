import { useLocation as useRouterLocation } from 'react-router-dom';

/**
 * Custom hook that wraps react-router's useLocation
 * Provides type-safe navigation and location state
 */
export function useLocation() {
  return useRouterLocation();
}
