import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models import Resource, ResourceTypeEnum

def seed_aircraft():
    db = SessionLocal()
    try:
        aircraft_to_add = [
            # 5 DA20s
            {"name": "9XR-DAA (DA20)", "type": ResourceTypeEnum.AIRCRAFT, "status": "Active", "basic_empty_weight": 528.0, "max_takeoff_weight": 800.0},
            {"name": "9XR-DAB (DA20)", "type": ResourceTypeEnum.AIRCRAFT, "status": "Active", "basic_empty_weight": 528.0, "max_takeoff_weight": 800.0},
            {"name": "9XR-DAC (DA20)", "type": ResourceTypeEnum.AIRCRAFT, "status": "Active", "basic_empty_weight": 528.0, "max_takeoff_weight": 800.0},
            {"name": "9XR-DAD (DA20)", "type": ResourceTypeEnum.AIRCRAFT, "status": "Active", "basic_empty_weight": 528.0, "max_takeoff_weight": 800.0},
            {"name": "9XR-DAE (DA20)", "type": ResourceTypeEnum.AIRCRAFT, "status": "Active", "basic_empty_weight": 528.0, "max_takeoff_weight": 800.0},
            
            # 3 DA42s
            {"name": "9XR-DFA (DA42)", "type": ResourceTypeEnum.AIRCRAFT, "status": "Active", "basic_empty_weight": 1410.0, "max_takeoff_weight": 1900.0},
            {"name": "9XR-DFB (DA42)", "type": ResourceTypeEnum.AIRCRAFT, "status": "Active", "basic_empty_weight": 1410.0, "max_takeoff_weight": 1900.0},
            {"name": "9XR-DFC (DA42)", "type": ResourceTypeEnum.AIRCRAFT, "status": "Active", "basic_empty_weight": 1410.0, "max_takeoff_weight": 1900.0},
            
            # 2 Cessna Caravan 208s
            {"name": "9XR-CAA (C208)", "type": ResourceTypeEnum.AIRCRAFT, "status": "Active", "basic_empty_weight": 2145.0, "max_takeoff_weight": 3629.0},
            {"name": "9XR-CAB (C208)", "type": ResourceTypeEnum.AIRCRAFT, "status": "Active", "basic_empty_weight": 2145.0, "max_takeoff_weight": 3629.0},
        ]

        added_count = 0
        for ac in aircraft_to_add:
            existing = db.query(Resource).filter(Resource.name == ac["name"]).first()
            if not existing:
                new_resource = Resource(**ac)
                db.add(new_resource)
                added_count += 1
        
        db.commit()
        print(f"Successfully seeded {added_count} aircraft into the database.")
    
    except Exception as e:
        print(f"Error seeding aircraft: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_aircraft()
