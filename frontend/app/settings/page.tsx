import { AdminControls } from "@/components/admin-controls";
import { DemoResetButton } from "@/components/demo-reset-button";
import { PolicyPanel } from "@/components/policy-panel";
import { Shell } from "@/components/shell";
import { getCompanies, getPolicies } from "@/lib/api";

const settings = [
  ["Workspace name", "Northstar Advisory"],
  ["Default currency", "USD"],
  ["Approval notifications", "Email and workspace queue"],
  ["Optimization mode", "Balanced cost, time, and policy fit"],
];

const integrations = [
  ["SSO", "Not connected"],
  ["HRIS", "Planned"],
  ["Expense platform", "Planned"],
  ["Travel providers", "Provider adapter mode"],
];

export default async function SettingsPage() {
  const [companies, policies] = await Promise.all([getCompanies(), getPolicies()]);
  const policy = policies[0];

  return (
    <Shell>
      <div className="mb-5 border-b border-border pb-5">
        <p className="eyebrow">Settings</p>
        <h2 className="mt-2 text-4xl font-semibold tracking-[-0.02em]">Workspace configuration</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
          Manage workspace defaults, integrations, user roles, and company-level travel policy controls.
        </p>
      </div>

      <section className="grid gap-3 xl:grid-cols-2">
        <SettingsPanel title="General" rows={settings} />
        <SettingsPanel title="Integrations" rows={integrations} />

        <div className="section-card p-4 xl:col-span-2">
          <p className="eyebrow">Policy controls</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">Company travel rules</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-steel">
            Policy configuration lives here, separate from traveler profile management.
          </p>
          {policy ? <div className="mt-4"><PolicyPanel policy={policy} /></div> : null}
          {companies.length > 0 && policy ? (
            <div className="mt-3">
              <AdminControls companies={companies} policy={policy} showCompanySetup={false} />
            </div>
          ) : (
            <div className="mt-4 rounded-md border border-dashed border-border bg-cloud p-4 text-sm text-steel">
              Company setup is handled during sign up. Once a company exists, policy controls appear here.
            </div>
          )}
        </div>

        <div className="section-card p-4">
          <p className="eyebrow">Users</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">Access model</h3>
          <div className="mt-4 space-y-2">
            <Role label="Admin" detail="Can manage trips, travelers, reports, settings, and queue decisions." />
            <Role label="Coordinator" detail="Can create trips and manage booking workflow." />
            <Role label="Finance" detail="Can review reports and savings data." />
          </div>
        </div>

        <div className="section-card p-4">
          <p className="eyebrow">System</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">Prototype state</h3>
          <p className="mt-3 text-sm leading-6 text-steel">
            Trip, queue, policy, booking, and report data are backend-backed. The next production milestone is replacing
            the provider adapter with live inventory and SSO.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a className="btn-secondary" href="/login">Return to login</a>
            <DemoResetButton />
          </div>
        </div>
      </section>
    </Shell>
  );
}

function SettingsPanel({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div className="section-card p-4">
      <p className="eyebrow">{title}</p>
      <div className="mt-4 divide-y divide-border rounded-md border border-border bg-white">
        {rows.map(([label, value]) => (
          <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm" key={label}>
            <span className="text-steel">{label}</span>
            <span className="font-semibold text-ink">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Role({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="rounded-md border border-border bg-white p-3">
      <p className="text-sm font-semibold text-ink">{label}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
    </div>
  );
}
