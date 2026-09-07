import { configureStore } from "@reduxjs/toolkit";
import nationalDashboardReducer from "./slices/nationalDashboardSlice";
import cbuDetailReducer from "./slices/cbuDetailSlice";
import sciDetailReducer from "./slices/sciDetailSlice";

export const store = configureStore({
  reducer: {
    nationalDashboard: nationalDashboardReducer,
    cbuDetail: cbuDetailReducer,
    sciDetail: sciDetailReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
