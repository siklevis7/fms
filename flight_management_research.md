# Professional Flight Management Systems — Deep Research Report
*Compiled for FAMS AG | Sources: EASA, FAA, IATA, ICAO, NAVBLUE/Airbus, Jeppesen/Boeing, AIMS, Sabre, SITA, EUROCONTROL*

---

## 1. FLIGHT LIFECYCLE — Complete Status Flow

### OOOI — The Four Sacred Timestamps

The airline industry universally uses the **OOOI** model to record the four critical gate events of every flight. These are the official timestamps from which all time calculations derive.

| Code | Event | Trigger | Used For |
|------|-------|---------|----------|
| **OUT** | Aircraft leaves gate (pushback) | Parking brake released | Block time start, FDP start |
| **OFF** | Wheels leave runway (takeoff) | Weight off wheels | Flight time start, pilot logbook |
| **ON** | Wheels touch runway (landing) | Weight on wheels | Flight time end |
| **IN** | Aircraft arrives at stand (chocks) | Parking brake set at destination gate | Block time end, FDP end |

**Block Time** = OUT → IN (used for crew pay, scheduling, billing)  
**Flight Time** = OFF → ON (used for pilot logbooks, maintenance cycles)  
**Turnaround Time** = IN (arrival) → OUT (next departure) on same tail number

### Complete Flight Status Chain

```
PLANNED → SCHEDULED → CHECK-IN OPEN → CHECK-IN CLOSED
    → BOARDING → GATE CLOSED
    → DEPARTED (OUT) → AIRBORNE (OFF) → EN-ROUTE → APPROACH
    → LANDED (ON) → GATE ARRIVED (IN) → COMPLETED
```

Exception / irregular statuses (can apply at any active point):
```
DELAYED | DIVERTED | CANCELLED | RETURN TO RAMP | AIR TURN BACK
```

### What Triggers Each Status

| Status | Trigger | Set By |
|--------|---------|--------|
| **Planned** | Flight added to seasonal schedule | Scheduling dept |
| **Scheduled** | Crew, aircraft, slots confirmed | Operations planner |
| **Check-in Open** | T-24h to T-2h before departure | DCS auto-trigger |
| **Check-in Closed** | T-45 min before STD | DCS auto-trigger |
| **Boarding** | Gate opens, boarding call issued | Gate agent |
| **Gate Closed** | All passengers on, door shut | Ground handler |
| **Departed / OUT** | Pushback — brake released | ACARS auto / Ground handler → OCC |
| **Airborne / OFF** | Wheels up — takeoff | ACARS auto / ATC |
| **En-Route** | Cruise altitude reached | Position-derived |
| **Approach** | Descent begun | Position-derived |
| **Landed / ON** | Wheels touch down | ACARS auto / ATC |
| **Gate Arrived / IN** | Parking brake set at stand | ACARS auto / Ground handler → OCC |
| **Completed** | Post-flight tech log, fuel, times closed | Crew + dispatcher |
| **Delayed** | Departure pushed past STD | OCC with IATA delay code |
| **Diverted** | Aircraft landing at unplanned airport | PIC declaration / OCC |
| **Cancelled** | Flight will not operate | OCC / network control |
| **Return to Ramp** | Aircraft back to gate after pushback | OCC — mechanical or security |
| **Air Turn Back** | Aircraft returns to origin after takeoff | PIC — emergency or major defect |

### Key Time Terminology

| Term | Definition |
|------|-----------|
| **STD / STA** | Scheduled Time of Departure / Arrival (the original plan) |
| **ETD / ETA** | Estimated Time — dynamic, updates during operations |
| **ATD / ATA** | Actual Time — recorded post-event |
| **EOBT** | Estimated Off-Block Time — when airline predicts pushback |
| **Block Time** | OUT→IN; the "flight duration" for scheduling and pay |
| **Flight Time** | OFF→ON; airborne-only time for logbooks and maintenance |
| **Duty Time** | Crew member report time → release from all duties |
| **FDP** | Flight Duty Period — from report for flight to last engine shutdown |
| **Turnaround Time** | IN (one flight) → OUT (next flight) for same aircraft |
| **Ground Time** | Any time aircraft is on the ground (includes overnight, maintenance) |

---

## 2. OPERATIONS CONTROL CENTRE (OCC)

The OCC (also called IOC — Integrated Operations Centre, or FOC — Flight Operations Centre) is the **24/7 nerve centre of every airline**. All operational decisions route through it.

### Roles in the OCC

| Role | Core Responsibility |
|------|-------------------|
| **Flight Dispatcher / FOO** | Creates Operational Flight Plan (OFP), fuel calc, flight release, in-flight monitoring. Shares **joint legal authority** with PIC (FAA Part 121) |
| **Crew Controller** | Real-time crew duty tracking, sick call management, standby callouts, legality validation |
| **Maintenance Controller (MOC)** | Aircraft technical status, MEL items, AOG coordination with Part-145 MRO |
| **Hub / Station Controller** | Gate coordination, ground handling liaison, turnaround oversight |
| **Network Controller / Duty Manager** | Fleet-wide IROPS management, aircraft swaps, big-picture decisions |

### What the OCC Monitors in Real Time

- **Aircraft position** — ACARS, ADS-B, ATC radar
- **Fuel state** — actual vs. planned burn
- **ETA updates** — at destination, alternates, diversion airports
- **Live weather** — METARs, TAFs, SIGMETs, PIREPs at all route points
- **ATFM / slot restrictions** — EUROCONTROL CFMU (Europe), FAA TFMS (USA)
- **Active NOTAMs** — runway closures, navaid outages, airspace restrictions
- **Crew FDP counters** — who is approaching their legal limit right now
- **Aircraft technical status** — open MEL items, deferred defects

### IATA Delay Codes (AHM 730 Standard)

Every delay must be assigned a 2-digit code for root-cause analysis and industry reporting:

| Range | Category |
|-------|---------|
| 11–19 | Passenger & Baggage (late check-in, boarding issues) |
| 21–26 | Cargo & Mail |
| 31–39 | Aircraft & Ramp Handling (fuelling, catering, cleaning delay) |
| 41–49 | Technical & Aircraft Equipment (defect, MEL item, AOG) |
| 61–69 | Flight Operations & Crew (late crew, documentation) |
| 71–79 | Weather (de-icing, fog, low visibility) |
| 81–89 | ATC / ATFM (slot, en-route restriction) |
| **91–99** | **Reactionary** — delay caused by previous delayed inbound flight |

> Code **93** = "late aircraft from previous rotation" — the cascade/knock-on code. The most common at busy hubs.

---

## 3. CREW MANAGEMENT — How It Works Professionally

### The Three-Phase Process

**Phase 1 — Crew Pairing (Trip Construction) — Months Ahead**
- A "pairing" is a multi-day sequence of flights starting and ending at the same crew base
- Automated algorithms (Jeppesen, IBS, AIMS) generate thousands of legal pairings
- Each pairing validated against FTL before it's ever offered to a crew member
- Objective: minimize deadhead positioning, maximize daily utilization

**Phase 2 — Crew Rostering — 4-6 Weeks Ahead**
- Pairings + ground duties (training, standby, leave, days off) assembled into monthly rosters
- **PBS (Preferential Bidding System):** crew submit ranked preferences, system assigns by seniority
- System validates: qualifications, base, leave, training windows, FTL compliance
- Final roster published typically 3-4 weeks before the operating month

**Phase 3 — Day-of-Operations — Real Time**
- Crew controllers manage live roster deviations
- Sick calls → pull from standby/reserve pool
- Delays → re-calculate FDP for all affected crew
- If crew goes illegal → find replacement from standby
- All changes logged with timestamps for audit

### Pre-Assignment Validation (Every Assignment Must Pass ALL Checks)

Before confirming any crew assignment, professional systems validate:

1. License valid (ATPL/CPL current)
2. Medical certificate valid (Class 1 not expired)
3. Aircraft type rating current
4. LPC current (licence proficiency check)
5. OPC current (operator proficiency check — every 6 months)
6. FDP legal — duty won't exceed daily limits
7. Rest compliant — sufficient rest since last duty
8. Currency — minimum sectors flown in last 90 days ("recency")
9. CRM training not overdue
10. SEP/emergency training not overdue
11. Dangerous goods training not overdue

Any single failure = **automatic block**. Cannot be overridden without formal waiver.

---

## 4. EASA & FAA REGULATORY LIMITS

### Pilot FTL — EASA (ORO.FTL, Regulation EU 965/2012)

| Parameter | Limit |
|-----------|-------|
| Max flight time / 28 consecutive days | **100 hours** |
| Max flight time / 12 calendar months | **900 hours** |
| Max duty time / 7 consecutive days | **60 hours** |
| Max duty time / 14 consecutive days | **110 hours** |
| Max duty time / 28 consecutive days | **190 hours** |
| Max FDP — 1–2 sectors, 06:00–13:59 report | **13 hours** |
| Max FDP — WOCL encroachment (02:00–05:59) | reduced (min 9h in most cases) |
| Commander's Discretion extension | **+2 hours** max (unforeseen) |
| Min rest at home base | **12h** or length of preceding duty (whichever greater) |
| Min rest away from base | **10h** or length of preceding duty (whichever greater) |
| Min sleep opportunity within rest | **8 hours uninterrupted** |
| Recurrent extended recovery rest | **36h** (incl. 2 local nights) every **7 days** |

**Augmented Crew FDP Extensions (in-flight rest with relief pilot):**

| Rest Facility | Max FDP |
|--------------|---------|
| Class 1 — flat bunk, isolated from cabin | **17 hours** |
| Class 2 — seat ≥45° recline, leg/foot rest | **15–16 hours** |
| Class 3 — seat ≥40° recline, reduced disturbance | **13–14 hours** |

### Pilot FTL — FAA Part 117

| Parameter | Limit |
|-----------|-------|
| Max flight time / 365 consecutive days | **1,000 hours** |
| Max FDP hours / 7 days (168h) | **60 hours** |
| Max FDP hours / 28 days (672h) | **190 hours** |
| Max FDP — 0500–1359 start, 1–3 segments | **14 hours** |
| Min pre-duty rest | **10 consecutive hours** (incl. 8h sleep opportunity) |
| Weekly rest | **30 consecutive hours** within any 168-hour window |

### Medical Certificate Validity (EASA Class 1)

| Age | Validity |
|-----|---------|
| Under 40 | **12 months** |
| 40–50 | **12 months** |
| Over 50 | **6 months** |

### Proficiency Checks (EASA)

| Check | Frequency | Notes |
|-------|----------|-------|
| **LPC** — Licence Proficiency Check | Every **12 months** | Revalidates type rating |
| **OPC** — Operator Proficiency Check | Every **6 months** | Operator-specific simulator check |
| **Line Check** | Every **12 months** | In actual line operations with examiner |

### Minimum Crew Complement (EASA ORO.CC.100)

**Cockpit:** Minimum 2 pilots (Captain + First Officer) on all commercial transport aircraft.

**Cabin crew — the 1-per-50 rule:**
> Minimum = greatest of: (a) aircraft certification number, or (b) 1 crew per 50 **installed seats** (rounded up)

Example: 189-seat Boeing 737 MAX → ⌈189/50⌉ = **4 cabin crew minimum** — even if only 20 passengers on board.

---

## 5. CERTIFICATION TRACKING — Per Role

### Pilots (Commercial Air Transport)

| Document | Validity | Consequence if Expired |
|---------|---------|----------------------|
| ATPL License | Indefinite (privileges lapse without valid medical) | Cannot act as PIC on multi-crew aircraft |
| Class 1 Medical | 12 months (<50 yrs) / **6 months (>50 yrs)** | License privileges suspended — cannot fly commercially |
| Aircraft Type Rating | **12 months** | Cannot fly that aircraft type |
| LPC (Licence Proficiency Check) | **12 months** | Type rating lapses |
| OPC (Operator Proficiency Check) | **6 months** | Cannot operate commercially on type |
| Line Check | **12 months** | Cannot act as PIC in line operations |
| CRM Training | **12 months** | Cannot be rostered |
| Emergency & Safety Training | **12 months** | Cannot be rostered |
| Dangerous Goods (DG) Awareness | **24 months** | Cannot be rostered |

### Cabin Crew

| Document | Validity | Consequence if Expired |
|---------|---------|----------------------|
| Cabin Crew Attestation (CCA) | Indefinite (lapses after **60 months** inactive) | Cannot work as cabin crew |
| SEP Recurrent Training | **12 calendar months** | Cannot be rostered |
| Aircraft Type Familiarization | Per fleet change | Cannot operate on that aircraft type |
| First Aid Recurrent | **12–24 months** | Cannot be rostered |
| CRM Training | **12 months** | Cannot be rostered |
| Dangerous Goods (DG) | **24 months** | Cannot be rostered |

### Maintenance Engineers (EASA Part-66)

| Category | Scope |
|---------|-------|
| **A1** | Line maintenance — turbine aeroplanes |
| **B1.1** | Certifying technician — turbine aeroplanes (structure, powerplant, mechanical) |
| **B2** | Avionics technician |
| **C** | Base maintenance — signs off major checks |

Type endorsements (e.g., A320, B737) are added to the licence after type training. No fixed renewal — stays valid while licence is current. Continuation training required every 2 years.

### How Professional Systems Handle Expiry

| Timeline | Action |
|---------|--------|
| T-90 days | Warning flag on compliance dashboard, notify crew and training dept |
| T-30 days | Critical warning, highlighted red in roster view |
| T-7 days | Urgent alert sent to crew and line manager |
| **T-0 (expiry)** | **System automatically blocks crew from ALL new assignments** |
| Post-expiry | Crew cannot be rostered until certificate renewed and re-entered |

---

## 6. AIRCRAFT ROTATION & TURNAROUND

### What Is a Rotation?

A rotation is the **planned sequence of flight legs assigned to a specific tail number** over a period (usually 1 day, sometimes multi-day). It starts and ends at the same location — usually a maintenance hub.

**Planning cascade:**
```
1. Schedule Design   → Which routes, frequencies, times?
2. Fleet Assignment  → Which aircraft TYPE per route?
3. Aircraft Routing  → Which SEQUENCE of legs per type?
4. Tail Assignment   → Which specific registration (N737FA) per rotation?
5. Crew Scheduling   → Who flies each rotation? (built on top)
```

### Turnaround Activities & Times

| Activity | Typical Duration |
|---------|----------------|
| Passenger deboarding | 10–20 min |
| Cabin cleaning | 10–15 min |
| Catering uplift | 10–20 min |
| Fuelling | 15–30 min |
| Baggage offload | 10–20 min |
| Baggage/cargo load | 15–25 min |
| Passenger boarding | 20–30 min |
| Door close, pushback prep | 5–10 min |

| Carrier Type | Minimum Turnaround |
|-------------|------------------|
| Low-Cost Carrier (Ryanair, easyJet) | **20–25 min** |
| Short-haul Network Carrier | **35–45 min** |
| Narrow-body long-haul | **60–90 min** |
| Wide-body international | **90–120 min** |

### Aircraft Maintenance Schedule Types

| Check | Interval | Duration |
|-------|---------|---------|
| **Daily/Transit Check** | Every flight day or turnaround | 30–60 min |
| **A-Check** | ~400–600 flight hours (~8 weeks) | 6–10 hours |
| **C-Check** | ~18–24 months | 2–6 weeks (heavy maintenance) |
| **D-Check / Full Overhaul** | ~6–12 years | 2–3 months |

The rotation must bring the aircraft to a **Part-145 maintenance-capable station** when checks are due.

### AOG (Aircraft on Ground)

AOG = aircraft grounded due to technical defect. Highest-priority status in the entire operation.

When AOG occurs:
1. Maintenance Controller notifies OCC immediately
2. Network Controller assesses impact on all flights using that tail
3. Options evaluated: aircraft swap, cancel flight, wet-lease, wait for repair
4. Part-145 MRO contacted for parts and technicians
5. Every hour of AOG time = direct cost + passenger compensation exposure

---

## 7. DISRUPTION MANAGEMENT (IROPS)

### Types of Disruptions

| Type | Trigger | OCC Response |
|------|---------|-------------|
| **Technical / MEL** | Defect found pre-flight | Check MEL → dispatch if deferrable, else AOG + swap |
| **Weather** | Fog, storm, icing | Delay, divert, or cancel |
| **ATC / CTOT Slot** | EUROCONTROL issues new slot | Hold at gate until slot window |
| **Crew Sick Call** | Pilot/crew calls sick | Pull from standby pool; check FDP of replacement |
| **Crew Goes Illegal** | Delay pushes crew over FDP | Replace crew; may cancel if no replacement |
| **Diversion** | Weather, medical, security | Co-ordinate ground handling at diversion airport, hotel, crew rest, re-departure slot |
| **AOG** | Major tech failure | Aircraft swap or cancellation cascade |
| **Cascading Delay** | Late inbound = late outbound | Network controller manages downstream impact |

### NOTAMs

NOTAMs (Notices to Air Missions) = official notices of aviation hazards, outages, or changes:
- Runway/taxiway closures
- Navigation aid outages (ILS, VOR unserviceable)
- Temporary restricted airspace (TFRs)
- Obstacle notifications near airports
- Procedural changes (modified approach procedures)

Dispatchers must check NOTAMs for: departure airport, en-route, destination, all alternates — for **every flight**.

---

## 8. CREW BRIEFING — THE OPS PACK

Before every flight, crew receive an **Ops Pack** (now typically delivered via Electronic Flight Bag / EFB tablet):

### Flight Deck (Pilots) Receive:

| Document | Content |
|---------|---------|
| **Operational Flight Plan (OFP)** | Route, waypoints, altitudes, fuel breakdown (trip + contingency + alternate + final reserve + taxi), W&B summary, cost index |
| **Weather Package** | METARs, TAFs at departure/destination/alternates; SIGMETs, wind/icing/turbulence charts |
| **NOTAMs** | Filtered and formatted for all relevant airports and en-route |
| **Aircraft Technical Status** | Open MEL items, recent tech log entries, operational limitations |
| **Performance Data** | V-speeds, flex temp, takeoff/landing performance, obstacle analysis |
| **Crew List** | Names, positions, base, qualifications |
| **Passenger Load** | Total count, class breakdown, special passengers (WCHR, UM, medical) |
| **Cargo Manifest Summary** | Weight, DG items |

### Cabin Crew Receive:
- Flight details (number, route, estimated block time)
- Passenger count and special passenger list
- Emergency equipment checks for the day
- "Procedure of the Day" (safety focus topic)
- Catering and service briefing

### The Captain's Pre-Flight Briefing

Before departure, the Captain briefs all crew:
- Weather overview and route highlights (turbulence, duration)
- Aircraft status — any MEL items affecting the cabin or procedures
- Passenger load and special passengers
- Security situation (if applicable)
- Emergency procedure reminders specific to the route/airport

---

## 9. HOW THE MODULES INTERACT

### The Integration Chain

```
Flight Schedule (routes, frequencies, aircraft types)
        ↓
Aircraft Rotation System (tail assignment, sequences)
        ↓                         ↓
Maintenance System           Crew Management System
(airworthiness,             (pairing, rostering,
 MEL status, AOG)            FTL validation)
        ↓                         ↓
        └────────────┬────────────┘
                     ↓
            OCC — Operations Control Centre
            (dispatch, monitoring, IROPS)
                     ↓                    ↓
            Airport Systems          Passenger Systems
            (AODB, gates, GMS,       (DCS, check-in,
             A-CDM, FIDS)             rebooking)
                     ↓
            Flight Data System
            (OOOI times, fuel actuals,
             tech log entries)
                     ↓
            Payroll / HR System
            (block hours, duty pay,
             expense claims)
```

### Critical Interdependencies

| Interaction | What It Means in Practice |
|------------|--------------------------|
| **Flight ↔ Aircraft** | Aircraft cannot be assigned if maintenance status = AOG or MEL item prohibits that operation |
| **Flight ↔ Crew** | Crew member blocked if any certification expired OR duty limits would be exceeded |
| **Crew ↔ Documents** | Every assignment triggers real-time check of ALL document expiry dates |
| **Actual Times ↔ Hours** | OOOI times from completed flights automatically update pilot logbook totals and FTL compliance counters |
| **Delay ↔ Crew Legality** | Any change in departure time re-evaluates every crew member's remaining FDP |
| **Maintenance ↔ Schedule** | Aircraft maintenance window forces routing to bring tail to Part-145 facility on time |
| **IROPS ↔ Crew** | Disruption scenario triggers ripple across roster: replacement crew must satisfy ALL 11 validation checks before confirmed |

---

## 10. PROFESSIONAL SYSTEMS

| System | Company | Strengths |
|--------|---------|----------|
| **AIMS** | AIMS Airline Software | Highly modular; strong training/qualification tracking; eCrew mobile app |
| **Jeppesen Crew** | Boeing | Best-in-class optimisation; claims 3–15% crew cost reduction; FRMS integration |
| **Sabre AirCentre** | Sabre | Real-time "what-if" IROPS modelling; global distribution integration |
| **NAVBLUE / N-OC** | Airbus | Deep Airbus integration; ETOPS planning; Skywise data platform |
| **SITA** | SITA (airline-owned co-op) | 95% of world's airlines use SITA services; ubiquitous in airport comms |
| **IBS iFlight** | IBS Software | Strong MRO-operations integration; used widely by Middle East carriers |
| **AMOS** | Swiss-AS | Leading aircraft M&E (maintenance & engineering) system in Europe |

---

## 11. KEY INDUSTRY TERMINOLOGY GLOSSARY

| Term | Definition |
|------|-----------|
| **ACARS** | Aircraft Communications Addressing and Reporting System — digital datalink sending OOOI times, position, fuel, etc. |
| **ADS-B** | Automatic Dependent Surveillance–Broadcast — GPS-based position broadcast, basis of modern flight tracking |
| **A-CDM** | Airport Collaborative Decision Making — shared data platform to optimise turnaround and departure sequencing |
| **AODB** | Airport Operational Database — central real-time database at an airport feeding FIDS and gate management |
| **AOC** | Air Operator Certificate — authority from NAA permitting commercial air transport operations |
| **AOG** | Aircraft on Ground — aircraft grounded for technical reasons; highest maintenance priority |
| **ATPL** | Airline Transport Pilot Licence — required for Captain of commercial aircraft |
| **Block Time** | OUT→IN; gate-to-gate time used for scheduling, pay, and billing |
| **CDL** | Configuration Deviation List — structural equivalent of MEL (missing access panels etc.) |
| **Cost Index (CI)** | 0–999 parameter balancing fuel vs. time in flight planning. CI=0 = max fuel saving; CI=999 = maximum speed |
| **CRM** | Crew Resource Management — training on teamwork, communication, and decision-making |
| **Deadhead** | Crew travelling as passenger (not operating) to position for a future assignment. Counts as duty time |
| **EFB** | Electronic Flight Bag — tablet device for digital ops pack, charts, performance calculations |
| **ETOPS/EDTO** | Extended range Twin-engine Operations — allows twin-engine aircraft on routes >60 min from a diversion airport |
| **FDP** | Flight Duty Period — legally tracked time from report for flight to last engine shutdown |
| **FIDS** | Flight Information Display System — departure/arrival boards at airports |
| **Flight Time** | OFF→ON; airborne-only time for pilot logbooks and maintenance tracking |
| **FRMS** | Fatigue Risk Management System — science-based alternative to prescriptive FTL limits |
| **IROPS** | Irregular Operations — any deviation from planned schedule |
| **LPC** | Licence Proficiency Check — annual simulator check to revalidate type rating |
| **MEL** | Minimum Equipment List — specifies which equipment may be inoperative and still allow legal dispatch |
| **METAR** | Meteorological Aerodrome Report — standardised hourly weather observation |
| **MMEL** | Master MEL — issued by aircraft manufacturer; airlines derive their MEL from this |
| **NOTAM** | Notice to Air Missions — official notice of hazards, outages, or procedural changes |
| **OFP** | Operational Flight Plan — detailed pre-departure document (route, fuel, weather, W&B) |
| **OOOI** | Out, Off, On, In — the four key timestamps of every flight |
| **OPC** | Operator Proficiency Check — 6-monthly simulator check required by operator |
| **Pairing** | Sequence of flights forming a crew trip, starting and ending at home base (1–5 days) |
| **PBS** | Preferential Bidding System — crew submit preferences, system assigns by seniority |
| **Reserve / Standby** | On-call crew status. Airport standby = must be at airport. Short-call = report within 2h |
| **Rostering** | Assigning pairings, standby, training, and days off to individual crew for a month |
| **SEP** | Safety & Emergency Procedures — annual cabin crew training covering evacuation, fire, first aid |
| **SIGMET** | Significant Meteorological Information — warning of hazardous en-route weather |
| **SID / STAR** | Standard Instrument Departure / Standard Terminal Arrival Route |
| **TAF** | Terminal Aerodrome Forecast — 9–30 hour weather forecast for an airport |
| **Turnaround Time** | Time from aircraft IN blocks (arrival) to OUT blocks (next departure) |
| **WOCL** | Window of Circadian Low — 02:00–05:59 local time; period of peak human fatigue; triggers stricter FTL rules |

---

## 12. GAP ANALYSIS — What FAMS is Missing vs. Professional Standard

### High Priority

| Feature | Current FAMS | Professional Standard |
|---------|-------------|----------------------|
| **Full OOOI time recording** | Single actual dep/arr | 4 separate timestamps: OUT, OFF, ON, IN |
| **Certification expiry warnings** | Stored but no alerts | 90/30/7-day warnings + auto-block on expiry |
| **FDP / duty time tracking** | Only total hours | Real-time per-crew FDP counter + rolling 28/7-day totals vs. EASA limits |
| **Crew legality gate on assignment** | Basic presence check | 11-rule validation before any assignment confirmed |
| **IATA delay code capture** | No delay codes | Required on every delayed/disrupted flight |
| **Aircraft minimum turnaround check** | No validation | System warns/blocks if gap between flights too short |
| **Completed flight status** | Manual only | OOOI times auto-trigger status transitions |
| **Aircraft maintenance flag** | Status field only | MEL tracking blocks scheduling when item prohibits operation |

### Medium Priority

| Feature | Notes |
|---------|-------|
| Compliance dashboard | All expiring docs across all crew, next 90 days, sortable by criticality |
| Standby crew pool | Mark crew as "On Standby" — OCC sees live availability |
| FDP projection on assignment screen | Show crew member's projected FDP before confirming |
| Crew recency tracking | Sectors flown in last 90 days; warn if below currency threshold |
| Logbook auto-population | Completed flights auto-update pilot's flight time totals |
| Augmented crew support | 3rd/4th pilot recording and extended FDP calculations |

### Nice to Have (Future)

- ACARS-style live flight tracking integration
- Automatic weather/NOTAM display for planned flights
- Passenger count and manifest tracking
- Fuel planning and actual vs. planned fuel reporting
- Crew mobile self-service (view roster, report sick, upload documents)
- IROPS workflow — aircraft swap and crew swap guided workflows with validation

---

## 13. RECOMMENDED IMMEDIATE IMPROVEMENTS FOR FAMS

Based on all research, the **10 highest-impact changes** to implement:

1. **OOOI Recording** — Split actual times into OUT/OFF/ON/IN. Block time = OUT→IN. Flight time = OFF→ON. Both auto-update crew hours.

2. **Document Expiry Dashboard** — Admin page showing all expiring documents (all crew) in the next 90 days, coloured by urgency. Click to see who, what, and when.

3. **Auto-block on Expiry** — When assigning crew to a flight, system checks all 9+ document types. Any expiry = cannot assign. Show which document is the blocker.

4. **Rolling FTL Counters** — On each crew profile, show: flight hours (last 7d / last 28d / last 12 months) vs. EASA limits (60h / 100h / 900h). Colour-code when approaching limit.

5. **IATA Delay Code Field** — When a flight departs late, require dispatcher to select from IATA delay code list. Store with flight record.

6. **Minimum Turnaround Validation** — When scheduling a flight for an aircraft, check if the gap from previous IN to this OUT is ≥ configurable minimum (e.g. 30 min). Warn admin if too short.

7. **Aircraft Maintenance Status** — Add "Under Maintenance" / "MEL Item" flags to aircraft. Prevent scheduling while flagged.

8. **Full Flight Status Lifecycle** — Implement the complete status chain (Planned → Scheduled → Boarding → Departed → Airborne → Landed → Gate Arrived → Completed) with role-based permissions on each transition.

9. **Minimum Crew Complement Check** — Before a flight can be marked "Ready to depart", system validates: ≥2 pilots assigned, ≥⌈seats/50⌉ cabin crew assigned.

10. **Standby Crew Designation** — Allow marking crew as "Standby" for a shift. OCC view shows all active standbys, their FDP status, and base location.
