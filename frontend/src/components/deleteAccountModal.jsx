import { X } from 'lucide-react'
import styles from '../styles/deleteAccountModal.module.css'

export const DeleteAccountModal = ({ setDeleteModalOpen, handleDeleteAccount }) => {
    return (
        <div className={styles.overlay}>
            <div className={styles.modalContainer}>
                <div className={styles.modalHead}>
                    <div className={styles.modalTitle}>Delete Account</div>
                    <button type='button' className={styles.xBtn} onClick={() => setDeleteModalOpen(false)}>
                        <X />
                    </button>
                </div>
                <div className={styles.modalBody}>
                    <div className={styles.firstLine}>
                        Are you sure you want to delete your account?
                    </div>
                    <div className={styles.firstLine}>
                        This does not delete your published recipes
                    </div>
                </div>
                <div className={styles.modalBtns}>
                    <button className={styles.cancelBtn} onClick={() => setDeleteModalOpen(false)}>Cancel</button>
                    <button className={styles.deleteBtn} onClick={() => handleDeleteAccount()}>Delete</button>
                </div>
            </div>
        </div>
    )
}