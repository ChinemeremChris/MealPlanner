import { X } from 'lucide-react'
import styles from '../styles/unsaved.module.css'

export const UnsavedChangesModal = ({ handleCancel, handleDiscardAndLeave, handleSaveAndLeave }) => {
    return (
        <div className={styles.overlay}>
            <div className={styles.modalContainer}>
                <div className={styles.modalTop}>
                    <div style={{width: '36px'}}></div>
                    <div className={styles.modalTitle}>
                        ⚠️Unsaved Changes!
                    </div>
                    <button className={styles.cancelButton} onClick={()=>handleCancel()}>
                        <X />
                    </button>
                </div>
                <div className={styles.modalBody}>
                    <div>You have unsaved changes in your meal plan</div>
                    <div>Are you sure you want to leave this page?</div>
                </div>
                <div className={styles.modalOptions}>
                    <button type='button' className={`${styles.modalButton} ${styles.left}`} onClick={() => handleDiscardAndLeave()}>Discard Changes and Leave</button>
                    <button type='button' className={`${styles.modalButton} ${styles.right}`} onClick={() => handleSaveAndLeave()}>Save Changes</button>
                </div>
            </div>
        </div>
    )
}