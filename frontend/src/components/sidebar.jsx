import { useNavigate } from 'react-router-dom'
import { CalendarDays, Bookmark, FileUser, Store, ShoppingCart } from 'lucide-react'
import '../styles/sidebar.css'

export const SideBar = ({ isOpen, setisOpen }) => {
    const navigate = useNavigate()
    const handleNavigate = (path) => {
        navigate(path)
        setisOpen(false)
    }
    return (
        <div className={`sidebar ${isOpen? 'open' : ''}`}>
            <div className='sideOption' onClick={() => handleNavigate("/shared-recipes")}>
                <Store />
                Recipe Hub
            </div>
            <div className='sideOption' onClick={() => handleNavigate("/user/recipes")}>
                <FileUser />
                My Recipes
            </div>
            <div className='sideOption' onClick={() => handleNavigate("/user/favorites")}>
                <Bookmark />
                Saved Recipes
            </div>
            <div className='sideOption' onClick={() => handleNavigate("/shopping")}>
                <ShoppingCart />
                Shopping List
            </div>
            <div className='sideOption' onClick={() => handleNavigate("/meal")}>
                <CalendarDays />
                Meal Planner
            </div>
        </div>
    )
}