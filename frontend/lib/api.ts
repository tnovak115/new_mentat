import {
  AdminDashboard,
  AuthResponse,
  Company,
  TravelPolicy,
  Trip,
  TripSubmissionResponse,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

function getBrowserSession(): AuthResponse | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem("mentat_session");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthResponse;
  } catch {
    return null;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const session = getBrowserSession();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || "Request failed");
  }

  return response.json();
}

export async function getCompanies(): Promise<Company[]> {
  return request("/api/v1/companies/");
}

export async function createCompany(payload: Record<string, unknown>): Promise<Company> {
  return request("/api/v1/companies/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPolicy(companyId: number): Promise<TravelPolicy> {
  return request(`/api/v1/policies/${companyId}`);
}

export async function getPolicies(): Promise<TravelPolicy[]> {
  return request("/api/v1/policies/");
}

export async function getTrips(): Promise<Trip[]> {
  return request("/api/v1/trips/");
}

export async function getTrip(tripId: number): Promise<Trip> {
  return request(`/api/v1/trips/${tripId}`);
}

export async function getAdminDashboard(): Promise<AdminDashboard> {
  return request("/api/v1/admin/dashboard");
}

export async function submitTrip(payload: Record<string, unknown>): Promise<TripSubmissionResponse> {
  return request("/api/v1/trips/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function selectTripOption(tripId: number, tripOptionId: number): Promise<Trip> {
  return request(`/api/v1/trips/${tripId}/select`, {
    method: "POST",
    body: JSON.stringify({ trip_option_id: tripOptionId }),
  });
}

export async function approveTrip(
  tripId: number,
  payload: { approver_name?: string | null; approver_notes?: string | null } = {},
): Promise<Trip> {
  return request(`/api/v1/trips/${tripId}/approve`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function rejectTrip(
  tripId: number,
  payload: { approver_name?: string | null; approver_notes?: string | null } = {},
): Promise<Trip> {
  return request(`/api/v1/trips/${tripId}/reject`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function confirmBooking(bookingId: number): Promise<Trip> {
  return request(`/api/v1/bookings/${bookingId}/confirm`, {
    method: "POST",
  });
}

export async function requestAssistedFulfillment(
  bookingId: number,
  payload: { fulfillment_notes?: string | null } = {},
): Promise<Trip> {
  return request(`/api/v1/bookings/${bookingId}/request-fulfillment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function completeAssistedFulfillment(
  bookingId: number,
  payload: {
    confirmation_code?: string | null;
    provider_record_locator?: string | null;
    fulfilled_by?: string | null;
    fulfillment_notes?: string | null;
  },
): Promise<Trip> {
  return request(`/api/v1/bookings/${bookingId}/complete-fulfillment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateTripTravelerProfile(tripId: number, payload: Record<string, unknown>): Promise<Trip> {
  return request(`/api/v1/trips/${tripId}/traveler-profile`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updatePolicy(companyId: number, payload: Record<string, unknown>): Promise<TravelPolicy> {
  return request(`/api/v1/policies/${companyId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function createPolicy(payload: Record<string, unknown>): Promise<TravelPolicy> {
  return request("/api/v1/policies/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: Record<string, unknown>): Promise<AuthResponse> {
  return request("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function signup(payload: Record<string, unknown>): Promise<AuthResponse> {
  return request("/api/v1/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resetDemoData(): Promise<{ status: string; company: string; username: string; password: string }> {
  return request("/api/v1/admin/reset-demo-data", {
    method: "POST",
  });
}
