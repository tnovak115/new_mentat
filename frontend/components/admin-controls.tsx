"use client";

import { FormEvent, useEffect, useState } from "react";
import { createCompany, createPolicy, getPolicy, updatePolicy } from "@/lib/api";
import { Company, TravelPolicy } from "@/types/api";

type PolicyFormState = {
  budget_limit: number;
  max_hotel_nightly_rate: number;
  preferred_carriers: string;
  allowed_cabin_classes: string;
  rail_enabled: boolean;
  hotel_enabled: boolean;
};

export function AdminControls({
  companies: initialCompanies,
  policy: initialPolicy,
  showCompanySetup = true,
}: {
  companies: Company[];
  policy: TravelPolicy;
  showCompanySetup?: boolean;
}) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [selectedCompanyId, setSelectedCompanyId] = useState(initialPolicy.company_id);
  const [policy, setPolicy] = useState(initialPolicy);
  const [companyName, setCompanyName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [companyPending, setCompanyPending] = useState(false);
  const [policyPending, setPolicyPending] = useState(false);
  const [policyForm, setPolicyForm] = useState<PolicyFormState>({
    budget_limit: initialPolicy.budget_limit,
    max_hotel_nightly_rate: initialPolicy.max_hotel_nightly_rate,
    preferred_carriers: initialPolicy.preferred_carriers.join(", "),
    allowed_cabin_classes: initialPolicy.allowed_cabin_classes.join(", "),
    rail_enabled: initialPolicy.rail_enabled,
    hotel_enabled: initialPolicy.hotel_enabled,
  });

  async function handleCompanySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setCompanyPending(true);
    try {
      const created = await createCompany({ name: companyName });
      setCompanies((current) => [...current, created]);
      setCompanyName("");
      setMessage(`Created company ${created.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create company");
    } finally {
      setCompanyPending(false);
    }
  }

  async function handlePolicySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setPolicyPending(true);
    const payload = {
      budget_limit: policyForm.budget_limit,
      max_hotel_nightly_rate: policyForm.max_hotel_nightly_rate,
      preferred_carriers: split(policyForm.preferred_carriers),
      allowed_cabin_classes: split(policyForm.allowed_cabin_classes),
      rail_enabled: policyForm.rail_enabled,
      hotel_enabled: policyForm.hotel_enabled,
    };

    try {
      const updated = await updatePolicy(selectedCompanyId, payload);
      setPolicy(updated);
      setMessage(`Updated policy for company #${selectedCompanyId}`);
    } catch {
      try {
        const created = await createPolicy({ company_id: selectedCompanyId, ...payload });
        setPolicy(created);
        setMessage(`Created policy for company #${selectedCompanyId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to save policy");
      }
    } finally {
      setPolicyPending(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadPolicy() {
      setMessage(null);
      setError(null);
      try {
        const nextPolicy = await getPolicy(selectedCompanyId);
        if (cancelled) {
          return;
        }
        setPolicy(nextPolicy);
        setPolicyForm({
          budget_limit: nextPolicy.budget_limit,
          max_hotel_nightly_rate: nextPolicy.max_hotel_nightly_rate,
          preferred_carriers: nextPolicy.preferred_carriers.join(", "),
          allowed_cabin_classes: nextPolicy.allowed_cabin_classes.join(", "),
          rail_enabled: nextPolicy.rail_enabled,
          hotel_enabled: nextPolicy.hotel_enabled,
        });
      } catch {
        if (cancelled) {
          return;
        }
        setPolicyForm({
          budget_limit: 1200,
          max_hotel_nightly_rate: 250,
          preferred_carriers: "SkyBridge Air",
          allowed_cabin_classes: "economy, standard",
          rail_enabled: true,
          hotel_enabled: false,
        });
      }
    }

    void loadPolicy();
    return () => {
      cancelled = true;
    };
  }, [selectedCompanyId]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {showCompanySetup ? (
        <form className="section-card p-5" onSubmit={handleCompanySubmit}>
          <p className="eyebrow">Company setup</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">Add a company</h3>
          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-medium text-steel">Company name</span>
            <input className="field" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          </label>
          <button
            className="btn-primary mt-5"
            disabled={companyPending}
            type="submit"
          >
            {companyPending ? "Creating..." : "Create company"}
          </button>
          <p className="mt-4 text-sm text-steel">{companies.length} companies available in this workspace.</p>
        </form>
      ) : null}

      <form className={`section-card p-5 ${showCompanySetup ? "" : "lg:col-span-2"}`} onSubmit={handlePolicySubmit}>
        <p className="eyebrow">Policy controls</p>
        <h3 className="mt-2 text-xl font-semibold tracking-tight">Create or update a policy</h3>

        <div className="mt-5 grid gap-4">
          <label>
            <span className="mb-2 block text-sm font-medium text-steel">Company</span>
            <select className="field" value={selectedCompanyId} onChange={(e) => setSelectedCompanyId(Number(e.target.value))}>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-steel">Budget limit</span>
            <input className="field" type="number" value={policyForm.budget_limit} onChange={(e) => setPolicyForm({ ...policyForm, budget_limit: Number(e.target.value) })} />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-steel">Max hotel nightly rate</span>
            <input className="field" type="number" value={policyForm.max_hotel_nightly_rate} onChange={(e) => setPolicyForm({ ...policyForm, max_hotel_nightly_rate: Number(e.target.value) })} />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-steel">Preferred carriers</span>
            <input className="field" value={policyForm.preferred_carriers} onChange={(e) => setPolicyForm({ ...policyForm, preferred_carriers: e.target.value })} />
          </label>
          <label>
            <span className="mb-2 block text-sm font-medium text-steel">Allowed cabin classes</span>
            <input className="field" value={policyForm.allowed_cabin_classes} onChange={(e) => setPolicyForm({ ...policyForm, allowed_cabin_classes: e.target.value })} />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-steel">
          <label className="flex items-center gap-2">
            <input className="h-4 w-4 rounded border-border text-accent" type="checkbox" checked={policyForm.rail_enabled} onChange={(e) => setPolicyForm({ ...policyForm, rail_enabled: e.target.checked })} />
            Rail enabled
          </label>
          <label className="flex items-center gap-2">
            <input className="h-4 w-4 rounded border-border text-accent" type="checkbox" checked={policyForm.hotel_enabled} onChange={(e) => setPolicyForm({ ...policyForm, hotel_enabled: e.target.checked })} />
            Hotel enabled
          </label>
        </div>

        <button
          className="btn-primary mt-5"
          disabled={policyPending}
          type="submit"
        >
          {policyPending ? "Saving..." : "Save policy"}
        </button>
        <p className="mt-4 text-sm text-steel">
          Current active policy company: {policy.company_id}. Preferred carriers: {policy.preferred_carriers.join(", ")}
        </p>
      </form>

      <div className="text-sm">
        {message ? <p className="text-emerald-700">{message}</p> : null}
        {error ? <p className="text-red-700">{error}</p> : null}
      </div>
    </div>
  );
}

function split(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
