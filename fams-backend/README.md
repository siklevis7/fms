# FAMS – Flight Management System Backend

A production-ready REST API for managing flights, airports, aircraft fleets, routes, and passenger bookings, built with **Python + FastAPI + SQLAlchemy + SQLite**.

---

## ✨ Features

| Module          | Capabilities |
|-----------------|--------------|
| **Airports**    | CRUD, IATA/ICAO codes, geographic coordinates |
| **Aircraft**    | Fleet management, capacity, operational status |
| **Routes**      | Origin/destination linking, distance & duration |
| **Flights**     | Scheduling, status tracking, live seat availability |
| **Bookings**    | Seat assignment, passenger lookup, cancellation |

---

## 🚀 Quick Start

### 1. Prerequisites

- Python 3.10+
- `pip`

### 2. Install dependencies

```bash
cd fams-backend
pip install -r requirements.txt
```

### 3. Run the server

```bash
uvicorn app.main:app --reload
```

The API will be available at **http://127.0.0.1:8000**

### 4. Explore the interactive API docs

Open your browser and navigate to:

- **Swagger UI** → http://127.0.0.1:8000/docs
- **ReDoc**       → http://127.0.0.1:8000/redoc

### 5. Seed mock data (optional)

```bash
python seed_data.py
```

This loads **8 airports**, **5 aircraft**, **8 routes**, **6 flights**, and **6 bookings** into the local SQLite database.

---

## 🧪 Running Tests

```bash
pytest tests/ -v
```

Tests run against an **in-memory SQLite database** and are completely isolated from the development database.

---

## 📁 Project Structure

```
fams-backend/
├── app/
│   ├── main.py          # FastAPI app, middleware, router registration
│   ├── config.py        # Environment configuration (pydantic-settings)
│   ├── database.py      # SQLAlchemy engine, session, Base, get_db()
│   ├── models/          # ORM models (Airport, Aircraft, Route, Flight, Booking)
│   ├── schemas/         # Pydantic v2 request/response schemas
│   ├── crud/            # Database access layer (CRUD operations)
│   └── routers/         # FastAPI APIRouter endpoint definitions
├── tests/
│   ├── conftest.py      # pytest fixtures (in-memory DB, TestClient)
│   ├── test_airports.py
│   ├── test_flights.py
│   └── test_bookings.py
├── seed_data.py         # Mock data population script
└── requirements.txt
```

---

## 📡 API Endpoints

All endpoints are prefixed with `/api/v1`.

### Airports
| Method   | Path                    | Description             |
|----------|-------------------------|-------------------------|
| `GET`    | `/airports/`            | List all airports       |
| `GET`    | `/airports/{iata_code}` | Get airport by IATA     |
| `POST`   | `/airports/`            | Create airport          |
| `PATCH`  | `/airports/{iata_code}` | Update airport          |
| `DELETE` | `/airports/{iata_code}` | Delete airport          |

### Aircraft
| Method   | Path                 | Description              |
|----------|----------------------|--------------------------|
| `GET`    | `/aircraft/`         | List fleet               |
| `GET`    | `/aircraft/{id}`     | Get aircraft by ID       |
| `POST`   | `/aircraft/`         | Add aircraft to fleet    |
| `PATCH`  | `/aircraft/{id}`     | Update aircraft          |
| `DELETE` | `/aircraft/{id}`     | Remove from fleet        |

### Routes
| Method   | Path                      | Description                     |
|----------|---------------------------|---------------------------------|
| `GET`    | `/routes/`                | List all routes                 |
| `GET`    | `/routes/{id}`            | Get route by ID                 |
| `GET`    | `/routes/from/{iata}`     | List routes from airport        |
| `POST`   | `/routes/`                | Create route                    |
| `PATCH`  | `/routes/{id}`            | Update route                    |
| `DELETE` | `/routes/{id}`            | Delete route                    |

### Flights
| Method   | Path                          | Description                     |
|----------|-------------------------------|---------------------------------|
| `GET`    | `/flights/`                   | List flights (filter by status) |
| `GET`    | `/flights/{id}`               | Get flight + available seats    |
| `GET`    | `/flights/number/{number}`    | Get by flight number            |
| `POST`   | `/flights/`                   | Schedule a flight               |
| `PATCH`  | `/flights/{id}`               | Update status/times/price       |
| `POST`   | `/flights/{id}/cancel`        | Cancel flight + all bookings    |

### Bookings
| Method   | Path                              | Description                    |
|----------|-----------------------------------|--------------------------------|
| `GET`    | `/bookings/`                      | List all bookings              |
| `GET`    | `/bookings/{id}`                  | Get booking by ID              |
| `GET`    | `/bookings/flight/{flight_id}`    | Bookings for a flight          |
| `GET`    | `/bookings/passenger/{email}`     | Bookings for a passenger       |
| `POST`   | `/bookings/`                      | Create booking (seat check)    |
| `PATCH`  | `/bookings/{id}`                  | Update booking                 |
| `POST`   | `/bookings/{id}/cancel`           | Cancel booking                 |

---

## ⚙️ Configuration

The app uses environment variables (or a `.env` file) for configuration:

| Variable       | Default                   | Description              |
|----------------|---------------------------|--------------------------|
| `DATABASE_URL` | `sqlite:///./fams.db`     | SQLAlchemy database URL  |
| `DEBUG`        | `True`                    | Enable SQL echo logging  |

To switch to PostgreSQL:
```env
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/fams
```

---

## 🔮 Roadmap

- [ ] JWT-based authentication & RBAC (Admin / Crew / Passenger roles)
- [ ] Alembic database migrations
- [ ] Pagination metadata in list responses
- [ ] Flight search by origin/destination/date
- [ ] Email notifications on booking confirmation/cancellation
