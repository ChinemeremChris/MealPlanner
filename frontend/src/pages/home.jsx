import { useState, useEffect } from "react"
import { RecipeCard } from "../components/recipeCard"
import styles from '../styles/home.module.css'
export const Homepage = () => {
    const [recipeList, setRecipeList] = useState([])

    useEffect(() => {
        const fetchRecipes = async () =>{
            try{
                const response = await fetch(`http://localhost:8000/recipes`, {
                    method: "GET",
                    credentials: "include"
                })
                
                if(!response.ok){
                    throw new Error ("Error loading recipes")
                }

                const result = await response.json()
                setRecipeList(result.slice(0, 4))
            }catch(e){
                console.log(e)
            }
        }
        fetchRecipes()
    }, [])

    return (
        <div className={styles.mainContainer}>
            <div className={styles.hero}>
                <div className={styles.heroText}>
                    <div className={styles.heroBoldText}>
                        <div className={styles.heroTextFirst}>Discover & Share</div>
                        <div className={styles.heroTextSecond}>Delicious Recipes</div>
                    </div>
                    <div className={styles.heroTextSubtitle}>
                        Join our community to find recipes, create and share your own, and plan your perfect meals
                    </div>
                    <div className={styles.heroBtns}>
                        <button type="button" className={styles.getStarted}>Get Started</button>
                        <button type="button" className={styles.exploreRecipes}>Explore Recipes</button>
                    </div>
                </div>
                <div className={styles.heroImg}> </div>
            </div>
            <div className={styles.body}>
                <div className={styles.share_plan}>
                    <div className={styles.plan}>
                        <div className={styles.planImg}></div>
                        <div className={styles.planBody}>
                            <div className={styles.share_plan_title}>Plan Your Meals</div>
                            <div className={styles.share_plan_description}>
                                Keep track of your meals, get weekly nutritional info and grocery list
                            </div>
                            <div className={styles.planBtnDiv}>
                                <button type="button" className={styles.planBtn}>Create Meal Plans</button>
                            </div>
                        </div>
                    </div>
                    <div className={styles.share}>
                        <div className={styles.shareImg}></div>
                        <div className={styles.shareBody}>
                            <div className={styles.share_plan_title}>Share Your Creations</div>
                            <div className={styles.share_plan_description}>
                                Upload your favorite recipes and share them with the community
                            </div>
                            <div className={styles.shareBtnDiv}>
                                <button type="button" className={styles.shareBtn}>Post a Recipe</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.recipeRow}>
                    <div className={styles.recipeRowHead}>
                        <div className={styles.recipeRowTitle}>Explore Recipes</div>
                        <div className={styles.recipeRowSubtitle}>Feeling hungry? Browse through recipes enjoyed by the community </div>
                    </div>
                    <div className={styles.recipeRowBody}>
                        {
                            recipeList.map((recipe) => (
                                <RecipeCard key={recipe.recipe_id} creator_id={recipe.creator_id} creator_name={recipe.creator_name} recipe_id={recipe.recipe_id} recipe_name={recipe.recipe_name} photo_url={recipe.photo_url} calories={recipe.calories} prep_time={recipe.prep_time} />
                            ))
                        }
                    </div>
                    <div className={styles.recipeRowFooter}>
                        <button type="button" className={styles.shareBtn}>View More Recipes</button>
                    </div>
                </div>
            </div>
        </div>
    )
}