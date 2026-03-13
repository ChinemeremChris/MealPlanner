import { Navbar } from '../components/navbar.jsx'
import { AddButton } from '../components/add.jsx'
import { Outlet } from 'react-router-dom'
import { RefetchProvider } from '../contexts/RefetchContext.jsx'
export const MainLayout = () => {
    //fixed import
    return (
        <>
            <RefetchProvider>
                <Navbar/>
                <Outlet/>
                <AddButton />
            </RefetchProvider>
        </>
    )
}