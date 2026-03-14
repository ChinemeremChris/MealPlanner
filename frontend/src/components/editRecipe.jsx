import { useState, useRef, useEffect } from "react"
import { X } from 'lucide-react'
import { IngredientRow } from "./IngredientRow"
import { InstructionRow } from "./instructionRow"
import '../styles/addRecipe.css'
import { Toast } from "./Toast"
export const EditRecipeModal = ({ recipe, setEditOpen, setHasRecipeBeenUpdated }) => {
    let nextID = useRef(100)
    const [loading, setLoading] = useState(false)
    const [formRecipeName, setFormRecipeName] = useState('')
    const [formRecipeServing, setFormRecipeServing] = useState('')
    const [formRecipePrepTime, setFormRecipePrepTime] = useState('')
    const [formRecipeTag, setFormRecipeTag] = useState('')
    const [imageFile, setImageFile] = useState()
    const [notification, setNotification] = useState({})

    const [rows, setRows] = useState([{id: nextID.current++, ingredient_name: "", ingredient_quantity: "", ingredient_unit: "", ingredient_preparation_style:""}])
    const [instructionList, setInstructionList] = useState([{id: nextID.current++, instruction: ""}])

    const addRow = () => {
        setRows([...rows, {id: nextID.current++, ingredient_name: "", ingredient_quantity: "", ingredient_unit: "", ingredient_preparation_style: ""}])
    }

    const deleteRow = (deleteID) => {
        setRows(rows.filter(row => row.id !== deleteID))
    }

    const rowUpdate = (rowID, field, value) => {
        console.log(field, value)
        const copyRows = rows.map(row => row.id === rowID ? {...row, [field]: value} : row)
        setRows(copyRows)
    }

    const addInstruction = () => {
        setInstructionList([...instructionList, {id:nextID.current++, instruction: ""}])
    }

    const deleteInstruction = (deleteID) => {
        setInstructionList(instructionList.filter((instruction) => (
            instruction.id !== deleteID
        )))
    }

    const updateInstruction = (updateID, field, value) => {
        const copyInstruction = instructionList.map((instruction) => (
            instruction.id === updateID ? {...instruction, [field]: value} : instruction
        ))
        setInstructionList(copyInstruction)
    }

    const UpdateRecipe = async (e) => {
        e.preventDefault();
        const recipeData = {
            recipe_name: formRecipeName,
            prep_time: formRecipePrepTime,
            serving: formRecipeServing,
            tag: formRecipeTag
        }
        
        const ingredientData = rows.map((row) => ({
            ingredient_name: row.ingredient_name,
            ingredient_quantity: row.ingredient_quantity,
            ingredient_unit: row.ingredient_unit,
            ingredient_preparation_style: row.ingredient_preparation_style
        }))

        const instructionData = instructionList.map((instruct) => instruct.instruction)

        let form = new FormData();
        form.append('updated_recipe', JSON.stringify(recipeData))
        form.append('updated_ingredients', JSON.stringify(ingredientData))
        form.append('updated_instructions', JSON.stringify(instructionData))
        if (imageFile){
            form.append('file', imageFile)
        }

        try{
            setLoading(true)
            const response = await fetch(`${import.meta.env.VITE_API_URL}/recipes/${recipe.recipe_id}`, {
                method: "PATCH",
                body: form,
                credentials: "include"
            })

            if(response.ok){
                const data = await response.json()
                setNotification({message: "Recipe has been updated", type:"success"})
                setHasRecipeBeenUpdated(true)
            }else{
                const errData = await response.json()
                throw new Error(errData.detail || "Error updating recipe. Try again!")
            }
        }catch(e){
            setNotification({message: e.message, type: "error"})
        }finally{
            setEditOpen(false)
            setLoading(false)
        }
    }

    useEffect(() => {
        const loadData = () => {
            let currentIngList = recipe.ingredients.map((ingredient) => (
                {
                    id: nextID.current++,
                    ingredient_name: ingredient.ingredient_name,
                    ingredient_quantity: ingredient.ingredient_quantity,
                    ingredient_unit: ingredient.ingredient_unit,
                    ingredient_preparation_style: ingredient.ingredient_preparation_style
                }
            ))
            setRows(currentIngList)
            let currentInstructionList = recipe.instructions
            .sort((a, b) => a.step_number - b.step_number)
            .map((instruction) => (
                {
                    id: nextID.current++,
                    instruction: instruction.instruction_text
                }
            ))
            setInstructionList(currentInstructionList)
            setFormRecipeName(recipe.recipe_name)
            setFormRecipeServing(recipe.serving)
            setFormRecipePrepTime(recipe.prep_time)
        }
        loadData()
    }, [])    


    return (
        <div className="modalContainer">
            <div className="recipeForm">
                <button className="recipeFormClose" onClick={() => {setEditOpen(false)}}><X /></button>
                <form className="inputForm">
                    <div className="label">Recipe Name</div>
                    <input type="text" className="formRecipeName recipeInput" value={formRecipeName} onChange={(e) => {setFormRecipeName(e.target.value)}}/>
                    <div className="serviceTimeTag">
                        <div>
                            <div className="label">Serving Size</div>
                            <input type="number" className="formRecipeServing sttInput" value={formRecipeServing} onChange={(e) => {setFormRecipeServing(e.target.value)}}/>
                        </div>
                        <div>
                            <div className="label">Prep Time</div>
                            <input type="number" className="formRecipePrepTime sttInput" value={formRecipePrepTime} placeholder="in minutes" onChange={(e) => {setFormRecipePrepTime(e.target.value)}}/>
                        </div>
                        <div>
                            <div className="label">Tag</div>
                            <select className="formRecipeTag sttInput" value={formRecipeTag} onChange={(e) => {setFormRecipeTag(e.target.value)}}>
                                <option value=""></option>
                                <option value="vegetarian">Vegetarian</option>
                                <option value="vegan">Vegan</option>
                                <option value="dairy_free">Dairy-Free</option>
                                <option value="gluten_free">Gluten-Free</option>
                                <option value="quick">Quick</option>
                                <option value="keto">Keto</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <div className="subLabel">Ingredients</div>
                        {rows.map(row => (
                            <IngredientRow key={row.id} row={row} updateRow={rowUpdate} deleteRow={deleteRow}/>
                        ))}
                        <button type="button" onClick={addRow}>Add Ingredient</button>
                    </div>
                    <div>
                        <div className="subLabel">Instructions</div>
                        <div>
                            {
                                instructionList.map((instruction, index) => (
                                    <div className="instructionRow" key={instruction.id}>
                                        <div className="instructionIndex">
                                            {index+1}.
                                        </div>
                                        <InstructionRow instruction={instruction} updateInstruction={updateInstruction} deleteInstruction={deleteInstruction}/>
                                    </div>
                                ))
                            }
                        </div>
                        <button type="button" onClick={addInstruction}>Add Instruction</button>
                    </div>
                    <div>
                        <div className="subLabel">Upload Image (Optional)</div>
                        <div>
                            <input type="file" accept="image/*" onChange={(e) => {setImageFile(e.target.files[0])}} />
                            {imageFile && <img src={URL.createObjectURL(imageFile)} alt="preview" style={{ maxWidth:"100%", borderRadius:"8px" }} />}
                        </div>
                    </div>
                    <button type="button" disabled={loading} className="recipeSaveBtn" onClick={(e) => UpdateRecipe(e)}>{loading? 'Updating...' : 'Update Recipe'}</button>
                </form>
            </div>
            {notification && <Toast message={notification.message} type={notification.type} handleClose={() => setNotification(null)} />}
        </div>
    )
}