import { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchBar } from './search'
import { Menubar } from './menubar'
import { AccountModal } from './accountModal'
import { House, UserRound } from 'lucide-react'
import '../styles/navbar.css'
import { UserContext } from '../contexts/UserContext'

export const Navbar = () => {
    const [openAccountModal, setOpenAccountModal] = useState(false)
    const {currentUser, userLoading} = useContext(UserContext)
    const navigate = useNavigate()

    const handleSearch = (searchTerm) => {
        navigate(`/search?q=${searchTerm}`)
    }

    return (
        <>
            <nav>
                <div className='Nav'>
                    <div className='leftNav'>
                        <Menubar/>
                        <div className='siteTitle navHover' onClick={() => {navigate("/")}}>Recipizer</div>
                    </div>
                    <SearchBar onSearch={handleSearch}/>
                    <div className='rightNav'>
                        <div className='navHover' onClick={() => {navigate("/")}}> <House /> </div>
                        {userLoading ? null : currentUser ? (
                            <div className='navHover accountNavBar' onClick={() => setOpenAccountModal(!openAccountModal)}> 
                                <UserRound /> {`Welcome ${currentUser?.fname}!`} 
                                {openAccountModal && (
                                    <div className='modalOverlay' onClick={() => setOpenAccountModal(false)}>
                                        <AccountModal setOpenAccountModal={setOpenAccountModal}/>
                                    </div>
                                )}
                            </div>
                        ):(
                            <button type='button' className='navLogin' onClick={() => navigate("/login")}>
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </nav>
        </>
    )
}