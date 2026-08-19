import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../actions/auth'
import budgetSlice from '../actions/budget'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        budget: budgetSlice,
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
})
