import { useState } from "react"
import styles from '../styles/forgot-reset-password.module.css'
import { Toast } from "../components/Toast"
export const ForgotPassword = () => {
    const [email, setEmail] = useState('')
    const [notification, setNotification] = useState(null)

    const handleSubmit = async() => {
        await fetch(`http://localhost:8000/auth/forgot-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email })
        })
        setNotification({message: "A message has been sent to your email", type: "success"})
    }

    return(
        <div className={styles.mainContainer}>
            <div className={styles.formContainer}>
                <div>
                    <div className={styles.formLabel}>Email</div>
                    <input type="email" className={styles.inputDiv} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email"/>
                </div>
                <button type="button" className={styles.btn} onClick={() => handleSubmit()} disabled={!email}>GET RESET LINK</button>
            </div>
            {notification && <Toast message={notification.message} type={notification.type} handleClose={() => setNotification(null)} /> }
        </div>
    )
}