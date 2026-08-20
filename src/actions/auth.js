import * as endpoint from '../endpoint'
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import jwtDecode from 'jwt-decode';
import Cookies from 'universal-cookie';

const cookies = new Cookies();
const initialState = {
    error               : '',
    message             : '',
    verificationStatus  : '',
    isLoading           : false,
    data                : {}
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

export const forgotPassword = createAsyncThunk('user/forgotPassword', async (form, thunkAPI) => {
    try {
        const response = await endpoint.forgotPassword(form);
        return response.data;
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data);
        return thunkAPI.rejectWithValue({ message: 'Failed to send reset email.' });
    }
});

export const resetPassword = createAsyncThunk('user/resetPassword', async (form, thunkAPI) => {
    try {
        const response = await endpoint.resetPassword(form);
        return response.data;
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data);
        return thunkAPI.rejectWithValue({ message: 'Failed to reset password.' });
    }
});

export const verifyEmail = createAsyncThunk('user/verifyEmail', async (form, thunkAPI) => {
    try {
        const response = await endpoint.verifyEmail(form);
        return response.data;
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data);
        return thunkAPI.rejectWithValue({ status: 'error' });
    }
});

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    extraReducers: (builder) => {
        builder.addCase(login.pending, (state) => {
            state.isLoading       = true
            state.error           = ''
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
        }),
        builder.addCase(forgotPassword.pending, (state) => {
            state.isLoading = true
            state.error = ''
            state.message = ''
        }),
        builder.addCase(forgotPassword.fulfilled, (state, action) => {
            state.isLoading = false
            state.message = action.payload?.message || 'Reset link sent.'
        }),
        builder.addCase(forgotPassword.rejected, (state, action) => {
            state.isLoading = false
            state.error = action.payload
        }),
        builder.addCase(resetPassword.pending, (state) => {
            state.isLoading = true
            state.error = ''
            state.message = ''
        }),
        builder.addCase(resetPassword.fulfilled, (state, action) => {
            state.isLoading = false
            state.message = action.payload?.message || 'Password updated.'
        }),
        builder.addCase(resetPassword.rejected, (state, action) => {
            state.isLoading = false
            state.error = action.payload
        }),
        builder.addCase(verifyEmail.pending, (state) => {
            state.isLoading = true
            state.verificationStatus = ''
        }),
        builder.addCase(verifyEmail.fulfilled, (state, action) => {
            state.isLoading = false
            state.verificationStatus = action.payload?.status || 'activated'
        }),
        builder.addCase(verifyEmail.rejected, (state, action) => {
            state.isLoading = false
            state.verificationStatus = action.payload?.status || 'notFound'
        })
    },
    reducers: {
        logout: (state) => {
            cookies.remove('token')
            localStorage.removeItem('profile')

            state.error         = ''
            state.message       = ''
            state.verificationStatus = ''
            state.isLoading     = false
            state.data          = {}
        },
        clearAuthMessage: (state) => {
            state.error = ''
            state.message = ''
        },
        clearVerificationStatus: (state) => {
            state.verificationStatus = ''
        }
    },
})
  
export const { logout, clearAuthMessage, clearVerificationStatus } = authSlice.actions
  
export default authSlice.reducer
