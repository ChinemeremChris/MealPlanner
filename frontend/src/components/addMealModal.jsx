import { useState } from 'react'
import { X } from 'lucide-react'
import { SearchBar } from './search'
import { RecipeMealCard } from './recipeMealCard'
import styles from '../styles/addMealModal.module.css'
import { Toast } from './Toast'

export const MealModal = ({ setAddMeal, selectedSlot, setMealPlan }) => {
    const [recipeList, setRecipeList] = useState([])
    const [notification, setNotification] = useState(null)
    const onSearch = async (searchTerm) => {
        setNotification(null)
        try{
            const response = await fetch(`${import.meta.env.VITE_API_URL}/search?search_term=${searchTerm}`, {
                method: "GET",
                credentials: "include"
            })

            if (!response.ok){
                const errData = await response.json()
                throw new Error(errData.detail || "Search failed")
            }
            const data = await response.json()
            const recipes = data.recipes
            console.log("data", data)
            setRecipeList(recipes.map((recipe) => ({
                recipe_id: recipe.recipe_id,
                recipe_name: recipe.recipe_name,
                prep_time: recipe.prep_time,
                calories: recipe.calories,
                photo_url: recipe.photo_url
            })))
        }catch(e){
            setNotification({message: e.message, type: "error"})
            setRecipeList([])
        }finally{
            console.log("finished")
        }
    }

    const handleMealAdd = (recipe) => {
        let slot = `${selectedSlot.date}-${selectedSlot.timeOfDay}`
        setMealPlan((prev) => ({...prev, [slot]: recipe}))
        setAddMeal(false)
    }

    return (
        <>
            <div className={styles.mainModalContainer}>
                <div className={styles.modalBox}>
                    <div className={styles.topBar}>
                        <SearchBar onSearch={onSearch}/>
                        <button className={styles.closeButton} onClick={() => {setAddMeal(false)}}><X /></button>
                        <div></div>
                    </div>
                    <div className={styles.recipeResults}>
                        {recipeList.length === 0 && <p>Search for recipes</p>}
                        {
                            recipeList.map((recipe) => (
                                <RecipeMealCard key={recipe.recipe_id} recipe={recipe} handleMealAdd={handleMealAdd}/>
                            ))
                        }
                    </div>
                </div>
            </div>
            {notification && <Toast message={notification.message} type={notification.type} handleClose={() => setNotification(null)} />}
        </>
    )
}