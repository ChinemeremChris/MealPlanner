import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { UserContext } from "../contexts/UserContext"
import styles from '../styles/OAuthHandler.module.css'
import { Toast } from "../components/Toast"

export const OAuthHandler = () => {
    const [fname, setFname] = useState('')
    const [lname, setLname] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [notification, setNotification] = useState(null)
    const { currentUser, userLoading } = useContext(UserContext)
    const navigate = useNavigate()

    const handleSaveProfile = async (e) => {
        e.preventDefault()
        const user_data = {
            fname: fname,
            lname: lname,
            password_string: password,
            email: ""
        }

        try{
            setLoading(true)
            const response = await fetch(`${import.meta.env.VITE_API_URL}/users/me/profile`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(user_data)
            })

            if (!response.ok){
                throw new Error ("Error completing profile")
            }

            const result = await response.json()
            navigate("/")
        }catch(e){
            setNotification({message: e.message, type: "error"})
        }finally{
            setLoading(false)
        }
    }
    
    useEffect(() => {
        if (userLoading || !currentUser){
            return
        }
        if (!userLoading && currentUser?.fname && currentUser?.lname){
            navigate("/")
        }
        if(!userLoading && (!currentUser?.fname || !currentUser?.lname)){
            setFname(() => (
                currentUser?.fname ? currentUser?.fname : ''
            ))
            setLname(() => (
                currentUser?.lname ? currentUser?.lname : ''
            ))
            setEmail(() => (
                currentUser?.email ? currentUser?.email : ''
            ))
        }
    }, [userLoading, currentUser])

    if (userLoading || !currentUser) {
        return <div className={styles.mainContainer}>Loading profile...</div>
    }

    return (
        <div className={styles.mainContainer}>
            <div className={styles.formContainer}>
                <div className={styles.formHead}>
                    <div className={styles.formTitle}>
                        Complete Your Profile
                    </div>
                    <div className={styles.subTitle}>
                        Please enter the following details to finalize your account creation
                    </div>
                </div>
                <div className={styles.formContent} onSubmit={(e) => handleSaveProfile(e)}>
                    <form className={styles.profileForm}>
                        <div className={styles.inputDiv}>
                            <div className={styles.label}>First Name</div>
                            <input type="text" placeholder="Enter your first name" value={fname} onChange={(e) => setFname(e.target.value)} className={`${styles.firstName} ${styles.inputSection}`}/>
                        </div>
                        <div className={styles.inputDiv}>
                            <div className={styles.label}>Last Name</div>
                            <input type="text" placeholder="Enter your last name" value={lname} onChange={(e) => setLname(e.target.value)} className={`${styles.lastName} ${styles.inputSection}`}/>
                        </div>
                        <div className={styles.inputDiv}>
                            <div className={styles.label}>Email</div>
                            <input type="email" placeholder="Enter your email" value={email} disabled={true} className={`${styles.email} ${styles.inputSection}`}/>
                        </div>
                        <div className={styles.inputDiv}>
                            <div className={styles.label}>Create a password (Optional)</div>
                            <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${styles.password} ${styles.inputSection}`}/>
                        </div>
                        <button className={styles.submitForm} disabled={loading}>{loading ? `Saving...` : `Save Profile`}</button>
                    </form>
                </div>
            </div>
            {notification && <Toast message={notification.message} type={notification.type} handleClose={() => setNotification(null)} />}
        </div>
    )
}