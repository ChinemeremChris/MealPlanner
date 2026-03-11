import { createContext, useState, useEffect } from "react";

export const UserContext = createContext()

export const UserProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null)
    const [userLoading, setUserLoading] = useState(true)
    const fetchUser = async () => {
        try{
            const response = await fetch(`http://localhost:8000/users/me`, {
                method: "GET",
                credentials: "include"
            })
            
            if (response.ok){
                const userData = await response.json()
                setCurrentUser(userData)
            }
        }catch(e){
            console.log(e.message)
        }finally{
            setUserLoading(false)
        }
    }
    useEffect(() => {
        fetchUser()
    }, [])

    return (
        <UserContext.Provider value={{ currentUser, userLoading, refreshUser: fetchUser }}>
            {children}
        </UserContext.Provider>
    )
}