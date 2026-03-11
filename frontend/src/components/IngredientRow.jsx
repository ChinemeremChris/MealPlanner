import { X } from 'lucide-react'
import '../styles/inputRows.css'

export const IngredientRow = ({ row, updateRow, deleteRow }) => {
    return (
        <div className='ingredientRow'>
            <div>
                <div className='labelIngRow'>Name</div>
                <input type="text" value={row.ingredient_name} onChange={(e)=>{updateRow(row.id, "ingredient_name", e.target.value)}} />
            </div>
            <div>
                <div className='labelIngRow'>Quantity</div>
                <input type="number" className='quantity' value={row.ingredient_quantity} onChange={(e)=>{updateRow(row.id, "ingredient_quantity", e.target.value)}} />
            </div>
            <div>
                <div className='labelIngRow'>Measurement Unit</div>
                <input type="text" placeholder="(e.g. lbs, cup, tbsp, whole, etc)" value={row.ingredient_unit} onChange={(e)=>{updateRow(row.id, "ingredient_unit", e.target.value)}} />
            </div>
            <div>
                <div className='labelIngRow'>Preparation</div>
                <input type="text" placeholder="(e.g. raw, sauteed, grilled, boiled, etc.)" value={row.ingredient_preparation_style} onChange={(e)=>{updateRow(row.id, "ingredient_preparation_style", e.target.value)}} />
            </div>
            <button type="button" className="deleteIngRow" onClick={() => deleteRow(row.id)}> <X /> </button>
        </div>
    )
}