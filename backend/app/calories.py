import os
import httpx
from dotenv import load_dotenv
import asyncio

load_dotenv()

async def search_ingredient_calories(ingredient: str, preparation: str | None):
    url = "https://api.nal.usda.gov/fdc/v1/foods/search"
    api_key = os.getenv("USDA_API_KEY")
    query = f"{preparation} {ingredient}" if preparation else ingredient
    result = await get_nutrition(api_key, query, url)

    if preparation and not result:
        result = await get_nutrition(api_key, ingredient, url)
    
    return result

async def get_nutrition(api_key: str, query: str, url: str, retries=3):
    if not api_key:
        raise RuntimeError("USDA API KEY UNSET")
    
    param = {
        "api_key": api_key,
        "query": query,
        "pageSize": 5
    }

    for attempt in range(retries):
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url=url, params=param)
                
                if response.status_code != 200:
                    print("USDA API error:", response.status_code, response.text)
                    return None

                try:
                    data = response.json()
                except ValueError:
                    print("Invalid JSON response:", response.text)
                    return None
                
                foods = data.get("foods", [])
                if not foods:
                    return None
                
                foods.sort(key=lambda f: f["dataType"] != "Foundation")
                food = foods[0]

                if food:
                    for nutrient in food.get("foodNutrients", []):
                        if nutrient.get("nutrientId") in [2047, 1008, 2048]:
                            calories = round(nutrient.get("value") / 100, 2)
                            print(f"calories in {query} is {calories}")
                            return calories
                return None
                
        except httpx.ReadTimeout:
            if attempt < retries - 1:
                wait_time = 2 ** attempt
                print(f"USDA API timeout for '{query}', retrying in {wait_time}s... (attempt {attempt + 1}/{retries})")
                await asyncio.sleep(wait_time)
                continue
            print(f"USDA API timeout after {retries} attempts for: {query}")
            return None
        except Exception as e:
            print(f"Unexpected error fetching calories for '{query}': {e}")
            return None

if __name__ == "__main__":
    async def test():
        result = await search_ingredient_calories("chicken breast", "grilled")
        print(result)

    asyncio.run(test())