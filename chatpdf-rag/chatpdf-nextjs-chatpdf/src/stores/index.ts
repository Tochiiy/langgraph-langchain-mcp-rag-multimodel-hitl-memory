import { configureStore } from "@reduxjs/toolkit";
import projectSlice from './chatSlice'
import pdfSlice from "./pdfSlice";


export const store = configureStore({
  reducer: {
    chat: projectSlice,
    pdf: pdfSlice,
  },
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;





