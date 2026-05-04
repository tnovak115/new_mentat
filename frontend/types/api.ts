export type Company = {
  id: number;
  name: string;
  created_at: string;
};

export type TravelPolicy = {
  id: number;
  company_id: number;
  budget_limit: number;
  max_hotel_nightly_rate: number;
  preferred_carriers: string[];
  allowed_cabin_classes: string[];
  rail_enabled: boolean;
  hotel_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type TripOption = {
  id: number;
  provider: string;
  mode: string;
  carrier: string;
  cabin_class: string;
  total_cost: number;
  total_duration_minutes: number;
  convenience_score: number;
  policy_compliant: boolean;
  policy_flags: string[];
  metadata: {
    departure_time?: string;
    arrival_time?: string;
    stops?: number;
  };
};

export type Booking = {
  id: number;
  trip_request_id: number;
  trip_option_id: number;
  status: string;
  fulfillment_method: string;
  confirmation_code: string | null;
  provider_record_locator: string | null;
  fulfillment_requested_at: string | null;
  fulfilled_by: string | null;
  fulfillment_notes: string | null;
  failure_reason: string | null;
  booked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ApprovalRequest = {
  id: number;
  trip_request_id: number;
  status: string;
  requested_reason: string | null;
  approver_name: string | null;
  approver_notes: string | null;
  requested_at: string;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TravelerProfile = {
  id: number;
  company_id: number;
  traveler_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  known_traveler_number: string | null;
  loyalty_program: string | null;
  loyalty_number: string | null;
  seat_preference: string | null;
  created_at: string;
  updated_at: string;
};

export type Recommendation = {
  id: number;
  rank: number;
  score: number;
  projected_savings: number;
  rationale: string;
  option: TripOption;
};

export type Trip = {
  id: number;
  traveler_name: string;
  company_id: number;
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string;
  preferred_arrival_deadline: string;
  budget_cap: number;
  policy_preferences: string;
  optimization_preference: string;
  status: string;
  created_at: string;
  traveler_profile: TravelerProfile | null;
  approval_request: ApprovalRequest | null;
  selected_option: TripOption | null;
  booking: Booking | null;
  recommendations: Recommendation[];
};

export type TripSubmissionResponse = {
  trip: Trip;
  summary: {
    total_options: number;
    cheapest_option_cost: number;
    top_recommendation_score: number;
  };
};

export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
};

export type AdminTripRow = {
  trip_id: number;
  traveler_name: string;
  route: string;
  optimization_preference: string;
  trip_status: string;
  booking_status: string | null;
  booking_reference: string | null;
  recommended_mode: string;
  recommended_carrier: string;
  recommended_cost: number;
  projected_savings: number;
  policy_compliant: boolean;
  flags: string[];
};

export type AdminQueueRow = {
  trip_id: number;
  booking_id: number | null;
  traveler_name: string;
  route: string;
  trip_status: string;
  booking_status: string | null;
  booking_reference: string | null;
  fulfillment_method: string | null;
  requested_reason: string | null;
  fulfillment_requested_at: string | null;
  action_label: string;
  action_href: string;
};

export type AdminDashboard = {
  metrics: DashboardMetric[];
  trips: AdminTripRow[];
  approval_queue: AdminQueueRow[];
  fulfillment_queue: AdminQueueRow[];
};

export type AuthResponse = {
  user: {
    id: number;
    username: string;
    name: string;
    email: string;
    role: string;
    company_id: number;
    created_at: string;
  };
  company_id: number;
  company_name: string;
};
