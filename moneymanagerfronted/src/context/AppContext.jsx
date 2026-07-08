import {createContext, useState, useCallback} from "react";

export const AppContext = createContext();

export const AppContextProvider = ({children}) => {

    const [user, setUserState] = useState(() => {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    });

    const setUser = useCallback((userData) => {
        if (userData) {
            localStorage.setItem("user", JSON.stringify(userData));
        } else {
            localStorage.removeItem("user");
        }
        setUserState(userData);
    }, []);

    const clearUser = useCallback(() => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUserState(null);
    }, []);

    const contextValue = {
        user,
        setUser,
        clearUser,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    )
}
