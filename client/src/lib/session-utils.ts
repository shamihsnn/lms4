import { queryClient } from "./queryClient";

export interface SessionValidationResult {
  isValid: boolean;
  needsRefresh: boolean;
  error?: string;
}

/**
 * Validates the current session and attempts to refresh if needed
 */
export async function validateAndRefreshSession(): Promise<SessionValidationResult> {
  try {
    console.log('Validating session...');
    
    // First, check session info
    const sessionResponse = await fetch('/api/auth/session-info', {
      credentials: 'include'
    });
    
    if (!sessionResponse.ok) {
      return { isValid: false, needsRefresh: false, error: 'Session info unavailable' };
    }
    
    const sessionInfo = await sessionResponse.json();
    console.log('Session info:', sessionInfo);
    
    if (!sessionInfo.hasSession || !sessionInfo.adminId) {
      return { isValid: false, needsRefresh: false, error: 'No active session' };
    }
    
    // Try to access a protected endpoint to verify session is working
    const meResponse = await fetch('/api/auth/me', {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (meResponse.ok) {
      console.log('Session is valid');
      return { isValid: true, needsRefresh: false };
    }
    
    if (meResponse.status === 401) {
      console.log('Session expired, attempting refresh...');
      
      // Try to refresh the session
      const refreshResponse = await fetch('/api/auth/refresh-session', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (refreshResponse.ok) {
        console.log('Session refreshed successfully');
        // Clear and refetch user data
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        return { isValid: true, needsRefresh: true };
      } else {
        console.log('Session refresh failed');
        return { isValid: false, needsRefresh: false, error: 'Session refresh failed' };
      }
    }
    
    return { isValid: false, needsRefresh: false, error: `Unexpected response: ${meResponse.status}` };
    
  } catch (error) {
    console.error('Session validation error:', error);
    return { isValid: false, needsRefresh: false, error: 'Session validation failed' };
  }
}

/**
 * Enhanced API request that validates session before making the request
 */
export async function secureApiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  console.log(`Making secure ${method} request to ${url}`);
  
  // For critical operations like password change, ensure user is authenticated
  if (url.includes('/api/auth/change-password')) {
    console.log('Password change request - checking authentication status');
    
    // First check if user is currently authenticated
    const meResponse = await fetch('/api/auth/me', {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (meResponse.status === 401) {
      throw new Error('You must be logged in to change your password. Please log in first.');
    }
    
    if (!meResponse.ok) {
      throw new Error(`Authentication check failed: ${meResponse.status}`);
    }
    
    console.log('User is authenticated, proceeding with password change');
  } else {
    // For other requests, validate session first
    const sessionCheck = await validateAndRefreshSession();
    
    if (!sessionCheck.isValid) {
      throw new Error(`Authentication failed: ${sessionCheck.error}`);
    }
    
    if (sessionCheck.needsRefresh) {
      console.log('Session was refreshed, proceeding with request');
    }
  }
  
  // Make the actual request
  const headers: Record<string, string> = {
    "Cache-Control": "no-cache",
    "Pragma": "no-cache"
  };
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  
  console.log(`Secure request response status: ${response.status}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${response.status}: ${errorText}`);
  }
  
  return response;
}
