import sys
sys.path.append('.')
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User

engine = create_engine("sqlite:///./fams_academy.db")
Session = sessionmaker(bind=engine)
session = Session()

users = session.query(User).all()
print(f"Found {len(users)} users.")
for user in users:
    if '@' in user.email:
        username = user.email.split('@')[0]
        user.email = f"{username}@kfms.com"
        
session.commit()
print("Success")
