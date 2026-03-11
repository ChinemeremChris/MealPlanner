import { X } from 'lucide-react'
import styles from '../styles/shoppingRow.module.css'
export const ShoppingRow = ({ ing_data, isCrossed, handleUpdate, handleDelete, handleUpdateCrossed }) => {
    return (
        <div className={styles.ingredientBox}>
            <input type='checkbox' onChange={() => handleUpdateCrossed(ing_data.id)}/>
            <input type='text' className={`${styles.ingredientName} ${styles.inputBox} ${isCrossed ? styles.isCrossed : ''}`} value={ing_data.name} onChange={(e) => handleUpdate(ing_data.id, "name", e.target.value)}/>
            <input type='text' className={`${styles.ingredientQty} ${styles.inputBox}`} value={ing_data.totalQty} onChange={(e) => handleUpdate(ing_data.id, "totalQty", e.target.value)}/>
            <input type='text' className={`${styles.ingredientUnit} ${styles.inputBox}`} value={ing_data.unit} onChange={(e) => handleUpdate(ing_data.id, "unit", e.target.value)}/>
            <button type='button' className={styles.deleteBtn} onClick={() => handleDelete(ing_data.id)}>
                <X />
            </button>
        </div>
    )
}