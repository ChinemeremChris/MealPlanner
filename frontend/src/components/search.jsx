import { useState, useEffect } from 'react'
import '../styles/search.css'
import { Search } from 'lucide-react'


export const SearchBar = ({ onSearch }) => {
    const [searchText, setSearchText] = useState('')
    const handleSearch = async (e) => {
        e.preventDefault()
        onSearch(searchText)
    }
    return (
        <div className="SearchBar">
            <form onSubmit={handleSearch} className="searchForm">
                <input type="text" className="searchText" placeholder="SEARCH" value={searchText} onChange={(e) => setSearchText(e.target.value)}/>
                <button type="submit" className="searchButton"><Search size={20} color='white'/></button>
            </form>
        </div>
    )
}