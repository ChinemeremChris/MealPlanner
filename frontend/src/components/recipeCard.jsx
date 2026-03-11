import { useNavigate } from 'react-router-dom';
import { useState, useContext } from 'react';
import { Bookmark, Trash2, User, Atom, Timer } from 'lucide-react';
import { UserContext } from '../contexts/UserContext';
import '../styles/recipeCard.css'
import { DeleteConfirmationModal } from './deleteConfirmationModal';

export const RecipeCard = ({ creator_id, creator_name, recipe_id, recipe_name, photo_url, calories, prep_time, isFavorited=false, toggleFavorite=null, handleDeleteRecipe=null }) => {
    const { currentUser, userLoading } = useContext(UserContext)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const width = 250;
    const height = 300;
    const navigate = useNavigate()

    if (userLoading){
        return(
            <div className='recipeCard'>
                Loading...
            </div>
        )
    }

    const canDelete = currentUser && currentUser.id === creator_id

    const handleDeleteBtn = (e) => {
        e.stopPropagation()
        setDeleteModalOpen(true)
    }

    const deleteRecipe = async () => {
        const success = await handleDeleteRecipe(recipe_id)
        if (success){
            setNotification({message: "Successfully deleted recipe", type: "success"})
            setDeleteModalOpen(false)
        }else{
            setNotification({message: "Failed to delete recipe", type: "error"})
        }
    }

    return (
        <>
            {deleteModalOpen && <DeleteConfirmationModal recipe_name={recipe_name} setDeleteModalOpen={setDeleteModalOpen} deleteRecipe={deleteRecipe}/>}
            <div className="recipeCard" onClick={() => (navigate(`/recipes/${recipe_id}`))}>
                <div className="recipeImage">
                    {photo_url && <img src={`${photo_url}`}/>}
                    {(handleDeleteRecipe || toggleFavorite) && (
                        <div className='delete-bookmark-btns'>
                            <button type='button' 
                                onClick={(e) => {
                                    e.stopPropagation() 
                                    toggleFavorite(recipe_id)
                                }} 
                                className= 'recipeCardBookmark'>
                                <Bookmark fill={isFavorited ? `green`: `transparent`}/>
                            </button>
                            {canDelete && 
                                <button type='button' onClick={(e) => {handleDeleteBtn(e)}} className='deleteRecipeBtn'>
                                    <Trash2 size={19}/>
                                </button>}
                        </div>
                    )}
                </div>
                <div className='recipeBody'>
                    <div className='recipeTitle'>{recipe_name}</div>
                    <div className='recipeCardInfo'>
                        <div className='recipeInfoAuthor'>
                            <div className='recipeCardAuthorImg'>
                                <User color='black' fill='black'/>
                            </div>
                            {creator_name}
                        </div>
                    </div>
                    <div className='recipeCardFooter'>
                        <div className='recipeCardCalorie'>
                            <Atom />
                            <div className='recipeCardNumber'>{calories}</div>
                            <div className='recipeCardLabel'>KCAL</div>
                        </div>
                        <div className='recipeCardPrepTime'>
                            <Timer />
                            <div className='recipeCardNumber'>{prep_time}</div>
                            <div className='recipeCardLabel'>MIN</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}