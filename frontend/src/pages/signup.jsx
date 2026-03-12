import '../styles/signup.css'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Toast } from '../components/Toast'

export const SignUp = () => {
    const [firstnameText, setfirstnameText] = useState('')
    const [lastnameText, setlastnameText] = useState('')
    const [usernameText, setusernameText] = useState('')
    const [passwordText, setpasswordText] = useState('')
    const [isLoading, setisLoading] = useState(false)
    const [notification, setNotification] = useState(null)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault();
        setNotification(false)
        setisLoading(true)
        try{
            const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                fname: firstnameText,
                lname: lastnameText,
                email: usernameText,
                password: passwordText
            })
        })
        if (response.ok){
            const data = await response.json()
            navigate('/login')
        }else{
            const errorData = await response.json()
            throw new Error(errorData.detail || 'Sign up failed')
        }

        }catch(e){
            setNotification({message: e.message, type: "error"})
        }finally{
            setisLoading(false)
        }

    }

    const handleGoogleSignUp = async () => {
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
    
    return (
        <div className='signupContainer'>
            <div className='signupFormField'>
                <div className='signuptitle'>CREATE ACCOUNT</div>
                <div className='signupsubtitle'>Enter your information to continue</div>
                <form className='signupForm' onSubmit={handleSubmit}>
                    <input type='text' className='firstName' placeholder='Enter First Name' value={firstnameText} onChange={(e) => setfirstnameText(e.target.value)}/>
                    <input type='text' className='lastName' placeholder='Enter Last Name' value={lastnameText} onChange={(e) => setlastnameText(e.target.value)}/>
                    <input type='email' className='userName' placeholder='Enter Email' value={usernameText} onChange={(e) => setusernameText(e.target.value)}/>
                    <input type='password' className='passWord' placeholder='Enter Password' value={passwordText} onChange={(e) => setpasswordText(e.target.value)}/>
                    <button disabled={isLoading}>{isLoading? 'Creating...' : 'CREATE ACCOUNT'}</button>
                </form>
                <button className='googleSignIn' onClick={() => handleGoogleSignUp()}>
                    CONTINUE WITH GOOGLE
                </button>
                <div>
                    <Link to='/login' className='subtitle'>Already have an account?</Link>
                </div>
            </div>
            {notification && <Toast message={notification.message} type={notification.type} handleClose={() => setNotification(null)} />}
        </div>
    )
}