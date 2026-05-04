import Constants from "expo-constants";
import {
  AdminDashboard,
  Company,
  TravelPolicy,
  Trip,
  TripSubmissionResponse,
} from "./types";

const extra = Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined;
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? extra?.apiBaseUrl ?? "http://10.0.2.2:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Request failed with ${response.status}`);
  }

  return response.json();
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getCompanies(): Promise<Company[]> {
  return request("/api/v1/companies/");
}

export function getPolicies(): Promise<TravelPolicy[]> {
  return request("/api/v1/policies/");
}

export function getTrips(): Promise<Trip[]> {
  return request("/api/v1/trips/");
}

export function getAdminDashboard(): Promise<AdminDashboard> {
  return request("/api/v1/admin/dashboard");
}

export function submitTrip(payload: Record<string, unknown>): Promise<TripSubmissionResponse> {
  return request("/api/v1/trips/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function selectTripOption(tripId: number, tripOptionId: number): Promise<Trip> {
  return request(`/api/v1/trips/${tripId}/select`, {
    method: "POST",
    body: JSON.stringify({ trip_option_id: tripOptionId }),
  });
}

export function approveTrip(tripId: number): Promise<Trip> {
  return request(`/api/v1/trips/${tripId}/approve`, {
    method: "POST",
    body: JSON.stringify({ approver_name: "Expo demo" }),
  });
}

export function rejectTrip(tripId: number): Promise<Trip> {
  return request(`/api/v1/trips/${tripId}/reject`, {
    method: "POST",
    body: JSON.stringify({ approver_name: "Expo demo" }),
  });
}

export function confirmBooking(bookingId: number): Promise<Trip> {
  return request(`/api/v1/bookings/${bookingId}/confirm`, {
    method: "POST",
  });
}
