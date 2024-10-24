import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IAuthSlice {
    loginLoading: boolean;
    auth: any;
    persist: boolean;
}

const initialState: IAuthSlice = {
    loginLoading: false,
    auth: {},
    persist: true
}

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuthZ: (state, action) => {
            state.auth = action.payload
        }
    },
    extraReducers: (builder) => {
        // builder
        //     .addCase(loginActions.login.pending, (state, { payload }) => {
        //         state.loginLoading = true;
        //     })
        //     .addCase(loginActions.login.fulfilled, (state, { payload }) => {
        //         state.loginLoading = false;
        //     })
    }
});


export const { setAuthZ} = authSlice.actions;


export default authSlice.reducer
