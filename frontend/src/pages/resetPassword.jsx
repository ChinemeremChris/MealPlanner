import { useState } from 'react'
import styles from '../styles/forgot-reset-password.module.css'
import { Toast } from '../components/Toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
export const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [notification, setNotification] = useState(null)
    const [matchError, setMatchError] = useState(null)
    const [openSections, setOpenSections] = useState({
        showNewPassword: false,
        showConfirmPassword: false
    })
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const token = searchParams.get("token")


    const toggleSection= (section) => {
        setOpenSections((prev) => (
            {
                ...prev,
                [section]: !prev[section]
            }
        ))
    }

    const handleNewPassword = (e) => {
        const newVal = e.target.value
        setNewPassword(newVal)
        if(confirmPassword && newVal !== newPassword){
            setMatchError("New password must match!")
        }else{
            setMatchError(null)
        }
    }

    const handleConfirmPassword = (e) => {
        const newVal = e.target.value
        setConfirmPassword(newVal)
        if(newVal !== newPassword){
            setMatchError("New password must match!")
        }else{
            setMatchError(null)
        }
    }

    const handleSubmit = async() => {
        try{
            const response = await fetch(`http://localhost:8000/auth/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token,
                    password: newPassword
                })
            })
            if (!response.ok){
                const errData = await response.json()
                throw new Error("Error resetting password. Try again!")
            }
            navigate("/login")
        }catch(e){
            setNotification({message: e.message, type: "error"})
        }
    }

    return (
        <div className={styles.mainContainer}>
            <div className={styles.formContainer}>
                <div className={styles.passwordDiv}>
                    <div className={styles.formLabel}>New Password</div>
                    <div className={styles.passwordWrapper}>
                        <input type={openSections.showNewPassword ? 'text' : 'password'} className={styles.passwordInput} value={newPassword} onChange={(e) => handleNewPassword(e)} />
                        <button type="button" className={styles.togglePassword} onClick={() => toggleSection('showNewPassword')}>{openSections.showNewPassword ? <EyeOff /> : <Eye />}</button>
                    </div>
                </div>
                <div className={styles.passwordDiv}>
                    <div className={styles.formLabel}>Confirm New Password</div>
                    <div className={styles.passwordWrapper}>
                        <input type={openSections.showConfirmPassword ? 'text' : 'password'} className={styles.passwordInput} value={confirmPassword} onChange={(e) => handleConfirmPassword(e)} />
                        <button type="button" className={styles.togglePassword} onClick={() => toggleSection('showConfirmPassword')}>{openSections.showConfirmPassword ? <EyeOff /> : <Eye />}</button>
                    </div>
                </div>
                {matchError && <div className={styles.matchError}>{`${matchError}`}</div>}
                <button type='button' className={styles.btn} onClick={() => handleSubmit()} disabled={matchError || !confirmPassword}>RESET PASSWORD</button>
            </div>
            {notification && <Toast message={notification.message} type={notification.type} handleClose={() => setNotification(null)} />}
        </div>
    )
}