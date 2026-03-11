import { useContext, useEffect, useState } from "react"
import { UserContext } from "../contexts/UserContext"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { LoadingScreen } from "../components/LoadingScreen"

export const ProtectedRoute = () => {
    const [showLoader, setShowLoader] = useState(true)
    const [leaving, setLeaving] = useState(false)
    const { currentUser, userLoading } = useContext(UserContext)
    const location = useLocation()
    useEffect(() => {
        if(!userLoading){
            setLeaving(true)
            const t = setTimeout(() => setShowLoader(false), 400)
            return () => clearTimeout(t)
        }
    }, [userLoading])

    if(showLoader){
        return <LoadingScreen leaving={leaving} />
    }

    if(!currentUser){
        return <Navigate to="/login" state={{ next: location.pathname }} replace />
    }

    return <Outlet />
}