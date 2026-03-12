import { Navbar } from '../components/NavBar.jsx'
import { AddButton } from '../components/add.jsx'
import { Outlet } from 'react-router-dom'
import { RefetchProvider } from '../contexts/RefetchContext.jsx'
export const MainLayout = () => {
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