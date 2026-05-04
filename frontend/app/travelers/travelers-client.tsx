"use client";

import { FormEvent, useMemo, useState } from "react";

export type TravelerDirectoryRow = {
  id: number;
  name: string;
  role: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  seatPreference: string;
  loyaltyProgram: string;
  loyaltyNumber: string;
  travelPriority: string;
  preferredCabin: string;
  travelNotes: string;
};

const emptyForm = {
  name: "",
  role: "",
  email: "",
  phone: "",
  seatPreference: "",
  loyaltyProgram: "",
  loyaltyNumber: "",
  travelPriority: "Balanced",
  preferredCabin: "Economy",
  travelNotes: "",
};

export function TravelersClient({ initialTravelers }: { initialTravelers: TravelerDirectoryRow[] }) {
  const [travelers, setTravelers] = useState(initialTravelers);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [issuedCredentials, setIssuedCredentials] = useState<{ username: string; password: string } | null>(null);

  const readyCount = travelers.filter((traveler) => traveler.email && traveler.phone).length;
  const missingCount = travelers.length - readyCount;

  const generatedPreview = useMemo(() => {
    if (!form.name) {
      return null;
    }
    return generateCredentials(form.name);
  }, [form.name]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const credentials = generateCredentials(form.name);
    const nextTraveler: TravelerDirectoryRow = {
      id: Date.now(),
      name: form.name,
      role: form.role,
      email: form.email,
      phone: form.phone,
      username: credentials.username,
      password: credentials.password,
      seatPreference: form.seatPreference,
      loyaltyProgram: form.loyaltyProgram,
      loyaltyNumber: form.loyaltyNumber,
      travelPriority: form.travelPriority,
      preferredCabin: form.preferredCabin,
      travelNotes: form.travelNotes,
    };

    setTravelers((current) => [nextTraveler, ...current]);
    setIssuedCredentials(credentials);
    setForm(emptyForm);
    setIsAdding(false);
  }

  function beginEdit(traveler: TravelerDirectoryRow) {
    setEditingId(traveler.id);
    setIsAdding(false);
    setForm({
      name: traveler.name,
      role: traveler.role,
      email: traveler.email,
      phone: traveler.phone,
      seatPreference: traveler.seatPreference,
      loyaltyProgram: traveler.loyaltyProgram,
      loyaltyNumber: traveler.loyaltyNumber,
      travelPriority: traveler.travelPriority,
      preferredCabin: traveler.preferredCabin,
      travelNotes: traveler.travelNotes,
    });
  }

  function cancelForm() {
    setEditingId(null);
    setIsAdding(false);
    setForm(emptyForm);
  }

  function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingId === null) {
      return;
    }

    setTravelers((current) =>
      current.map((traveler) =>
        traveler.id === editingId
          ? {
              ...traveler,
              name: form.name,
              role: form.role,
              email: form.email,
              phone: form.phone,
              seatPreference: form.seatPreference,
              loyaltyProgram: form.loyaltyProgram,
              loyaltyNumber: form.loyaltyNumber,
              travelPriority: form.travelPriority,
              preferredCabin: form.preferredCabin,
              travelNotes: form.travelNotes,
            }
          : traveler,
      ),
    );
    cancelForm();
  }

  return (
    <section className="space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        <DirectoryStat label="Travelers" value={`${travelers.length}`} />
        <DirectoryStat label="Booking-ready" value={`${readyCount}`} />
        <DirectoryStat label="Missing contact" value={`${missingCount}`} />
      </div>

      {issuedCredentials ? (
        <div className="section-card border-sky-200 bg-sky-50 p-4">
          <p className="eyebrow">Credentials generated</p>
          <p className="mt-2 text-sm text-steel">
            Username <span className="font-semibold text-ink">{issuedCredentials.username}</span> and temporary
            password <span className="font-semibold text-ink">{issuedCredentials.password}</span> are ready for future
            mobile app access.
          </p>
        </div>
      ) : null}

      <div className="section-card p-4">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Employee directory</p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight">Traveler profiles</h3>
          </div>
          <button className="btn-primary" onClick={() => setIsAdding((current) => !current)} type="button">
            {isAdding ? "Close" : "Add traveler"}
          </button>
        </div>

        {isAdding || editingId !== null ? (
          <form className="mb-4 rounded-md border border-border bg-cloud p-4" onSubmit={editingId === null ? handleSubmit : handleUpdate}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">{editingId === null ? "New traveler" : "Edit traveler"}</p>
                <h4 className="mt-1 text-lg font-semibold tracking-tight">
                  {editingId === null ? "Create mobile-ready employee record" : "Update contact and preferences"}
                </h4>
              </div>
              <button className="btn-secondary" onClick={cancelForm} type="button">Cancel</button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Name">
                <input className="field" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              </Field>
              <Field label="Role">
                <input className="field" required value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} placeholder="Sales lead" />
              </Field>
              <Field label="Email">
                <input className="field" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </Field>
              <Field label="Phone number">
                <input className="field" required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              </Field>
              <Field label="Seat preference">
                <select className="field" value={form.seatPreference} onChange={(event) => setForm({ ...form, seatPreference: event.target.value })}>
                  <option value="">No preference</option>
                  <option value="Aisle">Aisle</option>
                  <option value="Window">Window</option>
                  <option value="Extra legroom">Extra legroom</option>
                </select>
              </Field>
              <Field label="Preferred cabin">
                <select className="field" value={form.preferredCabin} onChange={(event) => setForm({ ...form, preferredCabin: event.target.value })}>
                  <option value="Economy">Economy</option>
                  <option value="Premium economy">Premium economy</option>
                  <option value="Business">Business</option>
                </select>
              </Field>
              <Field label="Travel priority">
                <select className="field" value={form.travelPriority} onChange={(event) => setForm({ ...form, travelPriority: event.target.value })}>
                  <option value="Balanced">Balanced</option>
                  <option value="Lowest cost">Lowest cost</option>
                  <option value="Fastest route">Fastest route</option>
                  <option value="Fewest connections">Fewest connections</option>
                </select>
              </Field>
              <Field label="Loyalty program">
                <input className="field" value={form.loyaltyProgram} onChange={(event) => setForm({ ...form, loyaltyProgram: event.target.value })} placeholder="United MileagePlus" />
              </Field>
              <Field label="Loyalty number">
                <input className="field" value={form.loyaltyNumber} onChange={(event) => setForm({ ...form, loyaltyNumber: event.target.value })} />
              </Field>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-steel">Travel notes</span>
                <textarea
                  className="field min-h-20"
                  value={form.travelNotes}
                  onChange={(event) => setForm({ ...form, travelNotes: event.target.value })}
                  placeholder="Accessibility needs, recurring routes, manager preferences, or booking constraints."
                />
              </label>
            </div>
            {editingId === null && generatedPreview ? (
              <div className="mt-3 rounded-md border border-border bg-white p-3 text-sm text-steel">
                Generated username: <span className="font-semibold text-ink">{generatedPreview.username}</span>
              </div>
            ) : null}
            <button className="btn-primary mt-4" type="submit">
              {editingId === null ? "Create traveler" : "Save traveler"}
            </button>
          </form>
        ) : null}

        <div className="overflow-hidden rounded-md border border-border bg-white">
          <table className="min-w-full divide-y divide-border text-left">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                <th className="px-4 py-3">Traveler</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Mobile credentials</th>
                <th className="px-4 py-3">Preferences</th>
                <th className="px-4 py-3">Readiness</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {travelers.map((traveler) => {
                const ready = Boolean(traveler.email && traveler.phone);
                return (
                  <tr className="text-sm hover:bg-cloud/60" key={`${traveler.id}-${traveler.username}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{traveler.name}</div>
                      <div className="text-xs text-muted">{traveler.role}</div>
                    </td>
                    <td className="px-4 py-3 text-steel">
                      <div>{traveler.email || "No email"}</div>
                      <div className="text-xs text-muted">{traveler.phone || "No phone"}</div>
                    </td>
                    <td className="px-4 py-3 text-steel">
                      <div>{traveler.username}</div>
                      <div className="text-xs text-muted">{traveler.password === "Issued" ? "Issued" : "Temporary password generated"}</div>
                    </td>
                    <td className="px-4 py-3 text-steel">
                      <div>{traveler.travelPriority || "Balanced"} · {traveler.preferredCabin || "Economy"}</div>
                      <div className="text-xs text-muted">
                        {traveler.seatPreference || "No seat"} · {traveler.loyaltyProgram || "No loyalty"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${ready ? "bg-sky-50 text-ink ring-1 ring-sky-200" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"}`}>
                        {ready ? "Ready" : "Missing contact"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="btn-secondary" onClick={() => beginEdit(traveler)} type="button">
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function DirectoryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="section-card p-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-steel">{label}</span>
      {children}
    </label>
  );
}

function generateCredentials(name: string): { username: string; password: string } {
  const username = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") || "traveler";
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return {
    username: `${username}.${suffix}`,
    password: `MNT-${suffix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
  };
}
