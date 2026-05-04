import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  approveTrip,
  confirmBooking,
  getAdminDashboard,
  getApiBaseUrl,
  getCompanies,
  getPolicies,
  getTrips,
  rejectTrip,
  selectTripOption,
  submitTrip,
} from "./src/api/client";
import { formatCurrency, formatDuration, humanize } from "./src/api/format";
import {
  AdminDashboard,
  AdminQueueRow,
  Company,
  Recommendation,
  TravelPolicy,
  Trip,
  TripSubmissionResponse,
} from "./src/api/types";

type Tab = "dashboard" | "trips" | "admin";

type TripForm = {
  traveler_name: string;
  company_id: number;
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string;
  preferred_arrival_deadline: string;
  budget_cap: string;
  policy_preferences: string;
  optimization_preference: string;
  traveler_profile: {
    email: string;
    phone: string;
    date_of_birth: string;
    known_traveler_number: string;
    loyalty_program: string;
    loyalty_number: string;
    seat_preference: string;
  };
};

const today = new Date();
const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function createForm(companyId: number): TripForm {
  return {
    traveler_name: "",
    company_id: companyId,
    origin: "SFO",
    destination: "SEA",
    departure_date: isoDate(tomorrow),
    return_date: isoDate(nextWeek),
    preferred_arrival_deadline: "11:00",
    budget_cap: "1200",
    policy_preferences: "Prefer nonstop where possible",
    optimization_preference: "balanced",
    traveler_profile: {
      email: "",
      phone: "",
      date_of_birth: "",
      known_traveler_number: "",
      loyalty_program: "",
      loyalty_number: "",
      seat_preference: "",
    },
  };
}

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [policies, setPolicies] = useState<TravelPolicy[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [focusedTrip, setFocusedTrip] = useState<Trip | null>(null);
  const [latestSubmission, setLatestSubmission] = useState<TripSubmissionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [nextCompanies, nextPolicies, nextTrips, nextDashboard] = await Promise.all([
      getCompanies(),
      getPolicies(),
      getTrips(),
      getAdminDashboard(),
    ]);
    setCompanies(nextCompanies);
    setPolicies(nextPolicies);
    setTrips(nextTrips);
    setDashboard(nextDashboard);
    setFocusedTrip((current) => {
      if (!nextTrips.length) {
        return null;
      }
      return nextTrips.find((trip) => trip.id === current?.id) ?? nextTrips[0];
    });
  }, []);

  useEffect(() => {
    loadData()
      .catch((error: unknown) => {
        Alert.alert("Unable to reach backend", error instanceof Error ? error.message : "Request failed");
      })
      .finally(() => setLoading(false));
  }, [loadData]);

  async function refresh() {
    setRefreshing(true);
    setMessage(null);
    try {
      await loadData();
    } catch (error) {
      Alert.alert("Refresh failed", error instanceof Error ? error.message : "Request failed");
    } finally {
      setRefreshing(false);
    }
  }

  function syncTrip(nextTrip: Trip) {
    setFocusedTrip(nextTrip);
    setTrips((current) => [nextTrip, ...current.filter((trip) => trip.id !== nextTrip.id)]);
    setLatestSubmission((current) => (current ? { ...current, trip: nextTrip } : current));
  }

  async function performTripAction(action: () => Promise<Trip>, success: (trip: Trip) => string) {
    setActionPending(true);
    setMessage(null);
    try {
      const nextTrip = await action();
      syncTrip(nextTrip);
      setMessage(success(nextTrip));
      await loadData();
    } catch (error) {
      Alert.alert("Action failed", error instanceof Error ? error.message : "Request failed");
    } finally {
      setActionPending(false);
    }
  }

  async function handleSubmitted(payload: TripSubmissionResponse) {
    setLatestSubmission(payload);
    syncTrip(payload.trip);
    setMessage(`Generated ${payload.trip.recommendations.length} ranked recommendations.`);
    await loadData();
  }

  const policy = policies[0];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Expo Go MVP</Text>
          <Text style={styles.title}>Travel Optimizer</Text>
          <Text style={styles.apiText}>API: {getApiBaseUrl()}</Text>
        </View>
        {loading ? <ActivityIndicator color="#0F172A" /> : null}
      </View>

      <View style={styles.tabs}>
        <TabButton active={tab === "dashboard"} icon="analytics-outline" label="Dashboard" onPress={() => setTab("dashboard")} />
        <TabButton active={tab === "trips"} icon="airplane-outline" label="Trips" onPress={() => setTab("trips")} />
        <TabButton active={tab === "admin"} icon="briefcase-outline" label="Admin" onPress={() => setTab("admin")} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        {loading ? (
          <Card>
            <ActivityIndicator color="#0F172A" />
            <Text style={styles.mutedCenter}>Loading travel workspace...</Text>
          </Card>
        ) : null}

        {!loading && tab === "dashboard" ? (
          <DashboardScreen dashboard={dashboard} policy={policy} trips={trips} />
        ) : null}

        {!loading && tab === "trips" ? (
          <TripsScreen
            actionPending={actionPending}
            companies={companies}
            focusedTrip={focusedTrip}
            latestSubmission={latestSubmission}
            message={message}
            onConfirmBooking={(bookingId) =>
              performTripAction(() => confirmBooking(bookingId), (trip) => `Booking confirmed: ${trip.booking?.confirmation_code ?? "reference pending"}.`)
            }
            onApprove={(tripId) => performTripAction(() => approveTrip(tripId), () => "Exception approved. Ready to book.")}
            onReject={(tripId) => performTripAction(() => rejectTrip(tripId), () => "Exception rejected. Pick a different option.")}
            onSelectOption={(tripId, optionId) =>
              performTripAction(
                () => selectTripOption(tripId, optionId),
                (trip) => trip.status === "pending_approval" ? "Option selected and routed for approval." : "Option selected. Ready to book."
              )
            }
            onSubmitted={handleSubmitted}
            onTripFocus={setFocusedTrip}
            trips={trips}
          />
        ) : null}

        {!loading && tab === "admin" ? <AdminScreen dashboard={dashboard} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function DashboardScreen({
  dashboard,
  policy,
  trips,
}: {
  dashboard: AdminDashboard | null;
  policy?: TravelPolicy;
  trips: Trip[];
}) {
  const heroTrip = trips[0];
  return (
    <View style={styles.stack}>
      <Card>
        <Text style={styles.eyebrow}>Optimizer-first MVP</Text>
        <Text style={styles.hero}>Policy-aware business travel planning from your phone.</Text>
        <Text style={styles.body}>Submit trips, compare mock flight and rail options, and move approved itineraries into booking.</Text>
      </Card>

      {policy ? (
        <Card>
          <Text style={styles.cardTitle}>Active policy</Text>
          <View style={styles.detailGrid}>
            <Detail label="Budget" value={formatCurrency(policy.budget_limit)} />
            <Detail label="Hotel cap" value={formatCurrency(policy.max_hotel_nightly_rate)} />
            <Detail label="Rail" value={policy.rail_enabled ? "Enabled" : "Disabled"} />
            <Detail label="Cabins" value={policy.allowed_cabin_classes.join(", ")} />
          </View>
        </Card>
      ) : null}

      <Metrics metrics={dashboard?.metrics ?? []} />

      {heroTrip?.recommendations[0] ? (
        <RecommendationCard recommendation={heroTrip.recommendations[0]} />
      ) : (
        <EmptyState text="Submit your first trip to see ranked recommendations." />
      )}
    </View>
  );
}

function TripsScreen({
  actionPending,
  companies,
  focusedTrip,
  latestSubmission,
  message,
  onApprove,
  onConfirmBooking,
  onReject,
  onSelectOption,
  onSubmitted,
  onTripFocus,
  trips,
}: {
  actionPending: boolean;
  companies: Company[];
  focusedTrip: Trip | null;
  latestSubmission: TripSubmissionResponse | null;
  message: string | null;
  onApprove: (tripId: number) => void;
  onConfirmBooking: (bookingId: number) => void;
  onReject: (tripId: number) => void;
  onSelectOption: (tripId: number, optionId: number) => void;
  onSubmitted: (payload: TripSubmissionResponse) => Promise<void>;
  onTripFocus: (trip: Trip) => void;
  trips: Trip[];
}) {
  return (
    <View style={styles.stack}>
      <TripRequestForm companies={companies} onSubmitted={onSubmitted} />

      <Card>
        <Text style={styles.cardTitle}>Recent trips</Text>
        {trips.length ? (
          trips.slice(0, 6).map((trip) => (
            <Pressable key={trip.id} style={styles.rowButton} onPress={() => onTripFocus(trip)}>
              <View>
                <Text style={styles.rowTitle}>#{trip.id} {trip.traveler_name}</Text>
                <Text style={styles.small}>{trip.origin} to {trip.destination}</Text>
              </View>
              <Badge tone={focusedTrip?.id === trip.id ? "success" : "neutral"}>{humanize(trip.status)}</Badge>
            </Pressable>
          ))
        ) : (
          <EmptyState text="No trips yet." />
        )}
      </Card>

      {focusedTrip ? (
        <FocusedTrip
          actionPending={actionPending}
          latestSubmission={latestSubmission}
          message={message}
          onApprove={onApprove}
          onConfirmBooking={onConfirmBooking}
          onReject={onReject}
          onSelectOption={onSelectOption}
          trip={focusedTrip}
        />
      ) : null}
    </View>
  );
}

function TripRequestForm({
  companies,
  onSubmitted,
}: {
  companies: Company[];
  onSubmitted: (payload: TripSubmissionResponse) => Promise<void>;
}) {
  const [form, setForm] = useState(() => createForm(companies[0]?.id ?? 1));
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (companies[0] && form.company_id === 1) {
      setForm((current) => ({ ...current, company_id: companies[0].id }));
    }
  }, [companies, form.company_id]);

  const validationError = useMemo(() => {
    if (!companies.length) return "Seed or create a company first.";
    if (!form.traveler_name.trim()) return "Traveler name is required.";
    if (form.origin.trim().toUpperCase() === form.destination.trim().toUpperCase()) return "Origin and destination must differ.";
    if (!form.traveler_profile.email.trim()) return "Traveler email is required.";
    if (!form.traveler_profile.phone.trim()) return "Traveler phone is required.";
    if (!form.traveler_profile.date_of_birth.trim()) return "Date of birth is required.";
    return null;
  }, [companies.length, form]);

  async function handleSubmit() {
    if (validationError) {
      Alert.alert("Check the trip", validationError);
      return;
    }

    setPending(true);
    try {
      const payload = await submitTrip({
        ...form,
        origin: form.origin.toUpperCase(),
        destination: form.destination.toUpperCase(),
        budget_cap: Number(form.budget_cap),
      });
      await onSubmitted(payload);
      setForm((current) => ({
        ...createForm(current.company_id),
        origin: current.origin,
        destination: current.destination,
      }));
    } catch (error) {
      Alert.alert("Submit failed", error instanceof Error ? error.message : "Request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <Text style={styles.cardTitle}>New trip request</Text>
      <Field label="Traveler name" value={form.traveler_name} onChangeText={(value) => setForm({ ...form, traveler_name: value })} />
      <View style={styles.twoCol}>
        <Field label="Origin" value={form.origin} autoCapitalize="characters" onChangeText={(value) => setForm({ ...form, origin: value.toUpperCase() })} />
        <Field label="Destination" value={form.destination} autoCapitalize="characters" onChangeText={(value) => setForm({ ...form, destination: value.toUpperCase() })} />
      </View>
      <View style={styles.twoCol}>
        <Field label="Depart YYYY-MM-DD" value={form.departure_date} onChangeText={(value) => setForm({ ...form, departure_date: value })} />
        <Field label="Return YYYY-MM-DD" value={form.return_date} onChangeText={(value) => setForm({ ...form, return_date: value })} />
      </View>
      <View style={styles.twoCol}>
        <Field label="Email" value={form.traveler_profile.email} keyboardType="email-address" onChangeText={(value) => setForm({ ...form, traveler_profile: { ...form.traveler_profile, email: value } })} />
        <Field label="Phone" value={form.traveler_profile.phone} keyboardType="phone-pad" onChangeText={(value) => setForm({ ...form, traveler_profile: { ...form.traveler_profile, phone: value } })} />
      </View>
      <View style={styles.twoCol}>
        <Field label="DOB YYYY-MM-DD" value={form.traveler_profile.date_of_birth} onChangeText={(value) => setForm({ ...form, traveler_profile: { ...form.traveler_profile, date_of_birth: value } })} />
        <Field label="Budget" value={form.budget_cap} keyboardType="numeric" onChangeText={(value) => setForm({ ...form, budget_cap: value })} />
      </View>
      <SegmentedControl
        label="Preference"
        options={["cheapest", "balanced", "fastest"]}
        value={form.optimization_preference}
        onChange={(value) => setForm({ ...form, optimization_preference: value })}
      />
      <Field label="Policy preferences" value={form.policy_preferences} onChangeText={(value) => setForm({ ...form, policy_preferences: value })} />
      {validationError ? <Text style={styles.warning}>{validationError}</Text> : null}
      <PrimaryButton disabled={pending || Boolean(validationError)} label={pending ? "Optimizing..." : "Submit trip"} onPress={handleSubmit} />
    </Card>
  );
}

function FocusedTrip({
  actionPending,
  latestSubmission,
  message,
  onApprove,
  onConfirmBooking,
  onReject,
  onSelectOption,
  trip,
}: {
  actionPending: boolean;
  latestSubmission: TripSubmissionResponse | null;
  message: string | null;
  onApprove: (tripId: number) => void;
  onConfirmBooking: (bookingId: number) => void;
  onReject: (tripId: number) => void;
  onSelectOption: (tripId: number, optionId: number) => void;
  trip: Trip;
}) {
  return (
    <View style={styles.stack}>
      <Card>
        <Text style={styles.eyebrow}>Focused trip</Text>
        <Text style={styles.cardTitle}>#{trip.id} for {trip.traveler_name}</Text>
        <Text style={styles.body}>{trip.origin} to {trip.destination} · {humanize(trip.status)}</Text>
        <View style={styles.detailGrid}>
          <Detail label="Booking" value={humanize(trip.booking?.status)} />
          <Detail label="Selected" value={trip.selected_option ? trip.selected_option.carrier : "none"} />
          <Detail label="Budget" value={formatCurrency(trip.budget_cap)} />
          <Detail label="Preference" value={trip.optimization_preference} />
        </View>
        {latestSubmission?.trip.id === trip.id ? (
          <Text style={styles.success}>Cheapest option: {formatCurrency(latestSubmission.summary.cheapest_option_cost)}</Text>
        ) : null}
        {message ? <Text style={styles.success}>{message}</Text> : null}
      </Card>

      {trip.status === "pending_approval" ? (
        <Card>
          <Text style={styles.cardTitle}>Approval required</Text>
          <Text style={styles.body}>This selected itinerary is outside policy. You can advance the demo flow here.</Text>
          <View style={styles.actions}>
            <PrimaryButton disabled={actionPending} label="Approve" onPress={() => onApprove(trip.id)} />
            <SecondaryButton disabled={actionPending} label="Reject" onPress={() => onReject(trip.id)} />
          </View>
        </Card>
      ) : null}

      {trip.status === "approved" && trip.booking ? (
        <Card>
          <Text style={styles.cardTitle}>Ready to book</Text>
          <Text style={styles.body}>Confirm the mock booking to generate a reference.</Text>
          <PrimaryButton disabled={actionPending} label="Confirm booking" onPress={() => onConfirmBooking(trip.booking!.id)} />
        </Card>
      ) : null}

      {trip.recommendations.map((recommendation) => (
        <RecommendationCard
          key={recommendation.id}
          actionDisabled={actionPending || trip.status === "booked" || trip.selected_option?.id === recommendation.option.id}
          actionLabel={trip.selected_option?.id === recommendation.option.id ? "Selected" : "Choose option"}
          isSelected={trip.selected_option?.id === recommendation.option.id}
          onAction={() => onSelectOption(trip.id, recommendation.option.id)}
          recommendation={recommendation}
        />
      ))}
    </View>
  );
}

function AdminScreen({ dashboard }: { dashboard: AdminDashboard | null }) {
  return (
    <View style={styles.stack}>
      <Metrics metrics={dashboard?.metrics ?? []} />
      <QueueCard title="Approval queue" rows={dashboard?.approval_queue ?? []} />
      <QueueCard title="Fulfillment queue" rows={dashboard?.fulfillment_queue ?? []} />
      <Card>
        <Text style={styles.cardTitle}>Trip visibility</Text>
        {dashboard?.trips.length ? (
          dashboard.trips.slice(0, 10).map((trip) => (
            <View key={trip.trip_id} style={styles.listRow}>
              <View style={styles.flex}>
                <Text style={styles.rowTitle}>#{trip.trip_id} {trip.traveler_name}</Text>
                <Text style={styles.small}>{trip.route} · {trip.recommended_carrier} · {formatCurrency(trip.recommended_cost)}</Text>
              </View>
              <Badge tone={trip.policy_compliant ? "success" : "warning"}>{trip.policy_compliant ? "Compliant" : "Review"}</Badge>
            </View>
          ))
        ) : (
          <EmptyState text="No dashboard rows yet." />
        )}
      </Card>
    </View>
  );
}

function RecommendationCard({
  actionDisabled,
  actionLabel,
  isSelected,
  onAction,
  recommendation,
}: {
  actionDisabled?: boolean;
  actionLabel?: string;
  isSelected?: boolean;
  onAction?: () => void;
  recommendation: Recommendation;
}) {
  const option = recommendation.option;
  return (
    <Card>
      <View style={styles.cardTop}>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>Recommendation #{recommendation.rank}</Text>
          <Text style={styles.cardTitle}>{option.mode} via {option.carrier}</Text>
          <Text style={styles.body}>{recommendation.rationale}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.small}>Score</Text>
          <Text style={styles.score}>{recommendation.score.toFixed(2)}</Text>
        </View>
      </View>
      <View style={styles.detailGrid}>
        <Detail label="Cost" value={formatCurrency(option.total_cost)} />
        <Detail label="Duration" value={formatDuration(option.total_duration_minutes)} />
        <Detail label="Cabin" value={option.cabin_class} />
        <Detail label="Savings" value={formatCurrency(recommendation.projected_savings)} />
      </View>
      <View style={styles.badges}>
        <Badge tone={option.policy_compliant ? "success" : "warning"}>
          {option.policy_compliant ? "Policy compliant" : "Needs review"}
        </Badge>
        {isSelected ? <Badge tone="success">Selected</Badge> : null}
        <Badge tone="neutral">{option.provider}</Badge>
        <Badge tone="neutral">{`${option.metadata.departure_time ?? "TBD"} - ${option.metadata.arrival_time ?? "TBD"}`}</Badge>
        {option.policy_flags.map((flag) => <Badge key={flag} tone="warning">{flag}</Badge>)}
      </View>
      {onAction ? <PrimaryButton disabled={actionDisabled} label={actionLabel ?? "Select option"} onPress={onAction} /> : null}
    </Card>
  );
}

function Metrics({ metrics }: { metrics: { label: string; value: string; detail: string }[] }) {
  if (!metrics.length) {
    return <EmptyState text="No metrics yet." />;
  }

  return (
    <View style={styles.metrics}>
      {metrics.map((metric) => (
        <Card key={metric.label} compact>
          <Text style={styles.eyebrow}>{metric.label}</Text>
          <Text style={styles.metricValue}>{metric.value}</Text>
          <Text style={styles.small}>{metric.detail}</Text>
        </Card>
      ))}
    </View>
  );
}

function QueueCard({ rows, title }: { rows: AdminQueueRow[]; title: string }) {
  return (
    <Card>
      <Text style={styles.cardTitle}>{title}</Text>
      {rows.length ? rows.map((row) => (
        <View key={`${title}-${row.trip_id}-${row.booking_id ?? "approval"}`} style={styles.listRow}>
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>#{row.trip_id} {row.traveler_name}</Text>
            <Text style={styles.small}>{row.route} · {row.action_label}</Text>
          </View>
          <Badge tone="warning">{humanize(row.trip_status)}</Badge>
        </View>
      )) : <EmptyState text="Nothing waiting here." />}
    </Card>
  );
}

function TabButton({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tabButton, active && styles.tabButtonActive]} onPress={onPress}>
      <Ionicons color={active ? "#F8FAFC" : "#475569"} name={icon} size={18} />
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

function Field({
  label,
  ...inputProps
}: {
  label: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#94A3B8" style={styles.input} {...inputProps} />
    </View>
  );
}

function SegmentedControl({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.segmented}>
        {options.map((option) => (
          <Pressable key={option} style={[styles.segment, value === option && styles.segmentActive]} onPress={() => onChange(option)}>
            <Text style={[styles.segmentText, value === option && styles.segmentTextActive]}>{option}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function PrimaryButton({ disabled, label, onPress }: { disabled?: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable disabled={disabled} style={[styles.primaryButton, disabled && styles.disabled]} onPress={onPress}>
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ disabled, label, onPress }: { disabled?: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable disabled={disabled} style={[styles.secondaryButton, disabled && styles.disabled]} onPress={onPress}>
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.small}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function Badge({ children, tone }: { children: string; tone: "success" | "warning" | "neutral" }) {
  return (
    <View style={[styles.badge, tone === "success" && styles.badgeSuccess, tone === "warning" && styles.badgeWarning]}>
      <Text style={[styles.badgeText, tone === "success" && styles.badgeSuccessText, tone === "warning" && styles.badgeWarningText]}>
        {children}
      </Text>
    </View>
  );
}

function Card({ children, compact }: { children: React.ReactNode; compact?: boolean }) {
  return <View style={[styles.card, compact && styles.compactCard]}>{children}</View>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.small}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F7F4EF",
  },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: "#0F172A",
    fontSize: 30,
    fontWeight: "800",
  },
  apiText: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 2,
    maxWidth: 280,
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  tabButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: "#0F172A",
    borderColor: "#0F172A",
  },
  tabText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
  },
  tabTextActive: {
    color: "#F8FAFC",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 18,
    paddingBottom: 36,
  },
  stack: {
    gap: 14,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  compactCard: {
    flex: 1,
    minWidth: 150,
  },
  hero: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 33,
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 21,
    fontWeight: "800",
  },
  body: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
  },
  small: {
    color: "#64748B",
    fontSize: 12,
    lineHeight: 17,
  },
  mutedCenter: {
    color: "#64748B",
    textAlign: "center",
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricValue: {
    color: "#0F172A",
    fontSize: 25,
    fontWeight: "800",
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detail: {
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    minWidth: "47%",
    padding: 10,
    flex: 1,
  },
  detailValue: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4,
    textTransform: "capitalize",
  },
  fieldWrap: {
    gap: 6,
  },
  label: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderColor: "#CBD5E1",
    borderRadius: 8,
    borderWidth: 1,
    color: "#0F172A",
    minHeight: 44,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  twoCol: {
    flexDirection: "row",
    gap: 10,
  },
  segmented: {
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    flexDirection: "row",
    padding: 4,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    borderRadius: 6,
    paddingVertical: 9,
  },
  segmentActive: {
    backgroundColor: "#2563EB",
  },
  segmentText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  segmentTextActive: {
    color: "#FFFFFF",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 8,
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    alignItems: "center",
    borderColor: "#CBD5E1",
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 46,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  secondaryText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  disabled: {
    opacity: 0.5,
  },
  warning: {
    color: "#B45309",
    fontSize: 13,
  },
  success: {
    color: "#047857",
    fontSize: 13,
    fontWeight: "700",
  },
  rowButton: {
    alignItems: "center",
    borderBottomColor: "#E2E8F0",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    gap: 10,
  },
  listRow: {
    alignItems: "center",
    borderBottomColor: "#E2E8F0",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    gap: 10,
  },
  rowTitle: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "800",
  },
  flex: {
    flex: 1,
  },
  cardTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
  },
  scoreBox: {
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    minWidth: 72,
    padding: 10,
  },
  score: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "800",
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    backgroundColor: "#F1F5F9",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeSuccess: {
    backgroundColor: "#DCFCE7",
  },
  badgeWarning: {
    backgroundColor: "#FEF3C7",
  },
  badgeText: {
    color: "#475569",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  badgeSuccessText: {
    color: "#047857",
  },
  badgeWarningText: {
    color: "#B45309",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  empty: {
    borderColor: "#CBD5E1",
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    padding: 14,
  },
});
