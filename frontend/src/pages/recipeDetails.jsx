import { useNavigate, useParams } from "react-router-dom"
import { useEffect, useState, useContext } from "react"
import { UserContext } from "../contexts/UserContext"
import { User, Atom, Tag, Timer, Bookmark, Pencil, Trash2 } from "lucide-react"
import { EditRecipeModal } from "../components/editRecipe"
import { DeleteConfirmationModal } from "../components/deleteConfirmationModal"
import styles from '../styles/recipeDetails.module.css'
import { Toast } from "../components/Toast"

export const RecipeDetails = () => {
    const width = 1800
    const height = 200
    const { recipe_id } = useParams()
    const [data, setData] = useState()
    const [notification, setNotification] = useState(null)
    const [editOpen, setEditOpen] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const { currentUser, userLoading } = useContext(UserContext)
    const [isFavorited, setIsFavorited] = useState(false)
    const [hasRecipeBeenUpdated, setHasRecipeBeenUpdated] = useState(false)
    const navigate = useNavigate()

    const toggleFavorite = async () => {
        console.log("toggling favorite")
        try{
            const response = await fetch(`http://localhost:8000/favorites/`, {
                method: isFavorited ? "DELETE" : "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(recipe_id)
            })
            if (!response.ok){
                throw new Error ("Error updating favorite")
            }
            const result = await response.json()
            setIsFavorited(!isFavorited)
        }catch (e){
            setNotification({message: e.message, type: "error"})
        }
    }

    const handleDelete = () => {
        setDeleteModalOpen(true)
    }

    const deleteRecipe = async () => {
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
            setNotification({message: "Successfully deleted recipe", type: "success"})

            navigate("http://localhost:5173/user/recipes")
        }catch (e){
            setNotification({message: e.message, type: "error"})
        }
    }

    useEffect(() => {
        const fetchRecipe = async () => {
            try{
                const response = await fetch(`http://localhost:8000/recipes/${recipe_id}`, {
                    method: 'GET',
                    credentials: 'include'
                })
                if (response.ok){
                    const newData = await response.json()
                    setData(newData)
                }else{
                    const errData = await response.json()
                    throw new Error(errData.detail)
                }
            }catch(e){
                setNotification({message: e.message, type: "error"})
            }finally{
                console.log("finally")
            }
        }
        fetchRecipe()
    }, [recipe_id, hasRecipeBeenUpdated])

    useEffect(() => {
        const checkIfFavorite = async () => {
            console.log("checking if favorite")
            try{
                const response = await fetch(`http://localhost:8000/favorites/${recipe_id}`, {
                    method: "GET",
                    credentials: "include"
                })
                if (!response.ok){
                    throw new Error ("Error fully loading page")
                }
                const result = await response.json()
                setIsFavorited(result)
            }catch(e){
                setNotification({message: e.message, type: "error"})
            }
        }

        checkIfFavorite()
    }, [recipe_id])

    return (
        <>
            {editOpen && <EditRecipeModal recipe={data} setEditOpen={setEditOpen} setHasRecipeBeenUpdated={setHasRecipeBeenUpdated}/>}
            {deleteModalOpen && <DeleteConfirmationModal recipe_name={data.recipe_name} deleteRecipe={deleteRecipe} setDeleteModalOpen={setDeleteModalOpen}/>}
            {data &&
                <div className={styles.fullScreen}> 
                    <div className={styles.recipeImage}>
                        <img src={`${data.photo_url}?tr=w-${width},h-${height}`} />
                    </div>
                    <div className={styles.recipeArea}>
                        <div className={styles.recipeTitleLine}>
                            <div className={styles.recipeTitle}>
                                {`${data.recipe_name}`}
                            </div>
                            <div className={styles.btnOptions}>
                                {currentUser?.id === data.creator_id && (
                                    <button type="button" className={`${styles.editBtn} ${styles.titleBtn}`} onClick={() => setEditOpen(true)}>
                                        <span><Pencil /></span> <span>Edit</span>
                                    </button>
                                )}
                                <button type="button" className={`${styles.bookmarkBtn} ${styles.titleBtn}`} onClick={() => toggleFavorite()}>
                                    <Bookmark fill={isFavorited ? "darkgreen" : "#f5f5f5"}/>
                                </button>
                                {currentUser?.id === data.creator_id && (
                                    <button type="button" className={`${styles.deleteBtn} ${styles.titleBtn}`} onClick={() => handleDelete()}>
                                        <Trash2 />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className={styles.details_img}>
                            <div className={styles.recipeInfo}>
                                <div className={`${styles.creatorName} ${styles.topInfo}`}>
                                    <div className={styles.label}><User /> Creator</div>
                                    <div className={styles.value}>{`${data.creator_name}`}</div>
                                </div>
                                <div className={`${styles.calories} ${styles.topInfo}`}>
                                    <div className={styles.label}><Atom /> Calories</div>
                                    <div className={styles.value}>{`${data.calories} kCal`}</div>
                                </div>
                                <div className={`${styles.prepTime} ${styles.topInfo}`}>
                                    <div className={styles.label}><Timer /> Prep Time</div>
                                    <div className={styles.value}>{`${data.prep_time} minutes`}</div>
                                </div>
                                <div className={`${styles.tag} ${styles.topInfo}`}>
                                    <div className={styles.label}><Tag /> Tag</div>
                                    <div className={styles.value}>{`${data.tag}`}</div>
                                </div>
                            </div>
                            <div className={styles.recipeImg}>
                                <img src={`${data.photo_url}?tr=w-1200,h-400,c-at_max`} />
                            </div>
                        </div>
                        <div className={styles.body}>
                            <div className={styles.recipeIng}>
                                <div className={styles.subTitle}>Ingredients</div>
                                <ul>
                                {
                                    data.ingredients.map((ing) => (
                                        <li key={ing.ingredient_id}>
                                            {`${ing.ingredient_preparation_style ? ing.ingredient_preparation_style : ''} ${ing.ingredient_name}: (${ing.ingredient_quantity} ${ing.ingredient_unit? ing.ingredient_unit : 'unit'})`}
                                        </li>
                                    ))
                                }
                                </ul>
                            </div>
                            <div className={styles.instructions}>
                                <div className={styles.subTitle}>Instructions</div>
                                <div>
                                    {
                                        [...data.instructions]
                                        .sort((a, b) => a.step_number - b.step_number)
                                        .map((instruction) => (
                                            <div key={instruction.step_number}>
                                                {`${instruction.step_number}. ${instruction.instruction_text}`}
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </div>
                    </div> 
                </div>
            }
            {notification && <Toast message={notification.message} type={notification.type} handleClose={() => setNotification(null)} />}
        </>
    )
}