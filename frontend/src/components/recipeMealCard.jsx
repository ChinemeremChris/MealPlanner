import styles from '../styles/recipeMealCard.module.css'

export const RecipeMealCard = ({ recipe, handleMealAdd }) => {
    const { recipe_name, calories, prep_time, photo_url } = recipe
    console.log(recipe_name, calories, prep_time, photo_url)
    return (
        <>
            <div className={styles.card}>
                <div className={styles.cardImage}>
                    <img src={`${photo_url}?tr=w-200,h-200,c-at_max`} alt='recipe' />
                </div>
                <div className={styles.cardInfo}>
                    <div className={styles.recipeTitle}>{recipe_name}</div>
                    <div className={styles.timeCalories}>
                        <div className={styles.prepTime}>Prep time: {prep_time} minutes</div>
                        <div className={styles.calories}>Calories: {calories} kCal</div>
                    </div>
                </div>
                <button className={styles.addButton} onClick={() => handleMealAdd(recipe)}>+</button>
            </div>
        </>
    )
}