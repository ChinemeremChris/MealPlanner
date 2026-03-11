import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { SideBar } from './sidebar'
import '../styles/sidebar.css'
export const Menubar = () => {
    const [isOpen, setisOpen] = useState(false)
    return (
        <>
            <button className='menubar' onClick={() => {setisOpen(!isOpen)}}>
                {isOpen ? <X /> : <Menu />}
            </button>
            <div className={`overlay ${isOpen?'true':''}`} onClick={()=>{setisOpen(false)}}/>
            
            <SideBar isOpen={isOpen} setisOpen={setisOpen}/>
        </>
    )
}