import { axiosPrivate } from "@network/service";
import { AppDispatch, RootState } from "@store/store";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import useRefreshToken from "shared/hooks/useRefreshToken";

const AxiosInterceptor = ({ children }: any) => {
    const refresh = useRefreshToken();
    // const { auth, setAuth }: any = useAuth();

    const dispatch = useDispatch<AppDispatch>();
    const auth = useSelector((store : RootState) => store.login.auth);

    useEffect(() => {
        const requestIntercept = axiosPrivate.interceptors.request.use(
            config => {
                if (!config.headers['Authorization']) {
                    config.headers['Authorization'] = `Bearer ${auth?.accessToken}`;
                }
                return config;
            }, (error) => Promise.reject(error)
        );

        const responseIntercept = axiosPrivate.interceptors.response.use(
            response => response,
            async (error) => {
                const prevRequest = error?.config;
                if (error?.response?.status === 401 && !prevRequest?.sent) {
                    prevRequest.sent = true;
                    const newAccessToken = await refresh();
                    prevRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                    return axiosPrivate(prevRequest);
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axiosPrivate.interceptors.request.eject(requestIntercept);
            axiosPrivate.interceptors.response.eject(responseIntercept);
        }
    }, [auth, refresh]);
    return children;
}

export default AxiosInterceptor;