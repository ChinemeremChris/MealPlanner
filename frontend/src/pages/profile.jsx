import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../contexts/UserContext'
import { RecipeCard } from '../components/recipeCard'
import { User } from 'lucide-react'
import styles from '../styles/profile.module.css'
import { Toast } from '../components/Toast'

export const Profile = () => {
    const [favoriteRecipes, setFavoriteRecipes] = useState([])
    const [favoriteIds, setFavoriteIds] = useState(new Set())
    const [myRecipes, setMyRecipes] = useState([])
    const [notification, setNotification] = useState(null)
    const { currentUser, userLoading } = useContext(UserContext)
    const navigate = useNavigate()

    //always has to be delete in this case, right?
    const toggleFavorite = async (recipe_id) => {
        const wasAlreadyFavorited = favoriteIds.has(recipe_id)
        setFavoriteIds(prev => {
            const newSet = new Set(prev)
            wasAlreadyFavorited ? newSet.delete(recipe_id) : newSet.add(recipe_id)
            return newSet
        })

        try{
            const response = await fetch(`http://localhost:8000/favorites`, {
                method: wasAlreadyFavorited ? "DELETE" : "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(recipe_id)
            })

            if (!response.ok){
                setFavoriteIds(prev => {
                    const newSet = new Set(prev)
                    wasAlreadyFavorited ? newSet.add(recipe_id) : newSet.delete(recipe_id)
                    return newSet
                })
                throw new Error ("Error toggling favorite")
            }

            const result = await response.json()
        }catch (e){
            setNotification({message: e.message, type: "error"})
        }
    }

    const handleDeleteRecipe = async (recipe_id) => {
        try{
            const response = await fetch(`http://localhost:8000/recipes`, {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(recipe_id)
            })

            if (!response.ok){
                throw new Error ("Error deleting recipe")
            }

            setMyRecipes((prev) => {
                const filtered = prev.filter((recipe) => recipe.recipe_id !== recipe_id)
                return filtered
            })

        }catch(e){
            setNotification({message: e.message, type: "error"})
        }
    }

    useEffect(() => {
        const fetchFavorites = async () => {
            try{
                const response = await fetch(`http://localhost:8000/favorites`, {
                    method: "GET",
                    credentials: "include"
                })
                if (!response.ok){
                    throw new Error ("Error loading favorite recipes")
                }
                const result = await response.json()
                let threeFaves = []
                for (let i = 0; i < 3; i++){
                    result[i] && threeFaves.push(result[i])
                }
                console.log("favorite recipes", result)
                const ids = new Set(result.map((recipe) => (recipe.recipe_id)))
                console.log("ids", ids)
                setFavoriteIds(ids)
                setFavoriteRecipes(threeFaves)
            }catch(e){
               setNotification({message: e.message, type: "error"})
            }
        }

        const fetchMyRecipes = async () => {
            try{
                const response = await fetch(`http://localhost:8000/me/recipes`, {
                    method: "GET",
                    credentials: "include"
                })

                if(!response.ok){
                    throw new Error("Error fetching created recipes")
                }

                const result = await response.json()
                const threeRecipes = []
                for (let i = 0; i < 3; i++){
                    result[i] && threeRecipes.push(result[i])
                }
                setMyRecipes(threeRecipes)
            }catch(e){
                setNotification({message: e.message, type: "error"})
            }
        }
        fetchMyRecipes()
        fetchFavorites()
    }, [])

    if (userLoading) {
        return <div className={styles.mainContainer}>Loading profile...</div>
    }
    if (!currentUser) {
        return <div className={styles.mainContainer}>Please log in</div>
    }

    return (
        <div className={styles.mainContainer}>
            <div className={styles.title}>Profile</div>
            <div className={styles.profileContainer}>
                <div className={styles.top}>
                    <div className={styles.infoImage}>
                        <div className={styles.profileImage}>
                            <User size={68} />
                        </div>
                        <div className={styles.accountInfo}>
                            <div className={styles.accountName}>{currentUser.fname}</div>
                            <div className={styles.accountEmail}>{currentUser.email}</div>
                        </div>
                    </div>
                    <button type='button' onClick={() => navigate("/settings")} className={styles.editBtn}>Edit Profile</button>
                </div>
                <div className={styles.body}>
                    <div className={styles.savedRecipes}>
                        <div className={styles.sectionTitle} onClick={() => navigate("/user/favorites")}>Saved Recipes {`>`}</div>
                        <div className={styles.recipeGrid}>
                            {
                                favoriteRecipes.map((recipe) => (
                                    <RecipeCard key={recipe.recipe_id} creator_id={recipe.actual_creator_id} creator_name={recipe.actual_creator_name} recipe_name={recipe.recipe_name} recipe_id={recipe.recipe_id} photo_url={recipe.photo_url} calories={recipe.calories} prep_time={recipe.prep_time} isFavorited={favoriteIds.has(recipe.recipe_id)} toggleFavorite={toggleFavorite} handleDeleteRecipe={handleDeleteRecipe}/>
                                ))
                            }
                        </div>
                    </div>
                    <div className={styles.myRecipes}>
                        <div className={styles.sectionTitle} onClick={() => navigate("/user/recipes")}>My Recipes {`>`} </div>
                        <div className={styles.recipeGrid}>
                            {
                                myRecipes.map((recipe) => (
                                    <RecipeCard key={recipe.recipe_id} creator_id={recipe.creator_id} creator_name={recipe.creator_name} recipe_name={recipe.recipe_name} recipe_id={recipe.recipe_id} photo_url={recipe.photo_url} calories={recipe.calories} prep_time={recipe.prep_time} isFavorited={favoriteIds.has(recipe.recipe_id)} toggleFavorite={toggleFavorite} handleDeleteRecipe={handleDeleteRecipe}/>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </div>
            {notification && <Toast message={notification.message} type={notification.type} handleClose={() => setNotification(null)} />}
        </div>
    )
}  