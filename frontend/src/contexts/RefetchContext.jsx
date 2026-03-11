import { createContext, useState } from "react";

export const RefetchContext = createContext()

export const RefetchProvider = ({ children }) => {
    const [refetchSignal, setRefetchSignal] =useState(0)

    const triggerRefetch = () => setRefetchSignal((prev) => prev + 1)
    return (
        <RefetchContext.Provider value={{ refetchSignal, triggerRefetch }}>
            {children}
        </RefetchContext.Provider>
    )
}