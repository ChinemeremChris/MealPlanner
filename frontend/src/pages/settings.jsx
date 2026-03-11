import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { UserContext } from "../contexts/UserContext"
import { DeleteAccountModal } from "../components/deleteAccountModal"
import { User, Users, ShieldCheck, Wrench, HatGlasses, TriangleAlert, ChevronDown, ChevronRight, Mail, EyeOff, Eye, Trash2 } from 'lucide-react'
import styles from '../styles/settings.module.css'
import { Toast } from "../components/Toast"

export const Settings = () => {
    const { currentUser, userLoading } = useContext(UserContext)
    const navigate = useNavigate()
    const [fname, setFname] = useState('')
    const [lname, setLname] = useState('')
    const [email, setEmail] = useState('')
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [notification, setNotification] = useState(null)
    const [confirmError, setConfirmError] = useState('')
    const [mealPlanSwitch, setMealPlanSwitch] = useState(false)
    const [groceryReminder, setGroceryReminder] = useState(false)
    const [profilePrivacy, setProfilePrivacy] = useState(false)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [openSections, setOpenSections] = useState({
        profile: false,
        security: false,
        preferences: false,
        privacy: false,
        danger: false,
        change_password: false,
        showPassword: false,
        showNewPassword: false,
        showConfirmPassword: false
    })

    useEffect(() => {
        if (currentUser){
            setFname(currentUser?.fname)
            setLname(currentUser?.lname)
            setEmail(currentUser?.email)
            setProfilePrivacy(currentUser?.searchable)
        }
    }, [currentUser])

    const toggleSection = (section) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }))
    }

    const handleNewPassword = (e) => {
        const newVal = e.target.value
        setConfirmError('')
        setNewPassword(newVal)
        if(confirmPassword && newVal !== confirmPassword){
            setConfirmError("New password must match!")
        }else{
            setConfirmError('')
        }
    }

    const handleConfirmPassword = (e) => {
        const newVal = e.target.value
        setConfirmError('')
        setConfirmPassword(newVal)
        if(newVal !== newPassword){
            setConfirmError("New password must match!")
        }else{
            setConfirmError('')
        }
    }

    const savePasswordChange = async() => {
        try{
            setIsLoading(true)
            const response = await fetch(`http://localhost:8000/users/me/change-password`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            })
            
            if (!response.ok){
                const errData = await response.json()
                throw new Error(errData.detail || "Error setting password. Try Again!")
            }
            
            const result = await response.json()
            setNotification({message: "Password has been changes", type: "success"})
        }catch(e){
            setNotification({message: e.message, type: "error"})
        }finally{
            setIsLoading(false)
        }
    }

    const saveProfileInfo = async () => {
        const profile_data = {
            fname: fname,
            lname: lname,
            password_string: "",
            email: currentUser?.is_oauth_user ? "" : email
        }

        try{
            setIsLoading(true)
            const response = await fetch(`http://localhost:8000/users/me/profile`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(profile_data)
            })
            
            if (!response.ok){
                throw new Error("Error updating profile")
            }

            const result = await response.json()
            setNotification({message: "Profile successfully updated", type: "success"})
        }catch (e){
            setNotification({message: e.message, type: "error"})
        }finally{
            setIsLoading(false)
        }
    }

    const handleDeleteAccount = async () => {
        try{
            const response = await fetch(`http://localhost:8000/users/me/delete-account`, {
                method: "DELETE",
                credentials: "include"
            })
            
            if(!response.ok){
                throw new Error("Error deleting account")
            }else{
                setNotification({message: "Account successfully deleted", type: "success"})
                navigate("/login")
            }

            const result = await response.json()
        }catch(e){
            setNotification({message: e.message, type: "error"})
        }
    }

    if (userLoading || !currentUser){
        return <div className={styles.mainContainer}>Loading Profile...</div>
    }

    return (
        <div className={styles.mainContainer}>
            {deleteModalOpen && <DeleteAccountModal setDeleteModalOpen={setDeleteModalOpen} handleDeleteAccount={handleDeleteAccount} />}
            <div className={styles.settingsHeader}>
                Settings
            </div>
            <div className={styles.settingsBody}>
                <div className={styles.sideBar}>
                    <div className={styles.sideBarItem} onClick={() => toggleSection('profile')}><Users size={24}/> Profile</div>
                    <div className={styles.sideBarItem} onClick={() => toggleSection('security')}><ShieldCheck size={24}/> Security</div>
                    <div className={styles.sideBarItem} onClick={() => toggleSection('preferences')}><Wrench size={24}/> Preferences</div>
                    <div className={styles.sideBarItem} onClick={() => toggleSection('privacy')}><HatGlasses size={24}/> Privacy</div>
                    <div className={styles.sideBarItem} onClick={() => toggleSection('danger')}><TriangleAlert size={24}/> Danger Zone</div>
                </div>
                <div className={styles.mainSettings}>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader} onClick={() => toggleSection('profile')}>
                            <div className={styles.iconTitle}>
                                <div className={styles.icon}><Users size={24}/></div>
                                <div className={styles.sectionTitle}>Profile</div>
                            </div>
                            {openSections.profile ? <ChevronDown /> : <ChevronRight />}
                        </div>
                        <div className={openSections.profile? styles.profileContent : styles.contentClosed}>
                            <div className={styles.profileImg}>
                                <User size={60} />
                            </div>
                            <div className={styles.userInfo}>
                                <div className={styles.fnameDiv}>
                                    <div className={styles.inputLabel}>First Name</div>
                                    <input type="text" className={styles.fnameInput} value={fname} onChange={(e) => setFname(e.target.value)} placeholder="Enter first name"/>
                                </div>
                                <div className={styles.lnameDiv}>
                                    <div className={styles.inputLabel}>Last Name</div>
                                    <input type="text" className={styles.lnameInput} value={lname} onChange={(e) => setLname(e.target.value)} placeholder="Enter last name"/>
                                </div>
                                <div className={styles.emailDiv}>
                                    <div className={styles.inputLabel}>Email</div>
                                    <div className={styles.inputWrapper}>
                                        <input type="email" className={styles.emailInput} value={email} disabled={currentUser?.is_oauth_user} onChange={(e) => setEmail(e.target.value)} placeholder="Enter first name"/>
                                        {currentUser?.is_oauth_user ? 
                                        (
                                            <div className={styles.oauthBadge}>
                                                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" width="20" height="20"/>
                                                <div>Connected via Google</div>
                                            </div>
                                        ) : (
                                            <div className={styles.oauthBadge}>
                                                <Mail />
                                                <div>Connected via Email</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className={styles.buttonDiv}>
                                    <button className={styles.saveChanges} disabled={isLoading} onClick={() => saveProfileInfo()}>{isLoading ? `Saving...` : `Save Changes`}</button>
                                </div>
                            </div>

                        </div>
                    </div>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader} onClick={() => toggleSection('security')}>
                            <div className={styles.iconTitle}>
                                <div className={styles.icon}><ShieldCheck size={24}/></div>
                                <div className={styles.sectionTitle}>Security</div>
                            </div>
                            {openSections.security ? <ChevronDown /> : <ChevronRight />}
                        </div>
                        <div className={openSections.security ? styles.securityContent : styles.contentClosed}>
                            <div className={styles.changePasswordDiv}>
                                <div className={styles.changePasswordHead} onClick={() => toggleSection('change_password')}>
                                    <div className={styles.changePasswordLeft}>
                                        <User fill="gray"/>
                                        <div className={styles.changePasswordText}>Change Password</div>
                                    </div>
                                    {openSections.change_password ? <ChevronDown /> : <ChevronRight />}
                                </div>
                                <div className={openSections.change_password ? styles.changePasswordBody : styles.changePasswordClosed}>
                                    {currentUser?.is_oauth_user ? 
                                    (
                                        <div className={styles.passwordOAuthDiv}>
                                            <div className={styles.passwordOAuth}>
                                                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" width="20" height="20"/>
                                                <div>Connected via Google</div>
                                            </div>
                                            <div>
                                                Password is managed through your google account
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={styles.changePasswordShow}>
                                            <div className={styles.changePasswordSubtitle}>
                                                For security purposes, please enter your current password and choose a new password.
                                            </div>
                                            <div className={styles.currentPasswordDiv}>
                                                <div className={styles.passwordLabel}>Current Password</div>
                                                <div className={styles.passwordWrapper}>
                                                    <input type={openSections.showPassword ? 'text' : 'password'} className={styles.passwordInput} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                                                    <button type="button" className={styles.togglePassword} onClick={() => toggleSection('showPassword')}>{openSections.showPassword ? <EyeOff /> : <Eye />}</button>
                                                </div>
                                            </div>
                                            <div className={styles.newPasswordDiv}>
                                                <div className={styles.passwordLabel}>New Password</div>
                                                <div className={styles.passwordWrapper}>
                                                    <input type={openSections.showNewPassword ? 'text' : 'password'} className={styles.passwordInput} value={newPassword} onChange={(e) => handleNewPassword(e)} />
                                                    <button type="button" className={styles.togglePassword} onClick={() => toggleSection('showNewPassword')}>{openSections.showNewPassword ? <EyeOff /> : <Eye />}</button>
                                                </div>
                                            </div>
                                            <div className={styles.confirmPasswordDiv}>
                                                <div className={styles.passwordLabel}>Confirm New Password</div>
                                                <div className={styles.passwordWrapper}>
                                                    <input type={openSections.showConfirmPassword ? 'text' : 'password'} className={styles.passwordInput} value={confirmPassword} onChange={(e) => handleConfirmPassword(e)} />
                                                    <button type="button" className={styles.togglePassword} onClick={() => toggleSection('showConfirmPassword')}>{openSections.showConfirmPassword ? <EyeOff /> : <Eye />}</button>
                                                </div>
                                            </div>
                                            <div className={styles.confirmErrorDiv}>
                                                {confirmError && `${confirmError}`}
                                            </div>
                                            <button type="button" className={styles.savePassword} onClick={() => savePasswordChange()} disabled={confirmError || !currentPassword || isLoading}>
                                                Update Password
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader} onClick={() => toggleSection('preferences')}>
                            <div className={styles.iconTitle}>
                                <div className={styles.icon}><Wrench size={24}/></div>
                                <div className={styles.sectionTitle}>Preferences</div>
                            </div>
                            {openSections.preferences ? <ChevronDown /> : <ChevronRight />}
                        </div>
                        <div className={openSections.preferences? styles.preferencesContent : styles.contentClosed}>
                            <div className={styles.emailDiv}>
                                <div className={styles.emailSubtitle}>Email Notifications</div>
                                <ul className={styles.notifsList}>
                                    <li className={styles.emailSubDiv}>
                                        <div className={styles.mealPlanReminder}>Meal Plan Reminders</div>
                                        <label className={styles.switch}>
                                            <input 
                                                type="checkbox" 
                                                checked={mealPlanSwitch}
                                                onChange={(e) => setMealPlanSwitch(e.target.checked)}
                                            />
                                            <span className={styles.slider}></span>
                                        </label>
                                    </li>
                                    <li className={styles.emailSubDiv}>
                                        <div className={styles.weeklyGrocery}>Weekly Grocery Reminders</div>
                                        <label className={styles.switch}>
                                            <input 
                                                type="checkbox" 
                                                checked={groceryReminder}
                                                onChange={(e) => setGroceryReminder(e.target.checked)}
                                            />
                                            <span className={styles.slider}></span>
                                        </label>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader} onClick={() => toggleSection('privacy')}>
                            <div className={styles.iconTitle}>
                                <div className={styles.icon}><HatGlasses size={24}/></div>
                                <div className={styles.sectionTitle}>Privacy</div>
                            </div>
                            {openSections.privacy ? <ChevronDown /> : <ChevronRight />}
                        </div>
                        <div className={openSections.privacy? styles.privacyContent : styles.contentClosed}>
                            <div className={styles.subtextPriv}>
                                <div className={styles.privacyOption}>Make Profile Public</div>
                                <div className={styles.privacySubtitle}>Others will be able to see your recipe</div>
                            </div>
                            <label className={styles.switch}>
                                <input 
                                    type="checkbox" 
                                    checked={profilePrivacy ?? false}
                                    onChange={(e) => setProfilePrivacy(e.target.checked)}
                                />
                                <span className={styles.slider}></span>
                            </label>
                        </div>
                    </div>
                    <div className={styles.section}>
                        <div className={styles.sectionHeader} onClick={() => toggleSection('danger')}>
                            <div className={styles.iconTitle}>
                                <div className={styles.icon}><TriangleAlert size={24}/></div>
                                <div className={styles.sectionTitle}>Danger Zone</div>
                            </div>
                            {openSections.danger ? <ChevronDown /> : <ChevronRight />}
                        </div>
                        <div className={openSections.danger? styles.dangerContent : styles.contentClosed}>
                            <button type="button" className={styles.deleteAcct} onClick={() => setDeleteModalOpen(true)}>
                                <Trash2 /> 
                                Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {notification && <Toast message={notification.message} type={notification.type} handleClose={() => setNotification(null)} />}
        </div>
    )
}