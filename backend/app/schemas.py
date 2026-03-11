from fastapi_users import schemas
from pydantic import BaseModel
import uuid
from datetime import date
from typing import Optional

class UserRead(schemas.BaseUser[uuid.UUID]):
    fname: Optional[str]
    lname: Optional[str]
    is_oauth_user: bool = False

class UserCreate(schemas.BaseUserCreate):
    fname: str
    lname: str

class UserUpdate(schemas.BaseUserUpdate):
    fname: str
    lname: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class InstructionOut(BaseModel):
    instruction_id: uuid.UUID
    recipe_id: uuid.UUID
    step_number: int
    instruction_text: str

class RecipeOut(BaseModel):
    recipe_id: uuid.UUID
    creator_name: str
    creator_id: uuid.UUID
    recipe_name: str
    serving: int = 1
    tag: str = "All"
    prep_time: int
    photo_url: str | None = None
    calories: float | None = 0
    ingredients: list[IngredientOut]
    instructions: list[InstructionOut]

class RecipeIn(BaseModel):
    recipe_name: str
    serving: int = 1
    tag: str = "All"
    prep_time: int
    photo_url: str | None = None

class IngredientIn(BaseModel):
    ingredient_name: str
    ingredient_quantity: float | None = 1
    ingredient_unit: str | None = "unit"
    ingredient_preparation_style: str | None

class IngredientOut(BaseModel):
    ingredient_id: uuid.UUID
    ingredient_name: str
    ingredient_quantity: float | None = 1
    ingredient_unit: str | None = "unit"
    ingredient_preparation_style: str | None

class MealIn(BaseModel):
    recipe_id: uuid.UUID
    meal_date: date
    meal_type: str

class MealOut(BaseModel):
    meal_id: uuid.UUID
    recipe_id: uuid.UUID
    meal_date: date = date.today()
    meal_type: str

class MealWithRecipeOut(BaseModel):
    meal_id: uuid.UUID
    recipe_id: uuid.UUID
    recipe_name: str
    photo_url: str
    calories: float
    meal_date: date = date.today()
    meal_type: str

class FavoritedRecipeOut(BaseModel):
    recipe_id: uuid.UUID
    creator_id: uuid.UUID
    actual_creator_id: uuid.UUID
    actual_creator_name: str
    recipe_name: str
    photo_url: str
    calories: float
    prep_time: int
    ingredients: list[IngredientOut]