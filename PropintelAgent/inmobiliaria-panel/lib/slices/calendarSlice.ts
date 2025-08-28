import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CalendarState {
  currentDate: string; // ISO string
  selectedDate: Date | null;
  viewMode: 'month' | 'week' | 'day';
  isCreateModalOpen: boolean;
}

const initialState: CalendarState = {
  currentDate: new Date().toISOString(),
  selectedDate: null,
  viewMode: 'month',
  isCreateModalOpen: false,
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    setCurrentDate: (state, action: PayloadAction<Date>) => {
      state.currentDate = action.payload.toISOString();
    },
    setSelectedDate: (state, action: PayloadAction<Date | null>) => {
      state.selectedDate = action.payload;
    },
    setViewMode: (state, action: PayloadAction<'month' | 'week' | 'day'>) => {
      state.viewMode = action.payload;
    },
    setCreateModalOpen: (state, action: PayloadAction<boolean>) => {
      state.isCreateModalOpen = action.payload;
    },
    goToPreviousMonth: (state) => {
      const newDate = new Date(state.currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      state.currentDate = newDate.toISOString();
    },
    goToNextMonth: (state) => {
      const newDate = new Date(state.currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      state.currentDate = newDate.toISOString();
    },
    goToToday: (state) => {
      state.currentDate = new Date().toISOString();
    },
  },
});

export const { 
  setCurrentDate, 
  setSelectedDate, 
  setViewMode, 
  setCreateModalOpen,
  goToPreviousMonth,
  goToNextMonth,
  goToToday
} = calendarSlice.actions;

export default calendarSlice.reducer; 