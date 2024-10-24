import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "@store/store";

const RequireAuth = ({ allowedRoles }: any) => {
    const location = useLocation();
    const auth = useSelector((store : RootState) => store.login.auth);

    return (
        auth?.roles?.find((role: string) => allowedRoles?.includes(role))
            ? <Outlet /> : auth?.user ? <Navigate to="/unauthorized" state={{ from: location }} replace /> : <Navigate to="/login" state={{ from: location }} replace />
    );
}

export default RequireAuth;