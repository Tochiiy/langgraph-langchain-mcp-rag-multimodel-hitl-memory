import { configureStore } from "@reduxjs/toolkit";
import projectSlice from './chatSlice'


export const store = configureStore({
  reducer: {
    chat: projectSlice,
  },
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;





