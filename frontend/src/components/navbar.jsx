import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchBar } from './search'
import { Menubar } from './menubar'
import { AccountModal } from './accountModal'
import { House, UserRound } from 'lucide-react'
import '../styles/navbar.css'

export const Navbar = () => {
    const [openAccountModal, setOpenAccountModal] = useState(false)
    const navigate = useNavigate()

    const handleSearch = (searchTerm) => {
        navigate(`http://localhost:5173/search?q=${searchTerm}`)
    }

    const [fname, setFname] = useState('')
    useEffect(() => {
        const getUser = async () => {
            try{
                const response = await fetch(`http://localhost:8000/users/me`, {
                    method: "GET",
                    credentials: "include"
                })

                if(!response.ok){
                    const errData = await response.json()
                    throw new Error(errData)
                }
                const data = await response.json()
                setFname(data.fname)
                console.log(data)
            }catch(e){
                console.error(e.message)
            }finally{
                console.log("finally")
            }
        }
        getUser()
    }, [])

    return (
        <>
            <nav>
                <div className='Nav'>
                    <div className='leftNav'>
                        <Menubar/>
                        <div className='siteTitle navHover' onClick={() => {window.location.href='/'}}>Recipizer</div>
                    </div>
                    <SearchBar onSearch={handleSearch}/>
                    <div className='rightNav'>
                        <div className='navHover' onClick={() => {window.location.href='/'}}> <House /> </div>
                        <div className='navHover accountNavBar' onClick={() => setOpenAccountModal(!openAccountModal)}> 
                            <UserRound /> {fname ? `Welcome ${fname}!`: `Login`} 
                            {openAccountModal && <AccountModal setOpenAccountModal={setOpenAccountModal}/>}
                        </div>
                    </div>
                </div>
            </nav>
        </>
    )
}