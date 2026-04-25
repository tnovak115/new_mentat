# Travel Booking Agent Implementation Plan

## Goal

Evolve the current optimizer-first prototype into a B2B travel booking agent that helps employees book work trips with less back-and-forth, while preserving company policy, approvals, and admin visibility.

This plan assumes the current state of the product is:

- Trip request intake is working
- Mock inventory search is working
- Policy-aware recommendation ranking is working
- Admin visibility into savings and compliance is working
- Actual booking execution does not exist yet

## Product Positioning

The near-term product is not "a new OTA for consumers." It is a B2B work-travel assistant that:

1. Collects trip intent
2. Finds compliant options
3. Routes approvals when needed
4. Lets the traveler confirm the right option
5. Creates and tracks a booking
6. Gives admins a clear audit trail

That framing keeps the roadmap grounded in startup value: reducing friction for business travel, not just showing ranked itineraries.

## Current Gaps

The codebase currently stops at recommendation output. To support "fully booking something for users," the system still needs:

- A booking lifecycle
- A selected-itinerary workflow
- Approval routing for non-compliant trips
- Traveler profile data
- Payment and billing capture
- Provider interfaces for booking, not just searching
- Booking confirmations, failures, changes, and cancellations
- More operational visibility into booking state

## Principles

- Keep provider integrations behind adapters so search and booking can evolve independently.
- Treat policy and approvals as first-class B2B features, not edge cases.
- Build a full workflow with mocked fulfillment before taking on real-ticketing complexity.
- Prefer end-to-end slices over isolated infrastructure work.
- Preserve auditability at each step of the trip lifecycle.

## Target User Flows

### Traveler happy path

1. Employee submits a work trip request.
2. System returns ranked options with compliance context.
3. Employee selects an option.
4. If policy allows auto-booking, the system collects missing traveler details and confirms the booking.
5. The user receives a booking reference and sees the trip in a booked state.

### Traveler with approval path

1. Employee submits a work trip request.
2. Best option is out of policy or over a configured threshold.
3. System creates an approval request.
4. Manager or travel admin approves or rejects.
5. After approval, the traveler confirms and the booking proceeds.

### Admin path

1. Admin configures company travel policy and approval thresholds.
2. Admin reviews pending approvals, failed bookings, and policy exceptions.
3. Admin sees booked-trip metrics, projected savings, and exception trends.

## Delivery Phases

## Phase 1: Booking Workflow Foundation

Objective: convert the app from "recommendation engine" into a bookable workflow, even if the final booking step is still mocked.

### Backend scope

- Add booking lifecycle states to trip requests:
  - `submitted`
  - `options_ready`
  - `pending_approval`
  - `approved`
  - `booking_in_progress`
  - `booked`
  - `booking_failed`
  - `cancelled`
- Introduce a `Booking` model for the confirmed itinerary and booking metadata.
- Introduce a `selected_trip_option_id` or equivalent relationship from trip to chosen option.
- Add service methods to:
  - select a recommendation
  - determine whether approval is required
  - create a booking attempt
  - finalize a mock booking confirmation
- Extend audit logs to record:
  - option selected
  - approval requested
  - approval granted or denied
  - booking started
  - booking succeeded or failed

### API scope

- `POST /api/v1/trips/{trip_id}/select`
- `POST /api/v1/trips/{trip_id}/approve`
- `POST /api/v1/trips/{trip_id}/reject`
- `POST /api/v1/bookings/{booking_id}/confirm`
- `GET /api/v1/bookings/{booking_id}`

### Frontend scope

- Add "Choose this option" on recommendation cards.
- Add a booking confirmation panel after selection.
- Add booking-status UI to trips table and trip detail views.
- Show whether the trip is:
  - ready to book
  - pending approval
  - booked
  - failed

### Acceptance criteria

- A traveler can submit a trip, select one recommendation, and receive a mock booking confirmation number.
- The trip status changes correctly through the booking flow.
- Non-compliant selections are blocked from direct booking and routed to approval.
- Admin views reflect booking state, not just recommendation state.

## Phase 2: B2B Approval And Traveler Data

Objective: make the workflow usable for real work-travel operations.

### Data model additions

- `TravelerProfile`
- `ApprovalRequest`
- `ApprovalDecision`
- `BillingProfile` or `PaymentMethod`
- `CostCenter` or free-form allocation fields

### Traveler profile fields

- legal first and last name
- email
- phone
- date of birth
- passport fields for international travel later
- known traveler number
- frequent flyer numbers
- seat preference
- hotel preference

### Policy additions

- approval threshold amount
- auto-approval rules
- max cabin by trip length or traveler role
- preferred booking window
- allow or block non-preferred carriers with approval
- booking mode rules for rail vs flight

### Workflow additions

- Prompt for missing traveler data before confirmation.
- Route approval automatically based on policy.
- Allow approvers to see rationale and policy flags.
- Allow approval notes and rejection notes.

### Acceptance criteria

- A trip can require approval based on price or policy exception.
- Approvers can approve or reject from the UI.
- Bookings cannot proceed if required traveler profile data is missing.
- Audit logs capture who approved and why.

## Phase 3: Provider Abstraction For Search And Booking

Objective: prepare the system for real integrations without rewriting business logic.

### Refactor provider layer

Split the current provider abstraction into two concerns:

- Search provider:
  - search inventory
  - return normalized itineraries
- Booking provider:
  - create booking
  - confirm booking
  - fetch booking status
  - cancel booking

### Normalized provider contracts

Add shared domain types for:

- `ProviderSearchOption`
- `ProviderPriceQuote`
- `BookingRequest`
- `BookingResult`
- `CancellationResult`

### Implementation steps

- Preserve the current mock provider as the default implementation.
- Add a mock booking provider that returns:
  - confirmation number
  - booking status
  - ticketing deadline
  - provider record locator
- Move provider-specific metadata out of generic trip services where needed.

### Acceptance criteria

- The trip and booking services depend on interfaces rather than the current single mock adapter.
- Mock search and mock booking work through the same contracts the real providers will use.

## Phase 4: Real Fulfillment Strategy

Objective: validate the startup with operationally realistic fulfillment.

### Recommended approach

Use staged fulfillment rather than jumping directly to full direct-ticketing automation.

Recommended order:

1. Real search integration
2. Concierge-assisted or agency-assisted fulfillment
3. Partial automated booking
4. Full direct booking where provider economics and reliability justify it

### Why this order

- It validates customer demand faster.
- It avoids early lock-in to hard booking infrastructure.
- It lets the startup sell "simplified work-trip booking" before it owns every fulfillment edge case.

### Scope options

#### Option A: real search plus human-assisted booking

Best for startup validation when engineering bandwidth is limited.

#### Option B: real search plus one narrow direct-booking rail or lodging integration

Best when a constrained category has easier API support.

#### Option C: full flight booking automation

Highest complexity and should come later.

## Phase 5: Post-Booking Operations

Objective: handle the parts of travel that matter after confirmation.

### Add support for

- cancellations
- changes
- rebooking after policy-approved exceptions
- booking failure recovery
- traveler support notes
- receipt and invoice visibility

### Acceptance criteria

- A booked trip can be cancelled through a tracked workflow.
- Booking failures are visible and retryable by admins.
- The dashboard can distinguish booked, failed, changed, and cancelled trips.

## Technical Work Breakdown

## Backend

### Models

- Add `booking.py`
- Add `approval_request.py`
- Add `traveler_profile.py`
- Update `trip_request.py`
- Potentially update `trip_option.py` to include provider reference identifiers

### Schemas

- Add `schemas/booking.py`
- Add `schemas/approval.py`
- Add `schemas/traveler.py`
- Extend `schemas/trip.py` to include selected option and booking status

### Services

- Add `services/booking_service.py`
- Add `services/approval_service.py`
- Refactor `services/trip_service.py` so trip creation, selection, approval, and booking are separated cleanly

### Routes

- Add `api/routes/bookings.py`
- Add `api/routes/approvals.py`
- Extend `api/routes/trips.py`

### Database

- Add Alembic migrations for each new model and relationship

## Frontend

### New UX areas

- trip detail page
- option selection flow
- booking confirmation flow
- approval inbox
- traveler profile editor

### Existing UI updates

- recommendation card needs selection CTA
- trips table needs richer status display
- admin page needs approval and booking metrics

## Suggested Ticket Order

1. Add booking statuses to the trip model and API responses.
2. Add booking model plus migration.
3. Add recommendation selection endpoint.
4. Add mock booking confirmation endpoint.
5. Add frontend selection and confirmation UI.
6. Add approval request model and policy rules.
7. Add approval endpoints and admin approval UI.
8. Add traveler profile model and required-data checks.
9. Refactor provider interfaces into search and booking contracts.
10. Add one fulfillment strategy beyond mock mode.

## Proposed Milestone Definition

## Milestone 1: Bookable Demo

The product can:

- accept a trip request
- rank options
- let a user select one
- return a mock booking confirmation
- show booking state in the UI

This is the first milestone to demo to customers and investors.

## Milestone 2: B2B Workflow Demo

The product can:

- enforce approval rules
- capture traveler profile details
- track booked vs pending approval trips
- show exception handling in the admin view

This is the first milestone that feels like a real company workflow.

## Milestone 3: Pilot Readiness

The product can:

- search real inventory for at least one category
- create operational booking tasks or limited live bookings
- handle basic failures and cancellations
- support an initial customer pilot

## Risks And Mitigations

### Risk: trying to automate too much too early

Mitigation:

- Ship mocked booking and approval workflows first
- Validate user demand for workflow compression before deep provider work

### Risk: consumer-style UX instead of enterprise workflow UX

Mitigation:

- Prioritize approvals, audit logs, cost controls, and traveler/admin handoffs

### Risk: provider integration complexity stalls the roadmap

Mitigation:

- Define stable internal contracts now
- Keep fulfillment swappable
- Allow concierge fallback

## Definition Of Success

This roadmap is working if the product moves from:

"Here are the best options for your trip."

to:

"Tell us where you need to go, and we will get your compliant work trip booked with minimal effort."

## Immediate Recommendation

The next build sprint should focus on Phase 1 only:

1. booking states
2. booking model
3. option selection flow
4. mock booking confirmation
5. frontend booking UI

That creates the fastest path from recommender to booking agent without taking on premature provider complexity.
