import { useState, useEffect } from "react"
import { RecipeCard } from "../components/recipeCard"
import { SideBarHeading } from "../components/sideBarHeading"
import '../styles/sharedRecipes.css'
import { Toast } from "../components/Toast"

export const FavoritePage = () => {
    const [data, setData] = useState([])
    const [notification, setNotification] = useState(null)
    const [favoritedRecipes, setFavoritedRecipes] = useState(new Set())

    const handleDeleteRecipe = async (recipe_id) => {
        try{
            const response = await fetch(`${import.meta.env.VITE_API_URL}/recipes`, {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(recipe_id)
            })

            if (!response.ok){
                const errData = await response.json()
                throw new Error (errData.detail || "Error deleting recipe. Try again!")
            }

            if (response.status === 204){
                setData(prev => {
                    const filtered = prev.filter((recipe) => recipe.recipe_id !== recipe_id)
                    return filtered
                })
                setNotification({message: "Successfully deleted recipe", type:"success"})
                return true
            }
        }catch(e){
            setNotification({message: e.message, type:"error"})
            return false
        }
    }

    const toggleFavorite = async (recipe_id) => {
        const wasAlreadyFavorited = favoritedRecipes.has(recipe_id)

        setFavoritedRecipes(prev => {
            const newSet = new Set(prev)
            if (wasAlreadyFavorited){
                newSet.delete(recipe_id)
            }else{
                newSet.add(recipe_id)
            }
            return newSet
        })

        try{
            const response = await fetch(`${import.meta.env.VITE_API_URL}/favorites`, {
                method: wasAlreadyFavorited ? "DELETE" : "POST",
                credentials: "include",
                body: JSON.stringify(recipe_id),
                headers: {
                    "Content-Type": "application/json"
                }
            })

            if (!response.ok){ //rolling back in case of error
                setFavoritedRecipes(prev => {
                    const newSet = new Set(prev)
                    wasAlreadyFavorited ? newSet.add(recipe_id) : newSet.delete(recipe_id)
                    return newSet
                })
                throw new Error ("Trouble updating favorite. Try Again!")
            }
        }catch (e){
            setNotification({message: e.message, type:"error"})
        }
    }

    useEffect(() => {
        const getFavorites = async () => {
            try{
                const response = await fetch(`${import.meta.env.VITE_API_URL}/favorites`, {
                    method: "GET",
                    credentials: "include"
                })
                if (!response.ok){
                    const err = await response.json()
                    throw new Error (err)
                }
                const newData = await response.json()
                console.log("Favorites data:", newData)
                console.log("First recipe creator_id:", newData[0]?.creator_id)
                setData(newData)
                const favoriteIds = new Set(newData.map((recipe) => (recipe.recipe_id)))
                setFavoritedRecipes(favoriteIds)
            }catch(e){
                setNotification({message: e.message, type:"error"})
            }finally{
                console.log("finished shared")
            }
        }

        getFavorites()
    }, [])


    return (
        <>
            <SideBarHeading eyebrow={"Eye-catching Recipes"} title={"Bookmarked Recipes"} />
            {data.length > 0 ? (
                <div className="recipeGrid">
                    {data.map((recipe) => (
                        <RecipeCard key={recipe.recipe_id} creator_id={recipe.actual_creator_id} creator_name={recipe.actual_creator_name} recipe_id={recipe.recipe_id} recipe_name={recipe.recipe_name} photo_url={recipe.photo_url} calories={recipe.calories} prep_time={recipe.prep_time} isFavorited={favoritedRecipes.has(recipe.recipe_id)} toggleFavorite={toggleFavorite} handleDeleteRecipe={handleDeleteRecipe}/>
                    ))}
                </div>
                ):(
                    <div className="emptyPage">
                        Nothing in favorites? Browse the recipe hub for tantalizing ideas!
                    </div>
                )
            }    
            {notification && (
                <Toast message={notification.message} type={notification.type} handleClose={() => setNotification(null)}/>
            )}
        </>
    )
}