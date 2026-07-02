import enum
from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String, SmallInteger
from sqlalchemy.orm import relationship

from app.database import Base


class FlightStatus(str, enum.Enum):
    # ── Planning ───────────────────────────────────────────────────────
    SCHEDULED   = "Scheduled"      # Aircraft, crew, and slots confirmed
    # ── Ground / Pre-departure ─────────────────────────────────────────
    BOARDING    = "Boarding"       # Gate open, passengers boarding
    GATE_CLOSED = "Gate Closed"    # Doors shut, ready for pushback
    # ── Air ────────────────────────────────────────────────────────────
    DEPARTED    = "Departed"       # OUT — pushback / chocks off
    AIRBORNE    = "Airborne"       # OFF — wheels up
    EN_ROUTE    = "En Route"       # Cruising
    APPROACH    = "Approach"       # Descending toward destination
    LANDED      = "Landed"         # ON — wheels down
    GATE_ARRIVED = "Gate Arrived"  # IN — chocks on at destination
    # ── Closed ────────────────────────────────────────────────────────
    FINISHED    = "Finished"       # Post-flight complete, records closed
    # ── Exception ─────────────────────────────────────────────────────
    DELAYED     = "Delayed"        # Departure pushed past STD (with delay code)
    DIVERTED    = "Diverted"       # Landing at unplanned airport
    CANCELLED   = "Cancelled"      # Flight will not operate


# Standard IATA delay codes (AHM 730) — stored as text description
IATA_DELAY_CODES: dict[str, str] = {
    # Passenger & Baggage
    "11": "Late check-in (acceptance after deadline)",
    "12": "Late check-in (congestion in check-in area)",
    "13": "Check-in reopened (late passenger)",
    "14": "Oversales (overbooking)",
    "15": "Boarding discrepancy / pax not showing",
    "16": "Commercial publicity / passenger convenience",
    "17": "Catering order late",
    "18": "Baggage reconciliation",
    "19": "Other passenger / baggage handling",
    # Cargo & Mail
    "21": "Documentation, packing defective",
    "22": "Late delivery of freight/mail",
    "23": "Cargo irregularities",
    # Aircraft & Ramp Handling
    "31": "Aircraft cleaning — interior",
    "32": "Aircraft cleaning — exterior (de-icing)",
    "33": "Fuelling / defuelling",
    "34": "Catering — late delivery",
    "35": "Engineering / maintenance late",
    "36": "Baggage loading / offloading",
    "37": "Cargo loading",
    "38": "Cabin equipment (seat, IFE)",
    "39": "Other ramp / aircraft handling",
    # Technical
    "41": "Aircraft defect / technical fault",
    "42": "Aircraft equipment — scheduled maintenance",
    "43": "Non-scheduled maintenance — AOG",
    "44": "Spare parts / awaiting delivery",
    "45": "Aircraft cleaning — required by maintenance",
    "46": "Aircraft change — technical",
    "47": "Standby aircraft — not available",
    "48": "Scheduled maintenance — aircraft",
    "49": "Other technical delay",
    # Flight Operations & Crew
    "61": "Flight plan — late filing or error",
    "62": "Operational requirements — fuel, weight",
    "63": "Late crew boarding or departure prep",
    "64": "Crew late from another service",
    "65": "Crew rest requirements — FTL",
    "66": "Crew shortage — callouts",
    "67": "Crew error",
    "68": "Late crew positioning",
    "69": "Other flight operations / crew delay",
    # Weather
    "71": "Weather — general (below limits)",
    "72": "De-icing ground",
    "73": "Airport snow / ice removal",
    "74": "Departure airport weather — fog",
    "75": "En-route or destination weather",
    "76": "Wind shear",
    "77": "De-icing — aircraft",
    "79": "Other weather delay",
    # ATC / ATFM
    "81": "ATFM (en-route slot restriction)",
    "82": "ATFM (airport acceptance rate)",
    "83": "ATC staffing",
    "84": "ATC equipment",
    "85": "Airspace restriction — military",
    "86": "Airspace restriction — other",
    "87": "Mandatory ground stop",
    "88": "ATC routing / level restriction",
    "89": "ATC departure airport restriction",
    # Reactionary (most common at hubs)
    "91": "Removal of passenger or baggage after boarding",
    "92": "Late load information",
    "93": "Late aircraft from previous rotation",   # ← cascade delay
    "94": "Late crew from previous rotation",
    "95": "Crew rotation — legal rest not completed",
    "96": "Operations control — re-routing",
    "97": "Standby aircraft — late positioning",
    "98": "Other reactionary delay",
    "99": "Other delay not listed",
}


class Flight(Base):
    """A scheduled flight instance operated by a specific aircraft between airports."""

    __tablename__ = "flights"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    flight_number = Column(String(10), unique=True, nullable=False, index=True)
    aircraft_id = Column(Integer, ForeignKey("aircraft.id"), nullable=False)

    origin_airport_id      = Column(String(4), ForeignKey("airports.icao_code"), nullable=False)
    destination_airport_id = Column(String(4), ForeignKey("airports.icao_code"), nullable=False)

    # ── Scheduled times ───────────────────────────────────────────────
    scheduled_departure = Column(DateTime, nullable=False)
    scheduled_arrival   = Column(DateTime, nullable=False)

    # ── OOOI Actual times (industry-standard 4-point model) ───────────
    # OUT  = pushback / chocks off  → Block time starts
    # OFF  = wheels up (takeoff)    → Flight time starts
    # ON   = wheels down (landing)  → Flight time ends
    # IN   = chocks on at stand     → Block time ends
    out_time = Column(DateTime, nullable=True)   # Actual departure from gate
    off_time = Column(DateTime, nullable=True)   # Actual takeoff
    on_time  = Column(DateTime, nullable=True)   # Actual landing
    in_time  = Column(DateTime, nullable=True)   # Actual gate arrival

    # Legacy aliases kept for backwards compatibility with existing CRUD
    actual_departure = Column(DateTime, nullable=True)  # = out_time
    actual_arrival   = Column(DateTime, nullable=True)  # = in_time

    # ── Delay tracking ────────────────────────────────────────────────
    delay_code    = Column(String(2), nullable=True)   # IATA 2-digit delay code
    delay_minutes = Column(SmallInteger, nullable=True) # Calculated delay in minutes

    # ── Post-flight data ──────────────────────────────────────────────
    remaining_fuel = Column(Float, nullable=True)

    status = Column(Enum(FlightStatus), nullable=False, default=FlightStatus.SCHEDULED)
    notes  = Column(String(500), nullable=True)

    # ── Relationships ─────────────────────────────────────────────────
    aircraft          = relationship("Aircraft", back_populates="flights")
    origin_airport    = relationship("Airport", foreign_keys=[origin_airport_id],      back_populates="origin_flights")
    destination_airport = relationship("Airport", foreign_keys=[destination_airport_id], back_populates="destination_flights")
    crew_assignments  = relationship("CrewAssignment", back_populates="flight", cascade="all, delete-orphan")
