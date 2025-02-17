import { configureStore } from '@reduxjs/toolkit'
import globalReducers from './globalSlice'

const store = configureStore({
  reducer: {
    global: globalReducers
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store
