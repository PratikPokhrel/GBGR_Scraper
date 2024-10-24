import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import useRefreshToken from '../hooks/useRefreshToken';
import useAuth from '../hooks/useAuth';
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@store/store";
import LoadingIndicator from "@components/loading";

const PersistLogin = () => {
    const [isLoading, setIsLoading] = useState(true);
    const refresh = useRefreshToken();
    const dispatch = useDispatch<AppDispatch>();
    const {auth, persist} = useSelector((store : RootState) => store.login);

    // const { auth, persist }: any = useAuth();

    useEffect(() => {
        let isMounted = true;
        const verifyRefreshToken = async () => {
            try {
                // await refresh();
            }
            catch (err) {
                console.error(err);
            }
            finally {
                isMounted && setIsLoading(false);
            }
        }

        // persist added here AFTER tutorial video
        // Avoids unwanted call to verifyRefreshToken
        !auth?.accessToken && persist ?  verifyRefreshToken() : setIsLoading(false);

        return () => {isMounted = false};
    }, [])

    useEffect(() => {
    }, [isLoading])

    return (
        <>
            {!persist
                ? <Outlet />
                : isLoading
                    ? <p><LoadingIndicator/> </p>
                    : <Outlet />
            }
        </>
    )
}

export default PersistLogin