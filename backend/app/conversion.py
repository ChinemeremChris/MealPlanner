from sqlalchemy import select
from db import IngredientConversion

UNIT_TO_GRAMS = {
    "grams": 1,
    "g": 1,
    "kg": 1000,
    "kilograms": 1000,
    "oz": 28.35,
    "ounces": 28.35,
    "lb": 453.59,
    "lbs": 453.39,
    "pounds": 453.59,
    
    # Volume to weight
    "cup": 240, 
    "cups": 240,
    "tablespoon": 15,
    "tablespoons": 15,
    "tbsp": 15,
    "teaspoon": 5,
    "teaspoons": 5,
    "tsp": 5,
    "ml": 1, 
    "liter": 1000,
}

async def ConvertToGrams(quantity: float, unit: str, session, ingredient: str = None):
    unit_lower = unit.lower().strip()
    if unit_lower in UNIT_TO_GRAMS:
        conversion = UNIT_TO_GRAMS[unit_lower]
        return conversion * quantity
    else:
        if ingredient:
            ing_lower = ingredient.lower().strip()
            ing_result = await session.scalar(select(IngredientConversion).where(IngredientConversion.ingredient_name == ing_lower))
            if ing_result:
                return quantity * ing_result.unit_weight_grams
            return quantity * 100

