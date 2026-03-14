import { X } from 'lucide-react'
import styles from '../styles/deleteConfirmationModal.module.css'
import { useState } from 'react'

export const DeleteConfirmationModal = ({ recipe_name, deleteRecipe, setDeleteModalOpen }) => {
    const [deleting, setDeleting]= useState(false)
    const handleDeleteRecipe = async () => {
        setDeleting(true)
        await deleteRecipe()
    }
    return(
        <div className={styles.overlay}>
            <div className={styles.deleteModal}>
                <div className={styles.titleLine}>
                    <div className={styles.title}>
                        {`Delete ${recipe_name}`}
                    </div>
                    <button className={styles.xButton} onClick={() => setDeleteModalOpen(false)}>
                        <X />
                    </button>
                </div>
                <div className={styles.body}>
                    Are you sure you want to delete this recipe?
                </div>
                <div className={styles.btnOptions}>
                    <button className={styles.cancelBtn} onClick={() => setDeleteModalOpen(false)}>
                        Cancel
                    </button>
                    <button className={styles.deleteBtn} onClick={() => handleDeleteRecipe()} disabled={deleting}>
                        {deleting ? `Deleting...` : `Delete`}
                    </button>
                </div>
            </div>
        </div>
    )
}