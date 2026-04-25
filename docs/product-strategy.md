# Product Strategy

## Product Definition

The product is an AI travel operations assistant for work trips.

It combines three product faces:

- a self-serve employee booking assistant
- an internal travel operations tool
- an AI concierge that reduces coordination overhead

The product should help companies hand off trip planning to an AI assistant, get work trips booked quickly, and centralize business travel workflows in one place.

## Target Customers

The near-term target is companies that are closer to:

- SMB businesses
- smaller mid-market teams
- office managers, executive assistants, and operations teams

Over time, the product can expose different experiences by company size:

- SMB version: simpler setup and faster self-serve booking
- Mid-market version: stronger approvals, controls, and admin visibility
- Enterprise version later: SSO, RBAC, deeper policy logic, and more advanced reporting

The near-term product should remain one core system rather than branching into separate products too early.

## Core Promise

When an employee needs to travel for work, the product should:

- hand off trip planning to an AI assistant
- get the trip booked quickly
- centralize business travel operations

This means the product should reduce the amount of coordination happening in email, chat, and spreadsheets.

## Product Positioning

The product is not primarily:

- a consumer OTA
- a generic trip optimizer
- only an admin dashboard

It is primarily:

- an AI travel operations assistant for work trips

That positioning should guide roadmap and UX decisions. The value is not just "show me options." The value is "help me get this work trip handled with minimal effort and policy friction."

## Booking Strategy

### Long-term differentiator

The long-term differentiator is direct automated booking.

That should remain a strategic goal because it can make the product meaningfully different from tools that only recommend or prepare itineraries.

### Near-term operating strategy

The near-term strategy should aim for:

- partially assisted fulfillment where needed
- real booking preparation
- eventual direct automation where the integration path is ready

In practice, that means the product can support two modes over time:

1. prepare everything and automate booking directly
2. prepare everything and hand off final fulfillment when direct booking is not yet available

For the near-term roadmap, the product should optimize for mode `2` while preserving a clear path to mode `1`.

## MVP Scope

The MVP should include:

- flight and rail search
- policy compliance
- approvals
- trip selection
- traveler profile capture
- booking confirmation flow
- admin dashboard
- audit trail

The MVP should not yet expand into every adjacent problem.

## Next Milestone

The next milestone is:

## Bookable B2B Demo

This milestone should prove that the product can:

- accept a work-trip request
- return ranked compliant options
- let the employee select an itinerary
- route exceptions to approval
- confirm a booking
- show admins booked, pending, and exception states

This is the right milestone for demos, customer conversations, and early design-partner validation.

## Immediate Product Priorities

The next product priorities should be:

1. traveler profiles
2. dedicated trip detail experience
3. approval model with approver identity and notes
4. assisted-fulfillment path toward live operations

These priorities strengthen the core workflow before the product expands into broader travel categories.

## Roadmap Phases

## Phase A: Bookable B2B Demo

Focus:

- trip request intake
- recommendations
- option selection
- approvals
- traveler profiles
- booking confirmation
- admin visibility

Outcome:

- a coherent end-to-end work-trip booking demo

## Phase B: Real Operations Readiness

Focus:

- better trip detail views
- stronger approval records
- better booking states
- real search integration or realistic provider preparation
- assisted-fulfillment workflow

Outcome:

- something a design partner or pilot customer could realistically evaluate

## Phase C: Broader Travel Platform

Focus:

- hotel booking
- multi-employee trip coordination
- cancellation and change handling
- traveler-facing trip brief or companion experience

Outcome:

- a broader travel-operations product beyond the single-traveler core loop

## Deferred But Important Product Areas

These are good roadmap directions, but they should follow the core bookable-demo milestone:

- hotel booking
- coordination between multiple employees
- automatic flight and hotel cancellation support
- traveler document or trip brief with reminders and important information
- a separate traveler companion app if that proves necessary later

These are strategically valuable, but building them too early risks diluting the core booking workflow before it is proven.

## Product Principles

- Prefer workflow completion over feature count.
- Keep the employee experience self-serve whenever possible.
- Preserve admin and policy controls for B2B credibility.
- Reduce coordination overhead at every step.
- Build toward direct booking without forcing full automation too early.

## Success Criteria

The strategy is working if the product moves from:

"Here are your best travel options."

to:

"Tell us about your work trip, and we will get it handled quickly with the right approvals, traveler data, and booking flow."
