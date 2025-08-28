import { configureStore } from "@reduxjs/toolkit";
import leadsReducer from "./slices/leadsSlice";
import propertiesReducer from "./slices/propertiesSlice";
import visitsReducer from "./slices/visitsSlice";
import calendarReducer from "./slices/calendarSlice";

export const store = configureStore({
  reducer: {
    leads: leadsReducer,
    properties: propertiesReducer,
    visits: visitsReducer,
    calendar: calendarReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "calendar/goToPreviousMonth",
          "calendar/goToNextMonth", 
          "calendar/goToToday",
          "calendar/setCurrentDate",
          "calendar/setSelectedDate"
        ],
        ignoredPaths: ["calendar.currentDate", "calendar.selectedDate"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
