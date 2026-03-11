import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RecipeCard } from "../components/recipeCard";
import { UserCard } from "../components/userCard";
import styles from '../styles/searchResults.module.css'
import { Toast } from "../components/Toast";
import { RefetchContext } from "../contexts/RefetchContext";

export const SearchResults = () => {
    const [users, setUsers] = useState([])
    const [recipes, setRecipes] = useState([])
    const [activeTab, setActiveTab] = useState('recipes')
    const [notification, setNotification] = useState(null)
    const [searchParams] = useSearchParams()
    const searchTerm = searchParams.get('q')
    const [favoritedRecipes, setFavoritedRecipes] = useState(new Set())
    const { refetchSignal } = useContext(RefetchContext)

    const toggleFavorite = async (recipe_id) => {
        const wasAlreadyFavorited = favoritedRecipes.has(recipe_id)
        setFavoritedRecipes((prev) => {
            const newSet = new Set(prev)
            wasAlreadyFavorited ? newSet.delete(recipe_id) : newSet.add(recipe_id)
            return newSet
        })

        try{
            const response = await fetch(`http://localhost:8000/favorites`, {
                method: wasAlreadyFavorited ? "DELETE" : "POST",
                credentials: "include",
                body: JSON.stringify(recipe_id),
                headers: {
                    "Content-Type": "application/json"
                }
            })
            if (!response.ok){
                const data = await response.json()
                setFavoritedRecipes((prev) => {
                    const newSet = new Set(prev)
                    wasAlreadyFavorited ? newSet.add(recipe_id): newSet.delete(recipe_id) //roll back
                    return newSet
                })
                throw new Error (data.details || "Couldn't update favorite")
            }
        }catch(e){
            console.log(e.message)
        }
    }

    useEffect(() => {
        const fetchSearch = async () => {
            console.log("search term", searchTerm)
            try{
                const response = await fetch(`http://localhost:8000/search?search_term=${searchTerm}`, {
                    method: "GET",
                    credentials: "include"
                })
                if (!response.ok){
                    throw new Error ("Problem with search. Try again!")
                }
                const data = await response.json()
                setRecipes(data.recipes || [])
                setUsers(data.users || [])
                console.log("users", data.users)
            }catch (e){
                setNotification({message: e.message, type: "error"})
            }
        }
        fetchSearch()
    }, [searchTerm, refetchSignal])

    useEffect(() => {
        const getFavorites = async () => {
            try{
                const response = await fetch("http://localhost:8000/favorites", {
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
                setNotification({message: e.message, type: "error"})
            }finally{
                console.log("finished shared")
            }
        }
        getFavorites()
    }, [])

    return (
        <div className={styles.mainContainer}>
            <div className={styles.tabs}>
                <button type="button" className={activeTab === 'recipes' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('recipes')}>
                    Recipes ({recipes.length})
                </button>
                <button type="button" className={activeTab === 'users' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('users')}>
                    Users ({users.length})
                </button>
            </div>

            {activeTab === 'recipes' && (
                <div className={styles.recipeGrid}>
                    {recipes.map((recipe) => (
                        <RecipeCard key={recipe.recipe_id} creator_id={recipe.creator_id} creator_name={recipe.creator_name} recipe_id={recipe.recipe_id} recipe_name={recipe.recipe_name} photo_url={recipe.photo_url} calories={recipe.calories} prep_time={recipe.prep_time} isFavorited={favoritedRecipes.has(recipe.recipe_id)} toggleFavorite={toggleFavorite}/>
                    ))}
                </div>
            )}

            {activeTab === 'users' && (
                <div className={styles.userGrid}>
                    {users.map((user) => (
                        <UserCard key={user.id} fname={user.fname} lname={user.lname} recipe_count={user.recipe_count}/>
                    ))}
                </div>
            )}
            
            {notification && <Toast message={notification.message} type={notification.type} handleClose={() => setNotification(null)} />}
        </div>
    )
}