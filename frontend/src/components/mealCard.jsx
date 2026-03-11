import { X } from 'lucide-react'
import styles from '../styles/mealCard.module.css'

export const MealCard = ({ date, timeOfDay, deleteMeal, recipe }) => {
    const {recipe_name, calories, photo_url} = recipe
    return (
        <>
            <div className={styles.mealCard}>
                <div className={styles.imgDiv}>
                    <img src={`${photo_url}?tr=w-90,h-60`} alt={`${recipe_name}`} />
                </div>
                <div className={styles.recipeTitle}>{recipe_name}</div>
                <button className={styles.deleteBtn} onClick={() => deleteMeal(date, timeOfDay)}><X /></button>
            </div>
        </>
    )
}