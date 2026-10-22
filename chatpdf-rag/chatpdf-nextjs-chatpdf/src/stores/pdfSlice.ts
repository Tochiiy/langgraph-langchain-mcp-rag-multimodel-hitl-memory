// store/pdfSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

/* ---------- Types ---------- */

export interface PdfItem {
  pdfId: string;
  title: string;
}

interface PdfState {
  list: PdfItem[];
  loading: boolean;
  error: string | null;
}

/* ---------- Async thunk ---------- */

export const fetchPdfList = createAsyncThunk<PdfItem[]>(
  "pdf/fetchList",
  async () => {
    const res = await fetch("http://localhost:8000/api/upload");

    if (!res.ok) {
      throw new Error("Failed to fetch PDF data");
    }

    const data: PdfItem[] = await res.json();
    return data;
  }
);

/* ---------- Initial state ---------- */

const initialState: PdfState = {
  list: [],
  loading: false,
  error: null,
};

/* ---------- Slice ---------- */

const pdfSlice = createSlice({
  name: "pdf",
  initialState,
  reducers: {
    clearPdfList(state) {
      state.list = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPdfList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPdfList.fulfilled, (state, action: PayloadAction<PdfItem[]>) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchPdfList.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to load PDFs";
      });
  },
});

export const { clearPdfList } = pdfSlice.actions;
export default pdfSlice.reducer;
