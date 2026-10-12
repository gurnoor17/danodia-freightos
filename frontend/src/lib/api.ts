/**
 * Danodia FreightOS — Centralized API Client Module
 *
 * Security Architecture & Trade-Off Documentation:
 * ------------------------------------------------
 * In this phase, the Express backend returns stateless JSON Web Tokens (JWTs).
 * The client attaches the token via the `Authorization: Bearer <token>` header for protected requests.
 *
 * Security Trade-offs of Client-Side Token Storage:
 * 1. Accessibility: Because tokens are held in client-side memory and a session cookie for page reloads,
 *    they are technically accessible to JavaScript running in the browser. In an ideal production setup,
 *    HttpOnly, Secure, SameSite=Strict cookies prevent client-side JavaScript access (mitigating XSS theft).
 * 2. Window of Risk: Tokens in this application are short-lived access tokens (15m expiration by default),
 *    which significantly curtails the window of opportunity if a token is ever intercepted.
 * 3. CSRF Protection: Using the `Authorization: Bearer <token>` header provides natural protection
 *    against Cross-Site Request Forgery (CSRF), because malicious third-party sites cannot automatically
 *    attach custom Authorization headers to cross-origin requests.
 */

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface ApiErrorResponse {
  status: 'error';
  message: string;
  errors?: string[];
}

export class ApiError extends Error {
  statusCode: number;
  errors?: string[];

  constructor(message: string, statusCode: number, errors?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Executes a resilient fetch with automatic fallback for macOS localhost/127.0.0.1 port 5000 collision.
 */
async function fetchWithFallback(endpoint: string, options: RequestInit = {}): Promise<Response> {
  let primaryUrl = `${DEFAULT_API_URL}${endpoint}`;
  try {
    const res = await fetch(primaryUrl, options);
    // If localhost failed with forbidden (AirPlay collision), throw to attempt fallback
    if (res.status === 403 && primaryUrl.includes('localhost')) {
      throw new Error('AirPlay port collision');
    }
    return res;
  } catch (err: unknown) {
    if (primaryUrl.includes('localhost')) {
      const fallbackUrl = primaryUrl.replace('localhost', '127.0.0.1');
      try {
        return await fetch(fallbackUrl, options);
      } catch {
        // rethrow original or generic
        throw err instanceof Error ? err : new Error('Network connection failed');
      }
    }
    throw err instanceof Error ? err : new Error('Network connection failed');
  }
}

/**
 * Register a new user
 * POST /api/auth/register
 */
export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<{ user: UserProfile }> {
  let response: Response;
  try {
    response = await fetchWithFallback('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new ApiError(
      err instanceof Error && err.message !== 'Failed to fetch'
        ? err.message
        : 'Unable to reach the server. Please check your internet connection.',
      0
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || 'Registration failed. Please check your details.';
    throw new ApiError(message, response.status, data?.errors);
  }

  return data.data;
}

/**
 * Login user with credentials
 * POST /api/auth/login
 */
export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  let response: Response;
  try {
    response = await fetchWithFallback('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new ApiError(
      err instanceof Error && err.message !== 'Failed to fetch'
        ? err.message
        : 'Unable to reach the server. Please check your internet connection.',
      0
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || 'Login failed. Please verify your credentials.';
    throw new ApiError(message, response.status, data?.errors);
  }

  return data.data;
}

/**
 * Retrieve current user profile using JWT token
 * GET /api/auth/me
 */
export async function getMe(token: string): Promise<UserProfile> {
  let response: Response;
  try {
    response = await fetchWithFallback('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (err) {
    throw new ApiError(
      err instanceof Error && err.message !== 'Failed to fetch'
        ? err.message
        : 'Network error while fetching profile.',
      0
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message || 'Session expired or invalid.';
    throw new ApiError(message, response.status);
  }

  return data.data.user;
}

/**
 * Logout user
 * POST /api/auth/logout
 */
export async function logoutUser(token?: string): Promise<void> {
  try {
    await fetchWithFallback('/auth/logout', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    // Client-side logout proceeds even if network request fails
  }
}
