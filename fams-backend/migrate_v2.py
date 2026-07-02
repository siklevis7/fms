"""
migrate_v2.py — Safe schema migration for FAMS v2.
Adds new columns to existing tables without dropping or wiping any data.
Run once: python migrate_v2.py
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "fams.db")


def column_exists(cursor, table: str, column: str) -> bool:
    cursor.execute(f"PRAGMA table_info({table})")
    return any(row[1] == column for row in cursor.fetchall())


def migrate():
    print(f"Migrating database: {DB_PATH}")
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    migrations = [
        # ── flights table — OOOI times ───────────────────────────────────
        ("flights", "out_time",       "DATETIME"),
        ("flights", "off_time",       "DATETIME"),
        ("flights", "on_time",        "DATETIME"),
        ("flights", "in_time",        "DATETIME"),
        # ── flights table — Delay tracking ──────────────────────────────
        ("flights", "delay_code",     "VARCHAR(2)"),
        ("flights", "delay_minutes",  "SMALLINT"),
        # ── aircraft table — Turnaround & status ─────────────────────────
        ("aircraft", "min_turnaround_minutes", "SMALLINT DEFAULT 30"),
    ]

    for table, col, coltype in migrations:
        if not column_exists(cur, table, col):
            sql = f"ALTER TABLE {table} ADD COLUMN {col} {coltype}"
            cur.execute(sql)
            print(f"  [OK] Added {table}.{col}")
        else:
            print(f"  [--] {table}.{col} already exists - skipped")

    # Update the flights status enum values that changed names:
    # "Finished" stays, but we need to allow new values in SQLite
    # (SQLite doesn't enforce CHECK constraints on existing rows)
    # New values LANDED→ LANDED, DEPARTED → DEPARTED already exist in enum

    # Backfill: set min_turnaround_minutes = 30 where NULL
    cur.execute("UPDATE aircraft SET min_turnaround_minutes = 30 WHERE min_turnaround_minutes IS NULL")

    con.commit()
    con.close()
    print("Migration complete — no data was deleted.")


if __name__ == "__main__":
    migrate()
