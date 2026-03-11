import { X } from 'lucide-react'
import styles from '../styles/deleteRecipeModal.module.css'

export const DeleteRecipeModal = ({ setDeleteModal, handleDelete }) => {
    return (
        <div className={styles.overlay}>
            <div className={styles.modalContainer}>
                <div className={styles.head}>
                    <div className={styles.title}>
                        Delete Recipe
                    </div>
                    <button type='button' className={styles.cancelBtn} onClick={() => {setDeleteModal(false)}}>
                        <X />
                    </button>
                </div>
                <div className={styles.message}>
                    Are you sure you want to delete this recipe?
                </div>
                <div className={styles.bottomBtns}>
                    <button type='button' className={styles.goBackBtn} onClick={() => {setDeleteModal(false)}}>
                        Go Back
                    </button>
                    <button type='button' className={styles.deleteBtn} onClick={() => handleDelete()}>
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
}