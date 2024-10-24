import { useContext, useDebugValue } from "react";
import AuthContext from "shared/contexts/authProvider";

const UseAuth = () => {
    const { auth } : any = useContext(AuthContext);
    useDebugValue(auth, auth => auth.user ? "Logged In" : "Logged Out");
    return useContext(AuthContext);
}

export default UseAuth;