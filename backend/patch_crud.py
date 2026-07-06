import sys

content = """

def get_compliance_warnings_for_user(db: Session, user_id: int):
    warnings = []
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return warnings

    now = datetime.utcnow()
    
    # Pre-fetch all settings
    settings_query = db.query(models.ComplianceSetting).all()
    settings = {s.key: s.value for s in settings_query}

    # Medical Expiry
    if user.medical_expiry:
        warning_days = int(settings.get("medical_warning_days", 30))
        delta = (user.medical_expiry - now).days
        if delta < 0:
            warnings.append("Your medical certificate has expired!")
        elif delta <= warning_days:
            warnings.append(f"Your medical certificate expires in {delta} days.")
    else:
        warnings.append("No medical certificate on file.")

    # Duty Hours Daily
    if "max_duty_hours_daily" in settings or "max_duty_hours_per_day" in settings:
        max_duty_h = float(settings.get("max_duty_hours_daily", settings.get("max_duty_hours_per_day", 14)))
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_duties = db.query(models.Duty).filter(
            models.Duty.user_id == user_id,
            models.Duty.start_time >= today_start,
            models.Duty.end_time <= now + timedelta(days=1)
        ).all()
        total_duty_s = 0
        for d in today_duties:
            if d.duty_type not in [models.DutyTypeEnum.OFF, models.DutyTypeEnum.LEAVE]:
                end_t = min(now, d.end_time) if d.end_time else now
                start_t = max(today_start, d.start_time)
                if end_t > start_t:
                    total_duty_s += (end_t - start_t).total_seconds()
        
        if total_duty_s / 3600.0 > max_duty_h:
            warnings.append(f"Exceeded max daily duty hours ({max_duty_h}h). Current: {round(total_duty_s / 3600.0, 1)}h.")

    # Flight Hours (28 days)
    if "max_flight_hours_28_days" in settings:
        max_28d_h = float(settings.get("max_flight_hours_28_days", 100))
        twenty_eight_days_ago = now - timedelta(days=28)
        recent_bookings = db.query(models.Booking).filter(
            (models.Booking.instructor_id == user_id) | (models.Booking.student_id == user_id),
            models.Booking.start_time >= twenty_eight_days_ago,
            models.Booking.status == models.BookingStatusEnum.COMPLETED
        ).all()
        total_s = sum((b.end_time - b.start_time).total_seconds() for b in recent_bookings)
        if total_s / 3600.0 > max_28d_h:
            warnings.append(f"Exceeded 28-day flight hour limit ({max_28d_h}h). Current: {round(total_s / 3600.0, 1)}h.")

    # Flight Hours (Daily)
    if "max_flight_hours_daily" in settings:
        max_daily_h = float(settings.get("max_flight_hours_daily", 8))
        one_day_ago = now - timedelta(days=1)
        daily_bookings = db.query(models.Booking).filter(
            (models.Booking.instructor_id == user_id) | (models.Booking.student_id == user_id),
            models.Booking.start_time >= one_day_ago,
            models.Booking.status == models.BookingStatusEnum.COMPLETED
        ).all()
        total_daily_s = sum((b.end_time - b.start_time).total_seconds() for b in daily_bookings)
        if total_daily_s / 3600.0 > max_daily_h:
            warnings.append(f"Exceeded 24-hour flight limit ({max_daily_h}h). Current: {round(total_daily_s / 3600.0, 1)}h.")

    return warnings
"""

with open(r'c:\Users\FH\Documents\fams\backend\app\crud.py', 'a', encoding='utf-8') as f:
    f.write(content)

print("Done appending to crud.py")
