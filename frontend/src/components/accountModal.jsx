import { useNavigate } from 'react-router-dom'
import { User, Settings, LogOutIcon } from 'lucide-react'
import styles from '../styles/accountModal.module.css'

export const AccountModal = ({ setOpenAccountModal }) => {
    const navigate = useNavigate()

    const handleProfileClick = (e) => {
        e.stopPropagation()
        setOpenAccountModal(false)
        navigate("/profile")
    }

    const handleSettingsClick = (e) => {
        e.stopPropagation()
        setOpenAccountModal(false)
        navigate("/settings")
    }

    return (
        <div className={styles.dropdown}>
            <div className={`${styles.user} ${styles.actBtn}`} onClick={(e) => handleProfileClick(e)}><User /> Profile</div>
            <div className={`${styles.settings} ${styles.actBtn}`} onClick={(e) => handleSettingsClick(e)}><Settings /> Settings</div>
            <div className={`${styles.logout} ${styles.actBtn}`}><LogOutIcon /> Logout</div>
        </div>
    )
}