import * as endpoint from '../endpoint'
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import jwtDecode from 'jwt-decode';
import Cookies from 'universal-cookie';

const cookies = new Cookies();
const initialState = {
    error       : '',
    isLoading   : false,
    data        : {}
}

const setToken = (token) => {
    const decoded = jwtDecode(token);
    const maxAgeMs = decoded.exp * 1000 - Date.now()
    cookies.set('token', token, { path: '/', maxAge: Math.max(maxAgeMs / 1000, 0) });
}

export const login = createAsyncThunk('user/login', async (form, thunkAPI) => {
    try {
        const response = await endpoint.login(form);
        return response;
    } catch (err) {
        if (err.response && err.response.data)
            return thunkAPI.rejectWithValue(err.response.data);

        return { 
            variant: 'danger',
            message: "409: there was a problem with the server."
        };
    }
});

export const register = createAsyncThunk('user/register', async (form, thunkAPI) => {
    try {
        const response = await endpoint.register(form);
        return response;
    } catch (err) {
        if (err.response && err.response.data)
            return thunkAPI.rejectWithValue(err.response.data);

        return thunkAPI.rejectWithValue({
            message: "There was a problem with the server."
        });
    }
});

export const googleLogin = createAsyncThunk('user/googleLogin', async (form, thunkAPI) => {
    try {
        const response = await endpoint.googleLogin(form);
        return response;
    } catch (err) {
        if (err.response && err.response.data)
            return thunkAPI.rejectWithValue(err.response.data);

        return thunkAPI.rejectWithValue({
            variant: 'danger',
            message: "There was a problem with the server."
        });
    }
});

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    extraReducers: (builder) => {
        builder.addCase(login.pending, (state) => {
            state.isLoading       = true
        }),
        builder.addCase(login.fulfilled, (state, action) => {
            setToken(action.payload.data.token);
            localStorage.setItem('profile', JSON.stringify({ ...action.payload?.data.result }));
            localStorage.setItem('avatar', JSON.stringify(action.payload?.data.result?.avatar));

            state.data            = action.payload.data
            state.error           = ''
            state.isLoading       = false
        }),
        builder.addCase(login.rejected, (state, action) => {
            state.error           = action.payload
            state.isLoading       = false
        }),
        builder.addCase(register.pending, (state) => {
            state.isLoading       = true
            state.error           = ''
        }),
        builder.addCase(register.fulfilled, (state, action) => {
            setToken(action.payload.data.token);
            localStorage.setItem('profile', JSON.stringify({ ...action.payload?.data.result }));
            localStorage.setItem('avatar', JSON.stringify(action.payload?.data.result?.avatar));

            state.data            = action.payload.data
            state.error           = ''
            state.isLoading       = false
        }),
        builder.addCase(register.rejected, (state, action) => {
            state.error           = action.payload
            state.isLoading       = false
        }),
        builder.addCase(googleLogin.pending, (state) => {
            state.isLoading       = true
        }),
        builder.addCase(googleLogin.fulfilled, (state, action) => {
            setToken(action.payload.data.token);
            localStorage.setItem('profile', JSON.stringify({ ...action.payload?.data.result }));
            localStorage.setItem('avatar', JSON.stringify(action.payload?.data.result?.avatar));

            state.data            = action.payload.data
            state.error           = ''
            state.isLoading       = false
        }),
        builder.addCase(googleLogin.rejected, (state, action) => {
            state.error           = action.payload
            state.isLoading       = false
        })
    },
    reducers: {
        logout: (state) => {
            cookies.remove('token')
            localStorage.removeItem('profile')

            state.error         = ''
            state.isLoading     = false
            state.data          = {}
        }
    },
})
  
export const { logout } = authSlice.actions
  
export default authSlice.reducer