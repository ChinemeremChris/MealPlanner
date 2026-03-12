import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Settings, LogOutIcon } from 'lucide-react'
import { LogOutModal } from './logoutModal'
import styles from '../styles/accountModal.module.css'
import { UserContext } from '../contexts/UserContext'
import { Toast } from './Toast'

export const AccountModal = ({ setOpenAccountModal }) => {
    const [notification, showNotification] = useState(null)
    const [logoutModal, setLogOutModal] = useState(false)
    const { refreshUser } = useContext(UserContext)
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

    const onClickLogOut = (e) => {
        e.stopPropagation()
        setLogOutModal(true)
    }

    const handleLogOut = async () => {
        try{
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/jwt/logout`, {
                method: "POST",
                credentials: "include"
            })
            if (!response.ok){
                throw new Error ("Cannot logout at this time. Try again!")
            }else{
                refreshUser()
                navigate("/login")
            }
            
        }catch(e){
            showNotification({message: e.message, type: "error"})
        }
    }

    return (
        <div className={styles.dropdown}>
            {logoutModal && <LogOutModal setLogOutModal={setLogOutModal} handleLogOut={handleLogOut} />}
            <div className={`${styles.user} ${styles.actBtn}`} onClick={(e) => handleProfileClick(e)}><User /> Profile</div>
            <div className={`${styles.settings} ${styles.actBtn}`} onClick={(e) => handleSettingsClick(e)}><Settings /> Settings</div>
            <div className={`${styles.logout} ${styles.actBtn}`} onClick={(e) => onClickLogOut(e)}><LogOutIcon /> Logout</div>
            {notification && <Toast message={notification.message} type={notification.type} handleClose={() => showNotification(null)} />}
        </div>
    )
}