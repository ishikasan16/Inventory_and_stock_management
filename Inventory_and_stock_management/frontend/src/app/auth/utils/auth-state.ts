import { signal } from '@angular/core';
import { AppRole, parseRole } from './role-model';

export { AppRole } from './role-model';

// =====================================================
// USER
// =====================================================

export interface AuthUser {
  access_token: string;
  username: string;
  role: AppRole;
  user_id?: string;
}

// =====================================================
// STORAGE
// =====================================================

export const STORAGE_KEY = 'stockflow_user_data';


// =====================================================
// CURRENT USER
// =====================================================

// When the app starts, try to get the user from localStorage.
const storedUser = localStorage.getItem(STORAGE_KEY);

let initialUser: AuthUser | null = null;

if (storedUser) {
  try {
    const user = JSON.parse(storedUser) as AuthUser;

    if (
      user.access_token &&
      !isTokenExpired(user.access_token)
    ) {
      const role = roleFromToken(user.access_token);

      if (role) {
        initialUser = {
          ...user,
          role
        };
      }
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Angular signal containing the current logged-in user
const session = signal<AuthUser | null>(initialUser);

// Other files can READ the user
export const currentUser = session.asReadonly();


// =====================================================
// LOGIN
// =====================================================

export function startSession(
  accessToken: string,
  responseRole: string | null | undefined,
  username: string,
  userId?: string
): boolean {

  // Token must exist and must not be expired
  if (
    !accessToken ||
    isTokenExpired(accessToken)
  ) {
    return false;
  }

  // Get role directly from JWT
  const role = roleFromToken(accessToken);

  if (!role) {
    return false;
  }

  // Check whether backend response role matches JWT role
  if (parseRole(responseRole) !== role) {
    console.warn(
      '[auth] Response role does not match JWT role. Using JWT role.',
      {
        responseRole,
        tokenRole: role
      }
    );
  }

  const user: AuthUser = {
    access_token: accessToken,
    username: username || '',
    role
  };

  if (userId) {
    user.user_id = userId;
  }

  // Save user
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(user)
  );

  // Update current user
  session.set(user);

  return true;
}


// =====================================================
// UPDATE ACCESS TOKEN
// =====================================================

export function updateAccessToken(
  accessToken: string
): boolean {

  const user = session();

  if (
    !user ||
    !accessToken ||
    isTokenExpired(accessToken)
  ) {
    return false;
  }

  // Get role from new token
  const role = roleFromToken(accessToken);

  // The new token must have the same role
  if (!role || role !== user.role) {
    return false;
  }

  const updated: AuthUser = {
    ...user,
    access_token: accessToken
  };

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updated)
  );

  session.set(updated);

  return true;
}


// =====================================================
// GET ACCESS TOKEN
// =====================================================

export function getAccessToken(): string | null {
  return session()?.access_token ?? null;
}


// =====================================================
// CHECK STORED SESSION
// =====================================================

export function hasStoredSession(): boolean {
  return session() !== null;
}


// =====================================================
// RESTORE SESSION
// =====================================================

export function restoreSession(
  accessToken: string
): boolean {

  if (
    !accessToken ||
    isTokenExpired(accessToken)
  ) {
    return false;
  }

  const role = roleFromToken(accessToken);

  if (!role) {
    return false;
  }

  const storedUser = localStorage.getItem(STORAGE_KEY);

  if (!storedUser) {
    return false;
  }

  try {
    const user = JSON.parse(storedUser) as AuthUser;

    // Make sure the role from the new token
    // matches the existing user's role.
    if (user.role !== role) {
      return false;
    }

    const restoredUser: AuthUser = {
      ...user,
      access_token: accessToken,
      role
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(restoredUser)
    );

    session.set(restoredUser);

    return true;

  } catch {
    return false;
  }
}


// =====================================================
// LOGOUT
// =====================================================

export function clearSession(): void {

  localStorage.removeItem(STORAGE_KEY);

  session.set(null);
}


// =====================================================
// JWT: DECODE PAYLOAD
// =====================================================

export function decodeJwtPayload(
  token: string
): Record<string, unknown> | null {

  if (!token) {
    return null;
  }

  const segments = token.split('.');

  // JWT = header.payload.signature
  if (segments.length !== 3) {
    return null;
  }

  try {
    const encoded = segments[1];

    if (!encoded) {
      return null;
    }

    // Convert Base64URL to Base64
    const base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Add padding
    const padded = base64 +
      '='.repeat(
        (4 - (base64.length % 4)) % 4
      );

    // Decode payload
    const binary = atob(padded);

    const bytes = Uint8Array.from(
      binary,
      char => char.charCodeAt(0)
    );

    const json = new TextDecoder().decode(bytes);

    const payload = JSON.parse(json);

    if (
      typeof payload !== 'object' ||
      payload === null
    ) {
      return null;
    }

    return payload as Record<string, unknown>;

  } catch {
    return null;
  }
}


// =====================================================
// JWT: GET ROLE
// =====================================================

export function roleFromToken(
  token: string
): AppRole | null {

  const payload = decodeJwtPayload(token);

  if (!payload) {
    return null;
  }

  const role = payload['role'];

  return parseRole(
    typeof role === 'string'
      ? role
      : null
  );
}


// =====================================================
// JWT: GET EXPIRY
// =====================================================

export function tokenExpiry(
  token: string
): number | null {

  const payload = decodeJwtPayload(token);

  if (!payload) {
    return null;
  }

  const exp = payload['exp'];

  if (
    typeof exp !== 'number' ||
    !Number.isFinite(exp)
  ) {
    return null;
  }

  // JWT expiry is in seconds.
  // JavaScript uses milliseconds.
  return exp * 1000;
}


// =====================================================
// JWT: CHECK EXPIRY
// =====================================================

export function isTokenExpired(
  token: string
): boolean {

  const expiry = tokenExpiry(token);

  // No valid expiry = expired
  if (expiry === null) {
    return true;
  }

  return Date.now() >= expiry;
}
