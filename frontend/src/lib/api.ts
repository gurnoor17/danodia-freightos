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
  const primaryUrl = `${DEFAULT_API_URL}${endpoint}`;
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

// ============================================================================
// Phase 5: Shipment CRUD API Client
// ============================================================================

export interface ShipmentRecord {
  id: string;
  region: string;
  category: string | null;
  assigned_manager: string;
  invoice_no: string;
  fba_id: string | null;
  container_no: string;
  number_of_boxes: number;
  total_weight_kg: number;
  volume_cbm: number;
  pickup_date: string;
  sailing_date: string;
  expected_eta: string;
  actual_arrival: string | null;
  status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateShipmentPayload {
  region: string;
  category?: string | null;
  assigned_manager: string;
  invoice_no: string;
  fba_id?: string | null;
  container_no: string;
  number_of_boxes: number;
  total_weight_kg: number;
  volume_cbm: number;
  pickup_date: string;
  sailing_date: string;
  expected_eta: string;
  actual_arrival?: string | null;
  status?: string;
}

export interface ShipmentQueryParams {
  search?: string;
  region?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ShipmentListResponse {
  shipments: ShipmentRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    count: number;
    totalBoxes: number;
    totalWeightKg: number;
    totalVolumeCbm: number;
  };
}

export interface OriginSummaryData {
  id: string;
  title: string;
  shipmentCount: number;
  totalWeightKg: number;
  totalVolumeCbm: number;
  isHighlighted?: boolean;
}

export interface ShipmentSummaryResponse {
  all: OriginSummaryData;
  usa: OriginSummaryData;
  uk: OriginSummaryData;
  germany: OriginSummaryData;
  walmart_us: OriginSummaryData;
}

/**
 * Fetch list of shipments with search, filtering, and aggregates
 * GET /api/shipments
 */
export async function getShipments(
  token: string,
  params: ShipmentQueryParams = {}
): Promise<ShipmentListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.region && params.region !== 'all') query.set('region', params.region);
  if (params.status && params.status !== 'All Statuses') query.set('status', params.status);
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);

  const qs = query.toString();
  const endpoint = `/shipments${qs ? `?${qs}` : ''}`;

  let response: Response;
  try {
    response = await fetchWithFallback(endpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    throw new ApiError(
      err instanceof Error && err.message !== 'Failed to fetch'
        ? err.message
        : 'Network error while fetching shipments.',
      0
    );
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.message || 'Failed to fetch shipments', response.status, data?.errors);
  }
  return data.data;
}

/**
 * Fetch database aggregates across all origin regions
 * GET /api/shipments/summary
 */
export async function getShipmentSummary(token: string): Promise<ShipmentSummaryResponse> {
  let response: Response;
  try {
    response = await fetchWithFallback('/shipments/summary', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    throw new ApiError(
      err instanceof Error && err.message !== 'Failed to fetch'
        ? err.message
        : 'Network error while fetching shipment summary.',
      0
    );
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.message || 'Failed to fetch shipment summary', response.status);
  }
  return data.data;
}

/**
 * Create a new shipment record
 * POST /api/shipments
 */
export async function createShipment(
  token: string,
  payload: CreateShipmentPayload
): Promise<ShipmentRecord> {
  let response: Response;
  try {
    response = await fetchWithFallback('/shipments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new ApiError(
      err instanceof Error && err.message !== 'Failed to fetch'
        ? err.message
        : 'Network error while creating shipment.',
      0
    );
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      data?.message || 'Failed to create shipment',
      response.status,
      data?.errors
    );
  }
  return data.data.shipment;
}

/**
 * Retrieve a single shipment by ID
 * GET /api/shipments/:id
 */
export async function getShipmentById(token: string, id: string): Promise<ShipmentRecord> {
  let response: Response;
  try {
    response = await fetchWithFallback(`/shipments/${id}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    throw new ApiError('Network error while retrieving shipment.', 0);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.message || 'Shipment not found', response.status);
  }
  return data.data.shipment;
}

/**
 * Update an existing shipment
 * PATCH /api/shipments/:id
 */
export async function updateShipment(
  token: string,
  id: string,
  payload: Partial<CreateShipmentPayload>
): Promise<ShipmentRecord> {
  let response: Response;
  try {
    response = await fetchWithFallback(`/shipments/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new ApiError('Network error while updating shipment.', 0);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      data?.message || 'Failed to update shipment',
      response.status,
      data?.errors
    );
  }
  return data.data.shipment;
}

/**
 * Delete a shipment
 * DELETE /api/shipments/:id
 */
export async function deleteShipment(token: string, id: string): Promise<void> {
  let response: Response;
  try {
    response = await fetchWithFallback(`/shipments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    throw new ApiError('Network error while deleting shipment.', 0);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.message || 'Failed to delete shipment', response.status);
  }
}

// ============================================================================
// Phase 6: CSV Export, Watchlist, and Analytics API Client
// ============================================================================

/**
 * Downloads shipments CSV file respecting the active search and filters.
 * GET /api/shipments/export
 */
export async function downloadShipmentsCsv(
  token: string,
  params: ShipmentQueryParams = {}
): Promise<void> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.region && params.region !== 'all') query.set('region', params.region);
  if (params.status && params.status !== 'All Statuses') query.set('status', params.status);

  const qs = query.toString();
  const endpoint = `/shipments/export${qs ? `?${qs}` : ''}`;

  let response: Response;
  try {
    response = await fetchWithFallback(endpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    throw new ApiError('Network error while exporting CSV.', 0);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new ApiError(errorData?.message || 'Failed to export CSV', response.status);
  }

  // Extract filename from Content-Disposition if present
  let filename = `Danodia_Shipments_${new Date().toISOString().split('T')[0]}.csv`;
  const disposition = response.headers.get('Content-Disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

// --- Watchlist Interfaces & API ---

export interface WatchlistItem {
  id: string;
  user_id: string;
  shipment_id: string;
  created_at: string;
  shipment: ShipmentRecord;
}

/**
 * Retrieve saved watchlist items with shipment details
 * GET /api/watchlist
 */
export async function getWatchlist(token: string): Promise<WatchlistItem[]> {
  let response: Response;
  try {
    response = await fetchWithFallback('/watchlist', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    throw new ApiError('Network error while fetching watchlist.', 0);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.message || 'Failed to fetch watchlist', response.status);
  }
  return data.data.watchlist;
}

/**
 * Retrieve saved shipment IDs for fast bookmark indicators
 * GET /api/watchlist/ids
 */
export async function getWatchlistIds(token: string): Promise<string[]> {
  let response: Response;
  try {
    response = await fetchWithFallback('/watchlist/ids', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    throw new ApiError('Network error while fetching watchlist IDs.', 0);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.message || 'Failed to fetch watchlist IDs', response.status);
  }
  return data.data.shipmentIds;
}

/**
 * Add a shipment to the user's saved watchlist
 * POST /api/watchlist/:shipmentId
 */
export async function addToWatchlist(token: string, shipmentId: string): Promise<void> {
  let response: Response;
  try {
    response = await fetchWithFallback(`/watchlist/${shipmentId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    throw new ApiError('Network error while saving to watchlist.', 0);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.message || 'Failed to save to watchlist', response.status);
  }
}

/**
 * Remove a shipment from the user's saved watchlist
 * DELETE /api/watchlist/:shipmentId
 */
export async function removeFromWatchlist(token: string, shipmentId: string): Promise<void> {
  let response: Response;
  try {
    response = await fetchWithFallback(`/watchlist/${shipmentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    throw new ApiError('Network error while removing from watchlist.', 0);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.message || 'Failed to remove from watchlist', response.status);
  }
}

// --- Analytics Interfaces & API ---

export interface AnalyticsSummary {
  total_shipments?: number;
  totalShipments?: number;
  total_boxes?: number;
  totalBoxes?: number;
  total_weight_kg?: number;
  totalWeightKg?: number;
  total_volume_cbm?: number;
  totalVolumeCbm?: number;
  arrived_shipments?: number;
  arrivedShipments?: number;
  pending_shipments?: number;
  pendingShipments?: number;
  delayed_shipments?: number;
  delayedShipments?: number;
}

export interface RegionMetric {
  region: string;
  count: number;
  boxes?: number;
  weight_kg?: number;
  weightKg?: number;
  volume_cbm?: number;
  volumeCbm?: number;
  percentage?: number;
}

export interface StatusMetric {
  status: string;
  count: number;
  percentage?: number;
}

export interface TimelineMetric {
  month: string;
  count: number;
  volume_cbm?: number;
  volumeCbm?: number;
  weight_kg?: number;
  weightKg?: number;
}

export interface AnalyticsResponse {
  summary: AnalyticsSummary;
  by_region?: RegionMetric[];
  byRegion?: RegionMetric[];
  by_status?: StatusMetric[];
  byStatus?: StatusMetric[];
  timeline: TimelineMetric[];
}

/**
 * Retrieve comprehensive aggregated logistics analytics
 * GET /api/analytics
 */
export async function getAnalytics(token: string): Promise<AnalyticsResponse> {
  let response: Response;
  try {
    response = await fetchWithFallback('/analytics', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    throw new ApiError('Network error while fetching analytics.', 0);
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.message || 'Failed to fetch analytics', response.status);
  }
  return data.data;
}

