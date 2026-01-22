import { create } from 'zustand';

interface PendingRequestsState {
    pendingCount: number;
    increment: () => void;
    decrement: () => void;
    isLoading: boolean;
}

export const usePendingRequests = create<PendingRequestsState>((set) => ({
    pendingCount: 0,
    isLoading: false,
    increment: () => set((state: PendingRequestsState) => ({
        pendingCount: state.pendingCount + 1,
        isLoading: true
    })),
    decrement: () => set((state: PendingRequestsState) => {
        const nextCount = Math.max(0, state.pendingCount - 1);
        return {
            pendingCount: nextCount,
            isLoading: nextCount > 0
        };
    }),
}));
