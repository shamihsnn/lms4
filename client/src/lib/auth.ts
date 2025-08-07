import type { LoginData, ChangePasswordData } from "@shared/schema";

export interface AuthUser {
  id: number;
  username: string;
}

export interface AuthResponse {
  message: string;
  user?: AuthUser;
}

export interface PasswordVerificationResponse {
  valid: boolean;
}

export const AUTH_STORAGE_KEY = "lab_auth_token";
export const REMEMBER_ME_KEY = "lab_remember_me";

export function getStoredAuthPreference(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(REMEMBER_ME_KEY) === "true";
}

export function setAuthPreference(rememberMe: boolean): void {
  if (typeof window === "undefined") return;
  if (rememberMe) {
    localStorage.setItem(REMEMBER_ME_KEY, "true");
  } else {
    localStorage.removeItem(REMEMBER_ME_KEY);
  }
}

export function clearAuthData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REMEMBER_ME_KEY);
  sessionStorage.clear();
}

export function validateLoginData(data: Partial<LoginData>): string[] {
  const errors: string[] = [];
  
  if (!data.username?.trim()) {
    errors.push("Username is required");
  }
  
  if (!data.password?.trim()) {
    errors.push("Password is required");
  }
  
  return errors;
}

export function validatePasswordData(data: Partial<ChangePasswordData>): string[] {
  const errors: string[] = [];
  
  if (!data.currentPassword?.trim()) {
    errors.push("Current password is required");
  }
  
  if (!data.newPassword?.trim()) {
    errors.push("New password is required");
  } else if (data.newPassword.length < 8) {
    errors.push("New password must be at least 8 characters long");
  }
  
  if (!data.confirmPassword?.trim()) {
    errors.push("Please confirm your new password");
  } else if (data.newPassword !== data.confirmPassword) {
    errors.push("Passwords don't match");
  }
  
  return errors;
}

export function getPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push("Use at least 8 characters");
  }
  
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Include lowercase letters");
  }
  
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Include uppercase letters");
  }
  
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push("Include numbers");
  }
  
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  } else {
    feedback.push("Include special characters");
  }
  
  return { score, feedback };
}
