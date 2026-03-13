from app.celery_app import celery_app
from celery.schedules import crontab
from app.db import User, Meal, Recipe, Recipe_Ingredient
from app.email_sender import SendEmail
from app.schemas import IngredientOut
from dotenv import load_dotenv
import os
from sqlalchemy import select, create_engine
from sqlalchemy.orm import Session, selectinload
from datetime import datetime, timedelta

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
    days_to_add = timedelta(days=1)
    sunday = datetime.today() + days_to_add
    sunday = sunday.strftime("%Y-%m-%d")
    days_to_add = timedelta(days=7)
    saturday=datetime.today() + days_to_add
    saturday = saturday.strftime("%Y-%m-%d")
    with Session(engine) as session:
        query = select(User).where(User.grocery_reminder == True)
        users = session.execute(query).unique().scalars().all()
        
        #get ingredients
        for user in users:
            ingredients_query = select(Meal).options(selectinload(Meal.meal_recipe).selectinload(Recipe.recipe_ingredients).selectinload(Recipe_Ingredient.ingredient)).where((Meal.meal_date >= sunday) & (Meal.meal_date <= saturday) & (Meal.user_id == user.id))
            meal_list = session.scalars(ingredients_query).unique().all()
            ingredient_out_list = []

            for meal in meal_list:
                for ri in meal.meal_recipe.recipe_ingredients:
                    existing = False
                    for ing_dict in ingredient_out_list:
                        if (ing_dict["ingredient_name"] == ri.ingredient.ingredient_name):
                            ing_dict["quantity"] += ri.quantity
                            existing = True
                            break
                    if not existing:
                        ingredient_out_list.append({
                            "ingredient_id": ri.ingredient_id,
                            "ingredient_name": ri.ingredient.ingredient_name,
                            "ingredient_quantity": ri.quantity,
                            "ingredient_unit": ri.unit,
                            "ingredient_preparation_style": ri.preparation_style
                        })
            send_html = f"<p>Hi {user.fname}!</p> <p>Don't forget to buy your groceries for the upcoming week!</p><ul>"
            ingredient_string = ""
            for ing in ingredient_out_list:
                ingredient_string += f"<li>{ing['ingredient_name']} \t {ing['ingredient_quantity']} \t {ing['ingredient_unit']}</li>"
            send_html += ingredient_string + "</ul>"
            SendEmail(user.email,
                      "Upcoming Week's Grocery List",
                      send_html)
        
    print(f"Grocery reminder set for {len(users)} users!")