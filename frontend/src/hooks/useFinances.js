import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { movementService, categoryService, summaryService, fixedExpenseService, savingsGoalService } from '../services'

export const useMovements = (filters) =>
  useQuery({
    queryKey: ['movements', filters],
    queryFn:  () => {
      console.log('[useMovements] fetching with filters:', filters)
      return movementService.getAll(filters)
    },
    staleTime: 0,
  })

export const useCreateMovement = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: movementService.create,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['movements'] })
      qc.invalidateQueries({ queryKey: ['summary'] })
    },
  })
}

export const useUpdateMovement = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => movementService.update(id, data),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['movements'] })
      qc.invalidateQueries({ queryKey: ['summary'] })
    },
  })
}

export const useDeleteMovement = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: movementService.delete,
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['movements'] })
      qc.invalidateQueries({ queryKey: ['summary'] })
    },
  })
}

export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: categoryService.getAll })

export const useMonthlySummary = (year, month) =>
  useQuery({
    queryKey: ['summary', 'monthly', year, month],
    queryFn:  () => summaryService.monthly(year, month),
    enabled:  !!year && !!month,
  })

export const useYearlySummary = (year) =>
  useQuery({
    queryKey: ['summary', 'yearly', year],
    queryFn:  () => summaryService.yearly(year),
    enabled:  !!year,
  })

export const useFixedExpenses = () =>
  useQuery({ queryKey: ['fixed-expenses'], queryFn: fixedExpenseService.getAll })

export const useCreateFixedExpense = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fixedExpenseService.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['fixed-expenses'] }),
  })
}

export const useUpdateFixedExpense = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => fixedExpenseService.update(id, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['fixed-expenses'] }),
  })
}

export const useDeleteFixedExpense = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fixedExpenseService.delete,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['fixed-expenses'] }),
  })
}

// ── Huchas de ahorro ──────────────────────────────────────────────────────
export const useSavingsGoals = () =>
  useQuery({ queryKey: ['savings-goals'], queryFn: savingsGoalService.getAll })

export const useCreateSavingsGoal = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: savingsGoalService.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['savings-goals'] }),
  })
}

export const useUpdateSavingsGoal = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => savingsGoalService.update(id, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['savings-goals'] }),
  })
}

export const useDepositSavingsGoal = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount }) => savingsGoalService.deposit(id, amount),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['savings-goals'] }),
  })
}

export const useDeleteSavingsGoal = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: savingsGoalService.delete,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['savings-goals'] }),
  })
}