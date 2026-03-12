import { useNavigate, useLocation } from 'react-router-dom'
import { CalendarDays, Bookmark, FileUser, Store, ShoppingCart } from 'lucide-react'
import '../styles/sidebar.css'

export const SideBar = ({ isOpen, setisOpen }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const handleNavigate = (path) => {
        navigate(path)
        setisOpen(false)
    }
    const sideOptionArray = [
        {path: '/shared-recipes', label: 'Recipe Hub', icon: <Store />},
        {path: '/user/recipes', label: 'My Recipes', icon: <FileUser />},
        {path: '/user/favorites', label: 'Saved Recipes', icon: <Bookmark />},
        {path: '/shopping', label: 'Shopping List', icon: <ShoppingCart />},
        {path: '/meal', label: 'Meal Planner', icon: <CalendarDays />}
    ]

    return (
        <div className={`sidebar ${isOpen? 'open' : ''}`}>
            {
                sideOptionArray.map((option) => (
                    <div className={`sideOption ${location.pathname === option.path ? `sideOptionActive` : ''}`} onClick={() => handleNavigate(option.path)}>
                        {option.icon}
                        {option.label}
                    </div>
                ))
            }
        </div>
    )
}