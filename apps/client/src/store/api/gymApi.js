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

export const gymApi = createApi({
  reducerPath: 'gymApi',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Workouts', 'WorkoutDays', 'Exercises', 'Template'],
  endpoints: (builder) => ({
    getAllWorkouts: builder.query({
      query: () => ({ url: '/workouts' }),
      providesTags: ['Workouts'],
    }),
    getWorkouts: builder.query({
      query: (date) => ({ url: date ? `/workouts/${date}` : '/workouts' }),
      providesTags: ['Workouts'],
    }),
    getTemplate: builder.query({
      query: (day) => ({ url: `/templates/${day}` }),
      providesTags: ['Template'],
    }),
    getWorkoutDays: builder.query({
      query: () => ({ url: '/workout-days' }),
      providesTags: ['WorkoutDays'],
    }),
    getExercises: builder.query({
      query: () => ({ url: '/exercises' }),
      providesTags: ['Exercises'],
    }),
    postWorkout: builder.mutation({
      query: (payload) => ({ url: '/workouts', method: 'POST', body: payload }),
      invalidatesTags: ['Workouts'],
    }),
    createWorkoutDay: builder.mutation({
      query: (name) => ({ url: '/workout-days', method: 'POST', body: { name } }),
      invalidatesTags: ['WorkoutDays'],
    }),
    updateWorkoutDay: builder.mutation({
      query: ({ id, name }) => ({ url: `/workout-days/${id}`, method: 'PUT', body: { name } }),
      invalidatesTags: ['WorkoutDays'],
    }),
    deleteWorkoutDay: builder.mutation({
      query: (id) => ({ url: `/workout-days/${id}`, method: 'DELETE' }),
      invalidatesTags: ['WorkoutDays'],
    }),
    saveWorkoutDayExercises: builder.mutation({
      query: ({ dayId, exercises }) => ({
        url: `/workout-days/${dayId}/exercises`,
        method: 'PUT',
        body: { exercises },
      }),
      invalidatesTags: ['WorkoutDays'],
    }),
  }),
})

export const {
  useGetAllWorkoutsQuery,
  useGetWorkoutsQuery,
  useGetTemplateQuery,
  useGetWorkoutDaysQuery,
  useGetExercisesQuery,
  usePostWorkoutMutation,
  useCreateWorkoutDayMutation,
  useUpdateWorkoutDayMutation,
  useDeleteWorkoutDayMutation,
  useSaveWorkoutDayExercisesMutation,
} = gymApi
