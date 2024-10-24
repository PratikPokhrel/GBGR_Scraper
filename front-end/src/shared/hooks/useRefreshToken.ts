import { api } from '@network/apis';
import axios from 'axios';
import useAuth from './useAuth';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@store/store';
import { setAuthZ } from './../../store/slices/auth'

const useRefreshToken = () => {
    // const { setAuth, auth } = useAuth();

    const dispatch = useDispatch<AppDispatch>();

    const { auth, persist } = useSelector((store: RootState) => store.login);

    const refresh = async () => {
        const response = await axios.post(api.auth.refresh, {}, { withCredentials: true });
        dispatch(setAuthZ(
            { ...auth,  user: { name: new Date().toDateString() },accessToken: response.data.data.token, roles: ['Admin']}));
        return response.data.data.token;
    }
    return refresh;
};

export default useRefreshToken;
