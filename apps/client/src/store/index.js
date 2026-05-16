import { configureStore } from '@reduxjs/toolkit'
import { gymApi } from './api/gymApi'
import { authApi } from './api/authApi'

export const store = configureStore({
  reducer: {
    [gymApi.reducerPath]: gymApi.reducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(gymApi.middleware, authApi.middleware),
})
