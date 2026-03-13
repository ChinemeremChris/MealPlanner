from fastapi import FastAPI, Depends, HTTPException, Query, Body, Path, UploadFile, File, Form, Response, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.db import User, Recipe, Ingredient, Recipe_Ingredient, Instruction, Meal, Calories, Favorites, OAuthAccount, create_db_and_tables, get_async_session, get_user_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from contextlib import asynccontextmanager
from sqlalchemy import select, delete, or_
from app.users import auth_backend, current_active_user, fastapi_users, google_oauth_client, get_user_manager, cookie_transport, get_jwt_strategy
from app.schemas import UserRead, UserCreate, UserUpdate, ChangePasswordRequest, RecipeOut, RecipeIn, IngredientIn, IngredientOut, MealIn, MealOut, MealWithRecipeOut, InstructionOut, FavoritedRecipeOut
from typing import Annotated, List
import uuid
from app.images import imageKit
import tempfile
import shutil
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import json
from datetime import datetime, date
from dotenv import load_dotenv
from app.calories import search_ingredient_calories
from app.conversion import ConvertToGrams
from fastapi.responses import RedirectResponse
from fastapi_users.password import PasswordHelper
from fastapi_users.exceptions import UserNotExists


@asynccontextmanager
async def lifespan(app: FastAPI):
    #await create_db_and_tables()
    yield

load_dotenv()
app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

load_dotenv()
SECRET = os.getenv("JWT_SECRET")

oauth_router = APIRouter()
router = APIRouter()

app.include_router(fastapi_users.get_register_router(UserRead, UserCreate), prefix="/auth", tags=["auth"])
app.include_router(fastapi_users.get_auth_router(auth_backend), prefix="/auth/jwt",tags=["auth"])
app.include_router(fastapi_users.get_users_router(UserRead, UserUpdate), prefix="/users", tags=["users"])
app.include_router(fastapi_users.get_reset_password_router(), prefix="/auth", tags=["/auth"])

password_helper = PasswordHelper()


@oauth_router.get("/auth/google/authorize")
async def google_authorize():
    authorization_url = await google_oauth_client.get_authorization_url(
        redirect_uri=os.getenv("GOOGLE_REDIRECT_URI"),
        scope=["openid", "email", "profile"]
    )
    return {"authorization_url": authorization_url}

@oauth_router.get("/auth/google/callback")
async def google_callback(code: str, response: Response, user_manager = Depends(get_user_manager), strategy = Depends(get_jwt_strategy), session: AsyncSession = Depends(get_async_session)):
    # Get token from Google
    token_data = await google_oauth_client.get_access_token(code, os.getenv("GOOGLE_REDIRECT_URI"))
    
    # Get user email from Google
    user_id, user_email = await google_oauth_client.get_id_email(token_data["access_token"])
    
    # Get or create user
    try:
        user = await user_manager.get_by_email(user_email)
        if user.is_deleted:
            return RedirectResponse(os.getenv("REDIRECT_RESPONSE_URL"), status_code=302)
    except UserNotExists:
        user = await user_manager.create(UserCreate(email=user_email, password=str(uuid.uuid4()), fname="", lname=""))
        # Create OAuthAccount record
        oauth_account = OAuthAccount(
            user_id=user.id,
            oauth_name="google",
            account_id=user_id,  # Google's user ID
            account_email=user_email,
            access_token=token_data["access_token"],
            expires_at=token_data.get("expires_at"),
        )

        session.add(oauth_account)
        await session.commit()
    
    # Generate JWT token
    jwt_token = await strategy.write_token(user)
    
    # Set cookie  
    response = RedirectResponse(os.getenv("FRONTEND_REDIRECT"), status_code=302)
    response.set_cookie(
        key=cookie_transport.cookie_name,
        value=jwt_token,
        max_age=cookie_transport.cookie_max_age,
        path=cookie_transport.cookie_path,
        domain=cookie_transport.cookie_domain,
        secure=True,
        httponly=True,
        samesite="none",
    )

    return response

@router.post("/me/change-password")
async def ChangePassword(data: ChangePasswordRequest, user = Depends(current_active_user), user_db = Depends(get_user_db)):
    valid = password_helper.verify_and_update(data.current_password, user.hashed_password)[0]

    if not valid:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    new_hashed= password_helper.hash(data.new_password)
    await user_db.update(user, {"hashed_password": new_hashed})
    return {"message": "Password updated!"}


app.include_router(router, prefix="/users", tags=["users"])
app.include_router(oauth_router)


@app.patch("/users/me/profile")
async def UpdateProfile(fname: Annotated[str, Body()], lname: Annotated[str, Body()], password_string: Annotated[str, Body()], email: Annotated[str, Body()], user: User = Depends(current_active_user), user_db = Depends(get_user_db)):
    update_data = {}
    if fname:
        update_data["fname"] = fname
    if lname:
        update_data["lname"] = lname
    if email:
        update_data["email"] = email
    if password_string:
        hashed = password_helper.hash(password_string)
        update_data["hashed_password"] = hashed

    updated_user = await user_db.update(user, update_data)
    print(updated_user)
    return {"message": "Update Successful"}

@app.delete("/users/me/delete-account")
async def DeleteUser(response: Response, user: User = Depends(current_active_user), session: AsyncSession = Depends(get_async_session)):
    user.is_deleted = True
    user.deleted_at = datetime.utcnow()
    await session.commit()
    response.delete_cookie(
        key=cookie_transport.cookie_name,
        path=cookie_transport.cookie_path,
        domain=cookie_transport.cookie_domain
    )
    return {"message": "Account has been deleted. Contact support team."}


@app.get("/recipes", response_model=list[RecipeOut])
async def GetAllRecipes(user: User = Depends(current_active_user), session: AsyncSession = Depends(get_async_session)):
    recipe_model_list = []
    ingredient_model_list = []
    instruction_model_list = []
    query = select(Recipe).options(selectinload(Recipe.recipe_ingredients).selectinload(Recipe_Ingredient.ingredient), selectinload(Recipe.instructions), selectinload(Recipe.creator)).where(user.searchable == True)
    recipes = await session.scalars(query)
    
    for recipe in recipes:
        for ri in recipe.recipe_ingredients:
            ingredient_model_list.append(IngredientOut(
                ingredient_id = ri.ingredient.ingredient_id,
                ingredient_name = ri.ingredient.ingredient_name,
                ingredient_quantity = ri.quantity,
                ingredient_unit = ri.unit,
                ingredient_preparation_style = ri.preparation_style
            ))
        for instruction in recipe.instructions:
            instruction_model_list.append(InstructionOut(
                instruction_id=instruction.instruction_id,
                recipe_id=recipe.recipe_id,
                step_number=instruction.step_number,
                instruction_text=instruction.instruction_text
            ))
            
        recipe_model_list.append(RecipeOut(
            recipe_id = recipe.recipe_id,
            creator_name = "Deleted User" if recipe.creator.is_deleted else f"{recipe.creator.fname} {recipe.creator.lname}",
            creator_id = recipe.creator_id,
            recipe_name = recipe.recipe_name,
            serving = recipe.serving,
            tag = recipe.tag,
            prep_time = recipe.prep_time,
            photo_url = recipe.photo_url,
            calories = recipe.calories,
            ingredients =  ingredient_model_list,
            instructions=instruction_model_list
        ))
        ingredient_model_list = []
        instruction_model_list = []
    
    return recipe_model_list

@app.get("/me/recipes", response_model=list[RecipeOut])
async def GetAllUserRecipes(user: User = Depends(current_active_user), session: AsyncSession = Depends(get_async_session)):
    recipe_model_list = []
    ingredient_model_list = []
    instruction_model_list = []
    if not user or user.is_deleted:
        raise HTTPException(403, "User not found")
    
    query = select(Recipe).options(selectinload(Recipe.recipe_ingredients).selectinload(Recipe_Ingredient.ingredient), selectinload(Recipe.instructions), selectinload(Recipe.creator)).where(Recipe.creator_id == user.id)
    recipes = await session.scalars(query)
    
    for recipe in recipes:
        for ri in recipe.recipe_ingredients:
            ingredient_model_list.append(IngredientOut(
                ingredient_id = ri.ingredient.ingredient_id,
                ingredient_name = ri.ingredient.ingredient_name,
                ingredient_quantity = ri.quantity,
                ingredient_unit = ri.unit,
                ingredient_preparation_style = ri.preparation_style
            ))
        for instruction in recipe.instructions:
            instruction_model_list.append(InstructionOut(
                instruction_id=instruction.instruction_id,
                recipe_id=recipe.recipe_id,
                step_number=instruction.step_number,
                instruction_text=instruction.instruction_text
            ))
        recipe_model_list.append(RecipeOut(
            recipe_id = recipe.recipe_id,
            creator_name = "Deleted User" if recipe.creator.is_deleted else f"{recipe.creator.fname} {recipe.creator.lname}",
            creator_id = recipe.creator_id,
            recipe_name = recipe.recipe_name,
            serving = recipe.serving,
            tag = recipe.tag,
            prep_time = recipe.prep_time,
            photo_url = recipe.photo_url,
            calories = recipe.calories,
            ingredients =  ingredient_model_list,
            instructions = instruction_model_list
        ))
        ingredient_model_list = []
        instruction_model_list = []
    
    return recipe_model_list

@app.get("/recipes/{recipe_id}", response_model=RecipeOut)
async def GetOneUserRecipe(recipe_id: Annotated[uuid.UUID, Path()], session: AsyncSession = Depends(get_async_session)):
    query = select(Recipe).options(selectinload(Recipe.recipe_ingredients).selectinload(Recipe_Ingredient.ingredient), selectinload(Recipe.creator), selectinload(Recipe.instructions), selectinload(Recipe.creator)).where(Recipe.recipe_id == recipe_id)
    recipe = await session.scalar(query)
    
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    ingredient_list = []
    instruction_list = []
    for ri in recipe.recipe_ingredients:
        ingredient_list.append(IngredientOut(
            ingredient_id = ri.ingredient_id,
            ingredient_name = ri.ingredient.ingredient_name,
            ingredient_quantity = ri.quantity,
            ingredient_unit = ri.unit,
            ingredient_preparation_style = ri.preparation_style
        ))

    for instruction in recipe.instructions:
        instruction_list.append(InstructionOut(
            instruction_id=instruction.instruction_id,
            recipe_id=recipe.recipe_id,
            step_number=instruction.step_number,
            instruction_text=instruction.instruction_text
        ))
    recipe_return = RecipeOut(
        recipe_id = recipe.recipe_id,
        creator_name = "Deleted User" if recipe.creator.is_deleted else f"{recipe.creator.fname} {recipe.creator.lname}",
        creator_id = recipe.creator_id,
        recipe_name = recipe.recipe_name,
        serving = recipe.serving,
        tag = recipe.tag,
        prep_time = recipe.prep_time,
        photo_url = recipe.photo_url,
        calories = recipe.calories,
        ingredients = ingredient_list,
        instructions = instruction_list
    )

    return recipe_return

@app.post("/recipe")
async def UploadRecipe(recipe: Annotated[str, Form()], ingredients: Annotated[str, Form()], instructions: Annotated[str, Form()], file: UploadFile = File(...), user: User = Depends(current_active_user), session: AsyncSession = Depends(get_async_session)):
    temp_file_path = None
    temp_file_handler = None
    print(f"Recipe received: '{recipe}' (length: {len(recipe)})")
    print(f"Ingredients received: '{ingredients}' (length: {len(ingredients)})")
    print(f"Instructions: '{instructions}'")

    recipe_data = json.loads(recipe)
    recipe_obj = RecipeIn(**recipe_data)
    ingredient_data = json.loads(ingredients)
    instructionData = json.loads(instructions)
    ingredient_list = []
    instruction_list = []
    for ingredient_dict in ingredient_data:
        ingredient_list.append(IngredientIn(**ingredient_dict))

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
            temp_file_path = temp_file.name
            shutil.copyfileobj(file.file, temp_file)

        temp_file_handler = open(temp_file_path, "rb")

        upload_result = imageKit.files.upload(
            file = temp_file_handler,
            file_name = file.filename,
            tags = [recipe_obj.tag]
        )

        temp_file_handler.close()

        if upload_result and upload_result.url:
            new_recipe = Recipe(
                creator_id = user.id,
                recipe_name = recipe_obj.recipe_name,
                serving = recipe_obj.serving,
                tag = recipe_obj.tag,
                prep_time = recipe_obj.prep_time,
                photo_url = upload_result.url
            )
            session.add(new_recipe)
            await session.commit()
            await session.refresh(new_recipe)
            await session.flush()

            for step, instruction in enumerate(instructionData, start=1):
                instructionAdd = Instruction(
                    recipe_id = new_recipe.recipe_id,
                    step_number = step,
                    instruction_text = instruction
                )
            
                session.add(instructionAdd)
                await session.flush()
                await session.refresh(instructionAdd)

                instruction_list.append(InstructionOut(
                    instruction_id = instructionAdd.instruction_id,
                    recipe_id = instructionAdd.recipe_id,
                    step_number = instructionAdd.step_number,
                    instruction_text = instructionAdd.instruction_text
                ))
            
            ingredient_id_list = []
            recipeCalories = 0
            for ing in ingredient_list:
                query = select(Ingredient).where(Ingredient.ingredient_name == ing.ingredient_name)
                result = await session.scalar(query)
                if result:
                    ingredient_id_list.append(result)
                else:
                    new_ing = Ingredient(ingredient_name = ing.ingredient_name)
                    session.add(new_ing)
                    await session.flush()
                    await session.refresh(new_ing)
                    ingredient_id_list.append(new_ing)
                
                #check calories logic
                prep_style = ing.ingredient_preparation_style if ing.ingredient_preparation_style else "raw"
                calorie_query = select(Calories).where(Calories.ingredient_name == ing.ingredient_name, Calories.preparation_style == prep_style)
                calorie_info = await session.scalar(calorie_query)
                try:
                    quantity_in_grams = await ConvertToGrams(float(ing.ingredient_quantity), ing.ingredient_unit, session, ing.ingredient_name)
                    if calorie_info:
                        recipeCalories += (calorie_info.calories * quantity_in_grams)
                        print(f"recipeCalories = {calorie_info.calories} * {quantity_in_grams} = {recipeCalories}")
                    elif not calorie_info:
                        calorie_add = await search_ingredient_calories(ing.ingredient_name, ing.ingredient_preparation_style)
                        if calorie_add:
                            calorie_data = Calories(
                            ingredient_name = ing.ingredient_name,
                            preparation_style = prep_style,
                            calories = calorie_add
                        )
                            session.add(calorie_data)
                            recipeCalories += (calorie_add * quantity_in_grams)
                            print(f"recipeCalories = {calorie_add} * {quantity_in_grams} = {recipeCalories}")
                except Exception as e:
                    import traceback
                    print(f"Calorie calculation failed for {ing.ingredient_name}")
                    print(f"Error type: {type(e).__name__}")
                    print(f"Error message: {str(e)}")
                    traceback.print_exc()
            
            #add calories to Recipe            
            new_recipe.calories = recipeCalories
            await session.flush()
                
            #get the recipe_id for recipe that was just inputted then add recipe and all...
            # ingredients into Recipe_Ingredient    
            #modify data so ingredient is a list of IngredientIn models
            ingredient_out_list = []
            for db_ing, pydantic_ing in zip(ingredient_id_list, ingredient_list):
                new_recipe_ingredient = Recipe_Ingredient(
                    recipe_id = new_recipe.recipe_id,
                    ingredient_id = db_ing.ingredient_id,
                    quantity = pydantic_ing.ingredient_quantity,
                    unit = pydantic_ing.ingredient_unit,
                    preparation_style = pydantic_ing.ingredient_preparation_style
                )
                session.add(new_recipe_ingredient)
                await session.flush()
                ingredient_out_list.append(IngredientOut(
                    ingredient_id =db_ing.ingredient_id,
                    ingredient_name = db_ing.ingredient_name,
                    ingredient_quantity = new_recipe_ingredient.quantity,
                    ingredient_unit = new_recipe_ingredient.unit,
                    ingredient_preparation_style = new_recipe_ingredient.preparation_style
                ))
            await session.commit()
            query = select(User).where(User.id == new_recipe.creator_id)
            creator = await session.scalar(query)

            return_data = RecipeOut(
                recipe_id = new_recipe.recipe_id,
                creator_name = "Deleted User" if creator.is_deleted else f"{creator.fname} {creator.lname}",
                creator_id = new_recipe.creator_id,
                recipe_name = new_recipe.recipe_name,
                serving = new_recipe.serving,
                tag = new_recipe.tag,
                prep_time = new_recipe.prep_time,
                photo_url = new_recipe.photo_url,
                calories = new_recipe.calories,
                ingredients = ingredient_out_list,
                instructions = instruction_list
            )
            return return_data
        else:
            raise HTTPException(status_code=500, detail="Upload failed")
    
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if temp_file_handler and not temp_file_handler.closed:
            temp_file_handler.close()
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        file.file.close()


@app.delete("/recipes")
async def DeleteRecipe(recipe_id: Annotated[uuid.UUID, Body()], user: User = Depends(current_active_user), session: AsyncSession = Depends(get_async_session)):
    query = select(Recipe).where(Recipe.recipe_id == recipe_id)
    recipe = await session.scalar(query)

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    if recipe.creator_id != user.id:
        raise HTTPException(status_code=403, detail="You cannot delete this recipe")
    
    meal_query = select(Meal).where(Meal.recipe_id == recipe_id)
    meals_using_recipe = await session.scalars(meal_query)

    if meals_using_recipe.all():
        raise HTTPException(status_code=400, detail="Cannot delete recipe - it's used in meal plans")
    
    print(f"attempting to delete {recipe_id}")
    await session.delete(recipe)
    await session.commit()
    return Response(status_code=204)

@app.patch("/recipes/{recipeID}")
async def UpdateRecipe(recipeID: Annotated[uuid.UUID, Path()], updated_recipe: Annotated[str, Form()], updated_ingredients: Annotated[str, Form()], updated_instructions: Annotated[str, Form()], updated_image: UploadFile | None = None, user: User = Depends(current_active_user), session: AsyncSession = Depends(get_async_session)):
    query = select(Recipe).options(selectinload(Recipe.recipe_ingredients)).where(Recipe.recipe_id == recipeID)
    recipe = await session.scalar(query)
    existing_ingredients_result = await session.scalars(select(Ingredient))
    existing_ingredients = existing_ingredients_result.all()
    existing_ingredients_list = {ing.ingredient_name: ing for ing in existing_ingredients}

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    if recipe.creator_id != user.id:
        raise HTTPException(status_code=403, detail="You do not own this recipe")
    
    updated_recipe_data = json.loads(updated_recipe)
    updated_recipe_obj = RecipeIn(**updated_recipe_data)

    updated_ingredient_data = json.loads(updated_ingredients)
    updated_ingredient_list = []
    for updated_ingredient_dict in updated_ingredient_data:
        updated_ingredient_list.append(IngredientIn(**updated_ingredient_dict))

    if updated_image:
        temp_file_path = None
        temp_file_handler = None

        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(updated_image.filename)[1]) as temp_file:
                temp_file_path = temp_file.name
                shutil.copyfileobj(updated_image.file, temp_file)

            temp_file_handler = open(temp_file_path, "rb")
            upload_result = imageKit.files.upload(
                file = temp_file_handler,
                file_name = updated_image.filename,
                tags = [updated_recipe_obj.tag]
            )
            temp_file_handler.close()

            if upload_result and upload_result.url:
                recipe.photo_url = upload_result.url
            else:
                raise HTTPException(status_code=500, detail="Image failed to be updated")

        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        
        finally:
            if temp_file_handler and not temp_file_handler.closed:
                temp_file_handler.close()
            if temp_file_path and os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
            await updated_image.close()

    print("Starting update...")
    await session.execute(delete(Recipe_Ingredient).where(Recipe_Ingredient.recipe_id == recipeID))
    print("Deleted old recipe_ingredients")

    recipe.recipe_name = updated_recipe_obj.recipe_name
    recipe.serving = updated_recipe_obj.serving
    recipe.tag = updated_recipe_obj.tag
    recipe.prep_time = updated_recipe_obj.prep_time
    print("Updated recipe fields")

    await session.execute(delete(Instruction).where(Instruction.recipe_id == recipeID))
    instruction_list = json.loads(updated_instructions)
    for index, instruction in enumerate(instruction_list, start=1):
        new_instruction = Instruction(
            recipe_id = recipeID,
            step_number = index,
            instruction_text = instruction
        )
        session.add(new_instruction)
        await session.flush()

    updated_ingredient_id_list = []
    recipeCalories = 0
    for new_ing in updated_ingredient_list:
        if new_ing.ingredient_name in existing_ingredients_list:
            updated_ingredient_id_list.append(existing_ingredients_list[new_ing.ingredient_name])
        else:
            add_ingredient = Ingredient(ingredient_name=new_ing.ingredient_name)
            session.add(add_ingredient)
            await session.flush()
            await session.refresh(add_ingredient)
            updated_ingredient_id_list.append(add_ingredient)

        #calorie logic
        prep_style = new_ing.ingredient_preparation_style if new_ing.ingredient_preparation_style else "raw"
        calorie_query = select(Calories).where(Calories.ingredient_name == new_ing.ingredient_name, Calories.preparation_style == prep_style)
        calorie_info = await session.scalar(calorie_query)
        quantity_in_grams = await ConvertToGrams(new_ing.ingredient_quantity, new_ing.ingredient_unit, session, new_ing.ingredient_name)
        if calorie_info:
            recipeCalories += (calorie_info.calories * new_ing.ingredient_quantity)
        if not calorie_info:
            calorie_add = await search_ingredient_calories(new_ing.ingredient_name, new_ing.ingredient_preparation_style)
            if calorie_add:
                calorie_data = Calories(
                ingredient_name = new_ing.ingredient_name,
                preparation_style = prep_style,
                calories = calorie_add
            )
                session.add(calorie_data)
                recipeCalories += (calorie_data.calories * quantity_in_grams)
    recipe.calories = recipeCalories

    for withID, withoutID in zip(updated_ingredient_id_list, updated_ingredient_list):
        new_recipe_ingredient = Recipe_Ingredient(
            recipe_id = recipeID,
            ingredient_id = withID.ingredient_id,
            quantity = withoutID.ingredient_quantity,
            unit = withoutID.ingredient_unit,
            preparation_style = withoutID.ingredient_preparation_style
        )
        print("Adding new ingredients")
        session.add(new_recipe_ingredient)
    await session.commit()
    print("Committed successfully")

    return {"Message": "Update Successful"}

@app.get("/ingredients")
async def Get_Ingredients(start: Annotated[date, Query()], end: Annotated[date, Query()], user: User = Depends(current_active_user), session: AsyncSession = Depends(get_async_session)):
    query = select(Meal).options(selectinload(Meal.meal_recipe).selectinload(Recipe.recipe_ingredients).selectinload(Recipe_Ingredient.ingredient)).where((Meal.meal_date >= start) & (Meal.meal_date <= end) & (Meal.user_id == user.id))
    meal_list = await session.scalars(query)
    meal_list = meal_list.all()
    ingredient_out_list = []

    for meal in meal_list:
        for ri in meal.meal_recipe.recipe_ingredients:
            ingredient_out_list.append(IngredientOut(
                ingredient_id = ri.ingredient_id,
                ingredient_name = ri.ingredient.ingredient_name,
                ingredient_quantity = ri.quantity,
                ingredient_unit = ri.unit,
                ingredient_preparation_style = ri.preparation_style
            ))
    
    return ingredient_out_list

@app.post("/meal")
async def create_meal(meal_obj: Annotated[MealIn, Body()], user: User = Depends(current_active_user), session: AsyncSession = Depends(get_async_session)):
    existing_meal = await session.scalar(select(Meal).where(
        Meal.user_id == user.id,
        Meal.recipe_id == meal_obj.recipe_id,
        Meal.meal_date == meal_obj.meal_date,
        Meal.meal_type == meal_obj.meal_type
    ))
    
    if existing_meal:
        raise HTTPException(status_code=400, detail="Meal already exists")

    recipe = await session.scalar(select(Recipe).where(Recipe.recipe_id == meal_obj.recipe_id))
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    date_format = "%Y-%m-%d"
    meal_add = Meal(
        user_id = user.id,
        recipe_id = meal_obj.recipe_id,
        meal_date = meal_obj.meal_date,
        meal_type = meal_obj.meal_type
    )

    session.add(meal_add)
    await session.commit()

    meal_return = MealOut(
        meal_id = meal_add.meal_id,
        recipe_id = meal_add.recipe_id,
        meal_date = meal_add.meal_date,
        meal_type = meal_add.meal_type
    )

    return meal_return

#maybe add start and end dates as query params
@app.get("/meals")
async def GetCustomTimeMeals(start: Annotated[date, Query()], end: Annotated[date, Query()], user: User = Depends(current_active_user), session: AsyncSession = Depends(get_async_session)):
    query = select(Meal).options(selectinload(Meal.meal_recipe)).where(Meal.user_id == user.id, Meal.meal_date >= start, Meal.meal_date <= end).order_by(Meal.meal_date)
    meals = await session.scalars(query)
    meal_range = meals.all()
    print(f"found: {len(meal_range)} meals")

    meal_out_list = []
    for meal in meal_range:
        meal_out_list.append(MealWithRecipeOut(
            meal_id = meal.meal_id,
            recipe_id = meal.recipe_id,
            recipe_name = meal.meal_recipe.recipe_name,
            photo_url = meal.meal_recipe.photo_url,
            calories = meal.meal_recipe.calories,
            meal_date = meal.meal_date,
            meal_type = meal.meal_type
        ))
    
    print(f"meal_out_list: {meal_out_list}")
    return meal_out_list

@app.post("/batch/meals")
async def BatchCreate(start: Annotated[date, Query()], end: Annotated[date, Query()], meal_list: Annotated[List[MealIn], Body()], user: User = Depends(current_active_user), session: AsyncSession = Depends(get_async_session)):
    check_query = delete(Meal).where((Meal.meal_date >= start) & (Meal.meal_date <= end) & (Meal.user_id == user.id))
    await session.execute(check_query)

    meal_obj_list = []
    meal_out_list = []
    recipe_id_list = set(meal.recipe_id for meal in meal_list)
    recipes = await session.scalars(select(Recipe).where(Recipe.recipe_id.in_(recipe_id_list)))  
    found_recipe_ids = set(recipe.recipe_id for recipe in recipes.all())
    
    missing_ids = recipe_id_list - found_recipe_ids
    if missing_ids:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    for meal in meal_list:
        add_meal = Meal(
            user_id = user.id,
            recipe_id = meal.recipe_id,
            meal_date = meal.meal_date,
            meal_type = meal.meal_type
        )
        meal_obj_list.append(add_meal)
    
    session.add_all(meal_obj_list)
    await session.commit()
    meal_out_list = [MealOut(meal_id=meal_out.meal_id, recipe_id=meal_out.recipe_id, meal_date=meal_out.meal_date, meal_type=meal_out.meal_type) for meal_out in meal_obj_list]

    return meal_out_list




@app.delete("/meals/{mealID}")
async def DeleteMeal(mealID: Annotated[uuid.UUID, Path()], user: User = Depends(current_active_user), session: AsyncSession = Depends(get_async_session)):
    delete_meal = await session.scalar(select(Meal).where(Meal.meal_id == mealID))
    
    if not delete_meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    if delete_meal.user_id != user.id:
        raise HTTPException(status_code=403, detail="You cannot delete this meal")
    
    await session.delete(delete_meal)
    await session.commit()
    return Response(status_code=204)

#test delete endpoint

@app.patch("/meals/{mealID}/recipe/{new_recipe_id}")
async def UpdateMeal(mealID: Annotated[uuid.UUID, Path()], new_recipe_id: Annotated[uuid.UUID, Path()], user: User = Depends(current_active_user), session: AsyncSession = Depends(get_async_session)):
    query = select(Meal).options(selectinload(Meal.meal_recipe)).where(Meal.meal_id == mealID)
    meal = await session.scalar(query)

    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    if meal.user_id != user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to meal")
    
    new_recipe_obj = await session.scalar(select(Recipe).where(Recipe.recipe_id == new_recipe_id))
    if not new_recipe_obj:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    meal.recipe_id = new_recipe_id

    await session.commit()

    return_obj = MealWithRecipeOut(
        meal_id = meal.meal_id,
        recipe_id = meal.recipe_id,
        recipe_name = new_recipe_obj.recipe_name,
        photo_url= meal.meal_recipe.photo_url,
        calories = meal.meal_recipe.calories,
        meal_date= meal.meal_date,
        meal_type= meal.meal_type
    )

    return return_obj

@app.get("/search")
async def Search(search_term: Annotated[str, Query()], type: Annotated[str, Query()]= "all", user: User = Depends(current_active_user), session: AsyncSession = Depends(get_async_session)):
    if not user:
        raise HTTPException(status_code=401, detail="Log in to search")
    
    result = {"recipes": [], "users": []}
    
    if type in ["all", "recipes"]:
        query = select(Recipe).options(selectinload(Recipe.recipe_ingredients).selectinload(Recipe_Ingredient.ingredient), selectinload(Recipe.instructions), selectinload(Recipe.creator)).where(Recipe.recipe_name.ilike(f"%{search_term}%"), user.searchable == True)
        recipe_by_name = await session.scalars(query)
        recipe_by_name = recipe_by_name.all()
        ingredient_query = select(Recipe).options(selectinload(Recipe.recipe_ingredients).selectinload(Recipe_Ingredient.ingredient), selectinload(Recipe.instructions), selectinload(Recipe.creator)).join(Recipe.recipe_ingredients).join(Recipe_Ingredient.ingredient).where(Ingredient.ingredient_name.ilike(f"%{search_term}%"))
        recipe_by_ingredient = await session.scalars(ingredient_query)
        recipe_by_ingredient = recipe_by_ingredient.all()
        seen = set()
        all_recipes = []
        for recipe in recipe_by_name + recipe_by_ingredient:
            if recipe.recipe_id not in seen:
                all_recipes.append(recipe)
                seen.add(recipe.recipe_id)

        print(f"all recipes are {all_recipes}")
        recipe_out_list = []
        for recipe in all_recipes:
            ingredient_out_list = []
            instruction_out_list = []
            for ri in recipe.recipe_ingredients:
                ingredient_out_list.append(IngredientOut(
                    ingredient_id = ri.ingredient_id,
                    ingredient_name = ri.ingredient.ingredient_name,
                    ingredient_quantity = ri.quantity,
                    ingredient_unit = ri.unit,
                    ingredient_preparation_style = ri.preparation_style
                ))
            for inst in recipe.instructions:
                instruction_out_list.append(InstructionOut(
                    instruction_id=inst.instruction_id,
                    recipe_id = inst.recipe_id,
                    step_number = inst.step_number,
                    instruction_text=inst.instruction_text
                ))

            recipe_out_list.append(RecipeOut(
                recipe_id = recipe.recipe_id,
                creator_name = "Deleted User" if recipe.creator.is_deleted else f"{recipe.creator.fname} {recipe.creator.lname}",
                creator_id = recipe.creator_id,
                recipe_name = recipe.recipe_name,
                serving = recipe.serving,
                tag = recipe.tag,
                prep_time = recipe.prep_time,
                photo_url = recipe.photo_url,
                calories = recipe.calories,
                ingredients = ingredient_out_list,
                instructions = instruction_out_list
            ))
        
        result["recipes"] = recipe_out_list
    

    if type in ["all", "users"]:
        user_query = select(User).options(selectinload(User.recipes)).where(User.is_deleted==False, User.searchable==True, or_(User.fname.ilike(f"%{search_term}%"), User.lname.ilike(f"%{search_term}%")))
        users = await session.scalars(user_query)

        user_out_list = []
        for u in users.unique().all():
            num_recipes = len(u.recipes)
            user_out_list.append({
                "id": str(u.id),
                "fname": u.fname,
                "lname": u.lname,
                "email": u.email,
                "recipe_count": num_recipes
            })
        
        result["users"] = user_out_list
    
    return result


@app.get("/favorites")
async def GetFavorites(user: User = Depends(current_active_user), session: AsyncSession = Depends(get_async_session)):
    query = (select(Favorites).options(selectinload(Favorites.recipe).options(selectinload(Recipe.creator),selectinload(Recipe.recipe_ingredients).selectinload(Recipe_Ingredient.ingredient)),).where(Favorites.favorited_user == user.id))
    favorited_recipes = await session.scalars(query)
    favorited_recipes = favorited_recipes.all()
    recipe_out_list = []
    ingredient_model_list = []
    for recipe in favorited_recipes:
        for ri in recipe.recipe.recipe_ingredients:
            ingredient_model_list.append(IngredientOut(
                ingredient_id = ri.ingredient.ingredient_id,
                ingredient_name = ri.ingredient.ingredient_name,
                ingredient_quantity = ri.quantity,
                ingredient_unit = ri.unit,
                ingredient_preparation_style = ri.preparation_style
            ))
        recipe_out_list.append(FavoritedRecipeOut(
            recipe_id = recipe.recipe_id,
            creator_id = recipe.favorited_user,
            actual_creator_id = recipe.recipe.creator_id,
            actual_creator_name = "Deleted User" if recipe.recipe.creator.is_deleted else f"{recipe.recipe.creator.fname} {recipe.recipe.creator.lname}",
            recipe_name = recipe.recipe.recipe_name,
            photo_url = recipe.recipe.photo_url,
            calories = recipe.recipe.calories,
            prep_time = recipe.recipe.prep_time,
            ingredients = ingredient_model_list
        ))
        ingredient_model_list = []
    
    return recipe_out_list

@app.get("/favorites/{recipe_id}")
async def IsRecipeFavorite(recipe_id: Annotated[uuid.UUID, Path()], user: User = Depends(current_active_user), session: AsyncSession = Depends(get_async_session)):
    query = select(Favorites).where((Favorites.favorited_user == user.id) & (Favorites.recipe_id == recipe_id))
    recipe = await session.scalar(query)

    return True if recipe else False

@app.post("/favorites")
async def AddFavorite(recipe_id: Annotated[uuid.UUID, Body()], user: User = Depends(current_active_user), session: AsyncSession = Depends(get_async_session)):
    add_favorite = Favorites(
        recipe_id = recipe_id,
        favorited_user = user.id
    )

    session.add(add_favorite)
    await session.commit()
    return {"message": "successfully added to favorites"}

@app.delete("/favorites")
async def DeleteFavorite(recipe_id: Annotated[uuid.UUID, Body()], user: User = Depends(current_active_user), session: AsyncSession = Depends(get_async_session)):
    query = select(Favorites).options(selectinload(Favorites.recipe), selectinload(Favorites.user)).where((Favorites.recipe_id == recipe_id) & (Favorites.favorited_user == user.id))
    favorite = await session.scalar(query)
    if not favorite:
        raise HTTPException(status_code=404, detail="Post not favorited")
    await session.delete(favorite)
    await session.commit()
    return {"message": "recipe removed from favorites"}