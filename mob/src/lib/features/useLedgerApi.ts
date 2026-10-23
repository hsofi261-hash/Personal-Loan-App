import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/constants/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Types ---
export interface Loan {
  id: number;
  userId: number;
  friendName: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'REPAID';
  receiptUrl?: string | null;
  reason?: string | null;
  createdAt: string;
  user?: {
    id: number;
    phoneNumber: string;
  };
}

export interface Summary {
  totalLent: number;
  totalRepaid: number;
  overdueAmount: number;
}

export interface CreateLoanPayload {
  userId: number;
  friendName: string;
  amount: number;
  dueDate: string;
  receiptUrl?: string | null;
  reason?: string | null;
}

// Query Keys Constant (Scoped by user ID to prevent data crossover)
export const QUERY_KEYS = {
  loans: (userId: string | null) => ['loans', userId] as const,
  loanDetail: (id: string | number) => ['loan', id] as const,
  summary: (userId: string | null) => ['summary', userId] as const,
};

// ==========================================
// 1. Hook: Mock Phone Login / Send OTP
// ==========================================
export const useLoginWithPhone = () => {
  return useMutation({
    mutationFn: async (phoneNumber: string) => {
      const response = await apiClient.post<{ message: string; userId: number }>(
        '/api/login',
        { phoneNumber }
      );
      return response.data;
    },
  });
};

// ==========================================
// 2. Hook: Get All Loan Entries (Scoped to User)
// ==========================================
export const useGetLoans = (userId: string | null) => {
  return useQuery({
    queryKey: QUERY_KEYS.loans(userId),
    queryFn: async () => {
      if (!userId) return [];
      const response = await apiClient.get<Loan[]>('/api/loans', {
        params: { userId },
      });
      return response.data;
    },
    enabled: !!userId,
  });
};

// ==========================================
// 3. Hook: Get Single Loan Details By ID
// ==========================================
export const useGetLoanDetails = (loanId: string | number) => {
  return useQuery({
    queryKey: QUERY_KEYS.loanDetail(loanId),
    queryFn: async () => {
      const response = await apiClient.get<Loan>(`/api/loans/${loanId}`);
      return response.data;
    },
    enabled: !!loanId,
  });
};

// ==========================================
// 4. Hook: Get Ledger Summary (Scoped to User)
// ==========================================
export const useGetSummary = (userId: string | null) => {
  return useQuery({
    queryKey: QUERY_KEYS.summary(userId),
    queryFn: async () => {
      if (!userId) return { totalLent: 0, totalRepaid: 0, overdueAmount: 0 };
      const response = await apiClient.get<Summary>('/api/loans/summary', {
        params: { userId },
      });
      return response.data;
    },
    enabled: !!userId,
  });
};

// ==========================================
// 5. Hook: Create New Loan Entry
// ==========================================
export const useCreateLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiClient.post<Loan>('/api/loans', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
    },
  });
};

// ==========================================
// 6. Hook: Mark Loan as Repaid
// ==========================================
export const useMarkAsRepaid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (loanId: number | string) => {
      const response = await apiClient.patch<{ message: string; loan: Loan }>(
        `/api/loans/${loanId}/repaid`
      );
      return response.data;
    },
    onSuccess: (_, loanId) => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.loanDetail(loanId) });
    },
  });
};