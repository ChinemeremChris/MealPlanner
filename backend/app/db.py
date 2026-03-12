from collections.abc import AsyncGenerator
from fastapi import Depends
from fastapi_users.db import SQLAlchemyBaseOAuthAccountTableUUID, SQLAlchemyBaseUserTableUUID, SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, relationship, Mapped, mapped_column
from sqlalchemy import Column, String, Text, ForeignKey, UUID, Integer, Table, Text, UniqueConstraint, Boolean
import os
import uuid
from dotenv import load_dotenv
from datetime import date, datetime
from typing import List, Optional

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

class Base(DeclarativeBase):
    pass

class OAuthAccount(SQLAlchemyBaseOAuthAccountTableUUID, Base):
    pass

class User(SQLAlchemyBaseUserTableUUID, Base):
    oauth_accounts: Mapped[List["OAuthAccount"]] = relationship("OAuthAccount", lazy="joined")
    fname: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    lname: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    searchable: Mapped[bool] = mapped_column(Boolean, default=True)
    is_deleted: Mapped[bool] = mapped_column(default=False)
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True)
    meal_plan_reminder: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")
    grocery_reminder: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1")

    recipes: Mapped[list["Recipe"]] = relationship(back_populates="creator")
    user_meals: Mapped[list["Meal"]] = relationship(back_populates="eater")
    favorites: Mapped[list["Favorites"]] = relationship(back_populates="user")

    @property
    def is_oauth_user(self) -> bool:
        return len(self.oauth_accounts) > 0

class Recipe(Base):
    __tablename__ = "Recipe"
    recipe_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    creator_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"))
    recipe_name: Mapped[str] = mapped_column(Text)
    serving: Mapped[int] = mapped_column(default=1)
    tag: Mapped[str] = mapped_column(String(50), default="All")
    prep_time: Mapped[int] = mapped_column()
    photo_url: Mapped[str|None] = mapped_column(String(200))
    calories: Mapped[float | None] = mapped_column(default=0.0)

    creator: Mapped["User"] = relationship(back_populates="recipes")
    recipe_ingredients: Mapped[list["Recipe_Ingredient"]] = relationship(back_populates="recipe", cascade="all, delete-orphan")
    recipe_meals: Mapped[list["Meal"]] = relationship(back_populates="meal_recipe")
    instructions: Mapped[list["Instruction"]] = relationship(back_populates="recipe_instructions", cascade="all, delete-orphan")
    favorites: Mapped[list["Favorites"]] = relationship(back_populates="recipe", cascade="all, delete-orphan")

class Instruction(Base):
    __tablename__ = "Instruction"
    instruction_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    recipe_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("Recipe.recipe_id"))
    step_number: Mapped[int] = mapped_column()
    instruction_text: Mapped[str] = mapped_column(Text())
    
    recipe_instructions: Mapped["Recipe"] = relationship(back_populates="instructions", order_by="Instruction.step_number")

class Ingredient(Base):
    __tablename__ = "Ingredient"
    ingredient_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ingredient_name: Mapped[str] = mapped_column(String(100))

    recipe_ingredients: Mapped[list["Recipe_Ingredient"]] = relationship(back_populates="ingredient")

class Recipe_Ingredient(Base):
    __tablename__ = "Recipe_Ingredient"
    recipe_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("Recipe.recipe_id"), primary_key=True)
    ingredient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("Ingredient.ingredient_id"), primary_key=True)
    quantity: Mapped[float] = mapped_column(default=1)
    unit: Mapped[str] = mapped_column(String(30))
    preparation_style: Mapped[str | None] = mapped_column(String(30))
    
    recipe: Mapped["Recipe"] = relationship(back_populates="recipe_ingredients")
    ingredient: Mapped["Ingredient"] = relationship(back_populates="recipe_ingredients")

class Meal(Base):
    __tablename__ = "Meal"
    meal_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"))
    recipe_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("Recipe.recipe_id"))
    meal_date: Mapped[date] = mapped_column()
    meal_type: Mapped[str] = mapped_column(String(20))

    eater: Mapped["User"] = relationship(back_populates="user_meals")
    meal_recipe: Mapped["Recipe"] = relationship(back_populates="recipe_meals")

class Calories(Base):
    __tablename__ = "Calories"
    nutrition_id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    ingredient_name: Mapped[str] = mapped_column(String(100))
    preparation_style: Mapped[str] = mapped_column(String(30), default="raw")
    calories: Mapped[float|None] = mapped_column()
    unit: Mapped[str] = mapped_column(String(6), default="kCal")

    __table_args__ = (UniqueConstraint('ingredient_name', 'preparation_style', name='unique_nutrition'),)

class IngredientConversion(Base):
    __tablename__ = "IngredientConversion"
    ingredient_name: Mapped[str] = mapped_column(String(100), primary_key=True)
    unit_weight_grams: Mapped[int] = mapped_column(default=100)

class Favorites(Base):
    __tablename__ = "Favorites"
    recipe_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("Recipe.recipe_id"), primary_key=True)
    favorited_user: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id"), primary_key=True)
    
    recipe: Mapped["Recipe"] = relationship(back_populates="favorites")
    user: Mapped["User"] = relationship(back_populates="favorites")

engine = create_async_engine(DATABASE_URL)
async_session_maker = async_sessionmaker(engine, expire_on_commit=False)

async def create_db_and_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        yield session

async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User, OAuthAccount)