import { Shell } from "@/components/shell";
import { getTrips } from "@/lib/api";
import { TravelersClient, TravelerDirectoryRow } from "./travelers-client";

export default async function TravelersPage() {
  const trips = await getTrips();
  const travelers: TravelerDirectoryRow[] = trips
    .map((trip) => {
      const profile = trip.traveler_profile;
      return {
        id: profile?.id ?? trip.id,
        name: profile?.traveler_name ?? trip.traveler_name,
        role: "Employee",
        email: profile?.email ?? "",
        phone: profile?.phone ?? "",
        username: buildUsername(profile?.traveler_name ?? trip.traveler_name),
        password: "Issued",
        seatPreference: profile?.seat_preference ?? "",
        loyaltyProgram: profile?.loyalty_program ?? "",
        loyaltyNumber: profile?.loyalty_number ?? "",
        travelPriority: trip.optimization_preference ? titleCase(trip.optimization_preference) : "Balanced",
        preferredCabin: trip.selected_option?.cabin_class ? titleCase(trip.selected_option.cabin_class) : "Economy",
        travelNotes: trip.policy_preferences ?? "",
      };
    })
    .filter((profile, index, all) => all.findIndex((item) => item.name === profile.name) === index);

  return (
    <Shell>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="eyebrow">Travelers</p>
          <h2 className="mt-2 text-4xl font-semibold tracking-[-0.02em]">Employee directory and companion access</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
            Create travelers, store operational contact details, and issue temporary credentials for the future
            companion mobile app.
          </p>
        </div>
      </div>

      <TravelersClient initialTravelers={travelers} />
    </Shell>
  );
}

function buildUsername(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") || "traveler";
}

function titleCase(value: string): string {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
