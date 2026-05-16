import { createApi } from '@reduxjs/toolkit/query/react'
import axiosInstance from '../../api/axiosInstance'

async function axiosBaseQuery({ url, method = 'GET', body }) {
  try {
    const result = await axiosInstance({ url, method, data: body })
    return { data: result.data }
  } catch (error) {
    return {
      error: {
        status: error.response?.status,
        data: error.response?.data?.error ?? error.message,
      },
    }
  }
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Me'],
  endpoints: (builder) => ({
    getMe: builder.query({
      query: () => ({ url: '/auth/me' }),
      providesTags: ['Me'],
    }),
    login: builder.mutation({
      query: ({ email, password }) => ({
        url: '/auth/login',
        method: 'POST',
        body: { email, password },
      }),
      invalidatesTags: ['Me'],
    }),
    register: builder.mutation({
      query: ({ email, password, displayName }) => ({
        url: '/auth/register',
        method: 'POST',
        body: { email, password, display_name: displayName },
      }),
      invalidatesTags: ['Me'],
    }),
    logout: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
      invalidatesTags: ['Me'],
    }),
  }),
})

export const {
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
} = authApi
