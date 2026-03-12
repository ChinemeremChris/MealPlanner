from app.celery_app import celery_app
from celery.schedules import crontab
from app.db import User, get_async_session
from app.email_sender import SendEmail
from dotenv import load_dotenv
import os
from sqlalchemy import select, create_engine
from sqlalchemy.orm import Session

load_dotenv()
engine = create_engine(os.getenv("SYNC_DATABASE_URL"))

celery_app.conf.beat_schedule = {
    "weekly-meal-reminder": {
        "task": "app.tasks.send_meal_plan_reminder",
        "schedule": crontab(hour=8, minute=0, day_of_week="Saturday")
    },
    "weekly-grocery-reminder": {
        "task": "app.tasks.send_grocery_reminder",
        "schedule": crontab(hour=10, minute=0, day_of_week="Saturday")
    }
}

@celery_app.task
def send_meal_plan_reminder():
    with Session(engine) as session:
        query = select(User).where(User.meal_plan_reminder == True)
        users = session.execute(query).unique().scalars().all()
        for user in users:
            SendEmail(user.email,
                      "Upcoming Week's Meal Plan",
                      f"<p>Hi {user.fname}!</p> <p>Don't forget to set your meal plan for the upcoming week!</p>")
        
    print(f"Meal plan reminder set for {len(users)} users!")



@celery_app.task
def send_grocery_reminder():
    engine = create_engine(os.getenv("SYNC_DATABASE_URL"))
    with Session(engine) as session:
        query = select(User).where(User.grocery_reminder == True)
        users = session.execute(query).unique().scalars().all()
        for user in users:
            SendEmail(user.email,
                      "Upcoming Week's Grocery List",
                      f"<p>Hi {user.fname}!</p> <p>Don't forget to buy your groceries for the upcoming week!</p>")
        
    print(f"Grocery reminder set for {len(users)} users!")

@celery_app.task
def test_task():
    print("This is my test task")
    return "success"