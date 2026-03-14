import { useState, useEffect, useContext } from "react"
import { RecipeCard } from "../components/recipeCard"
import '../styles/sharedRecipes.css'
import { Toast } from "../components/Toast"
import { SideBarHeading } from "../components/sideBarHeading"
import { RefetchContext } from "../contexts/RefetchContext"

export const MyRecipes = () => {
    const [isLoading, setisLoading] = useState(false)
    const [notification, setNotification] = useState(null)
    const [data, setData] = useState([])
    const [favoritedRecipes, setFavoritedRecipes] = useState(new Set())
    const { refetchSignal } = useContext(RefetchContext)

    useEffect(() => {
        const LoadRecipes = async () => {
            setisLoading(true);
            setNotification(null);

            try{
                const response = await fetch(`${import.meta.env.VITE_API_URL}/me/recipes`, {
                    method: "GET",
                    headers: {
                        'Content-Type' : 'application/json'
                    },
                    credentials: 'include'
                })
                
                if (response.ok){
                    const result = await response.json()
                    setData(result)
                }else{
                    const errData = await response.json()
                    throw new Error (errData.detail || "Error in loading. Try Again!")
                }
            }catch(error){
                setNotification({message: error.message, type: "error"})
            }finally{
                setisLoading(false)
            }
        }

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
                const favoriteIds = new Set(newData.map((recipe) => (recipe.recipe_id)))
                setFavoritedRecipes(favoriteIds)
            }catch(e){
                setNotification({error: e.message || "Error loading page. Try again!", type: "error"})
            }finally{
                console.log("finished shared")
            }
        }

        LoadRecipes()
        getFavorites()
    }, [refetchSignal])

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
            setNotification({message: e.message, type: "error"})
        }
    }

    const handleDeleteRecipe = async (recipe_id) => {
        const data_to_find = data.find(r => r.recipe_id === recipe_id)
        console.log("attempting to delete", data_to_find?.recipe_name, recipe_id)
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
                setNotification({message: "Delete Successful", type: "success"})
                return true
            }
        }catch(e){
            setNotification({message: e.message, type: "error"})
            return false
        }
    }



    return (
        <> 
            <SideBarHeading eyebrow={"Your Collections"} title={"My Recipes"}/>
            {data.length > 0 ? (
                <div className="recipeGrid">
                    {data.map((recipe) => (
                        <RecipeCard key={recipe.recipe_id} creator_id={recipe.creator_id} creator_name={recipe.creator_name} recipe_id={recipe.recipe_id} recipe_name={recipe.recipe_name} photo_url={recipe.photo_url} calories={recipe.calories} prep_time={recipe.prep_time} isFavorited={favoritedRecipes.has(recipe.recipe_id)} toggleFavorite={toggleFavorite} handleDeleteRecipe={handleDeleteRecipe}/>
                    ))}
                </div>
                ):(
                    <div className="emptyPage">
                        Haven't posted yet? Share your delicious ideas with us!
                    </div>
                )
            }
            {notification && <Toast message={notification.message} type={notification.type} handleClose={() => setNotification(null)} />}
        </>
    )
}