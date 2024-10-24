import { useState, createContext } from "react";

const AuthContext = createContext<{
    auth: any,
    setAuth: Function,
    persist: any,
    setPersist: Function
}>({ auth: null, setAuth: () => { }, persist: null, setPersist: () => { } });


export const AuthProvider = ({ children }: any) => {
    const [auth, setAuth] = useState({});
    const [persist, setPersist] = useState(true);

    return (
        <AuthContext.Provider value={{ auth, setAuth, persist, setPersist }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext;