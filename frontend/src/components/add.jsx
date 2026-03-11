import { useState, useContext } from 'react'
import { AddRecipeModal } from './addRecipe'
import { RefetchContext } from '../contexts/RefetchContext'
import '../styles/add.css'

export const AddButton = () => {
    const [addOpen, setAddOpen] = useState(false)
    const { triggerRefetch } = useContext(RefetchContext)
    return (
        <>
            {addOpen && <AddRecipeModal setAddOpen={setAddOpen} triggerRefetch={triggerRefetch}/>}
            <button className="addButton" onClick={() => {setAddOpen(true)}}>+ Recipe</button>
        </>
    )
}