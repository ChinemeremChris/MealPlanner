import { X } from 'lucide-react'
import styles from '../styles/deleteRecipeModal.module.css'

export const LogOutModal = ({ setLogOutModal, handleLogOut }) => {
    return (
        <div className={styles.overlay}>
            <div className={styles.modalContainer}>
                <div className={styles.head}>
                    <div className={styles.title}>
                        Logout
                    </div>
                    <button type='button' className={styles.cancelBtn} onClick={() => {setLogOutModal(false)}}>
                        <X />
                    </button>
                </div>
                <div className={styles.message}>
                    Are you sure you want to log out?
                </div>
                <div className={styles.bottomBtns}>
                    <button type='button' className={styles.goBackBtn} onClick={() => {setLogOutModal(false)}}>
                        Go Back
                    </button>
                    <button type='button' className={styles.deleteBtn} onClick={() => handleLogOut()}>
                        Logout
                    </button>
                </div>
            </div>
        </div>
    )
}