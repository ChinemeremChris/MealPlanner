import '../styles/login.css'
import { useContext, useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { SignUp } from './signup'
import { useSearchParams } from 'react-router-dom'
import { Toast } from '../components/Toast'
import { UserContext } from '../contexts/UserContext'
export const Login = () => {
    const [usernameText, setusernameText] = useState('')
    const [passwordText, setpasswordText] = useState('')
    const [notification, setNotification] = useState(null)
    const [isLoading, setisLoading] = useState(false)
    const {refreshUser} = useContext(UserContext)
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const location = useLocation()
    const deletedError = searchParams.get('deleted-error')

    const handleSubmit = async (e) => {
        e.preventDefault();
        setisLoading(true)
        try{
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/jwt/login`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                credentials: 'include',
                body: new URLSearchParams({
                    username: usernameText, 
                    password: passwordText
                })
            })

            if (response.ok){
                await refreshUser()
                const next = location.state?.next || "/"
                navigate(next)
            }

            switch (response.status) {
                case 401:
                    setNotification({message: "Incorrect email or password", type: "error"});
                    break;
                case 403:
                    setNotification({message: "Account access denied", type: "error"});
                    break;
                case 422:
                    setNotification({message: "Invalid input format", type: "error"});
                    break;
                default:
                    setNotification({message: "Unexpected error occurred", type: "error"});
            }

        }catch(error){
            setNotification({ message: error.message || 'Login failed', type: "error"})
        }finally{
            setisLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        try{
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/google/authorize`, {
                method: "GET",
                credentials: "include"
            })

            if(!response.ok){
                throw new Error("Error Continuing with Google")
            }

            const result = await response.json()
            window.location.href = result.authorization_url
        }catch(e){
            setNotification({ message: e.message || 'Login failed', type: "error"})
        }
    }

    useEffect(() => {
        if(deletedError){
            setNotification({ message: "This account has been deleted. Please contact support to restore it", type:"error"})
        }
    }, [deletedError])


    return (
        <div className='loginContainer'>
            <div className='loginFormField'>
                <div className='title'>SIGN IN</div>
                <div className='subtitle'>Enter your credientials to continue</div>
                <form className='loginForm' onSubmit={handleSubmit}>
                    <input type='email' className='userName' placeholder='Enter Email' value={usernameText} onChange={(e) => setusernameText(e.target.value)}/>
                    <input type='password' className='passWord' placeholder='Enter Password' value={passwordText} onChange={(e) => setpasswordText(e.target.value)}/>
                    <button disabled={isLoading}>{isLoading? 'Logging in...': 'SIGN IN'}</button>
                </form>
                <button className='googleSignIn' onClick={() => handleGoogleLogin()}>
                    <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google" width="20" height="20"/>
                    <div>CONTINUE WITH GOOGLE</div>
                </button>
                <div>
                    <Link to='/signup' className='subtitle'>Don't have an account?</Link>
                    <Link to='/forgot-password' className='subtitle'>Forgot Password</Link>
                </div>
                {notification && (
                    <Toast message={notification.message} type={notification.type} handleClose={() => setNotification(null)} />
                )}
            </div>
        </div>
    )
}