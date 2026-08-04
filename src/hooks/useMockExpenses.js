import { useSyncExternalStore } from 'react';
import { mockExpenses } from '@/data/mockExpenses';

// Module-level in-memory store so the list and create form share the same data
// (UI-only pass — no API). Swap for a real service when wiring the backend.
let expenses = [...mockExpenses];
const listeners = new Set();

function emit() {
  listeners.forEach((fn) => fn());
}

export const mockExpenseStore = {
  get: () => expenses,
  add: (expense) => {
    expenses = [expense, ...expenses];
    emit();
  },
  update: (id, patch) => {
    expenses = expenses.map((e) => (e.id === id ? { ...e, ...patch } : e));
    emit();
  },
  subscribe: (fn) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

export function useMockExpenses() {
  const expenses = useSyncExternalStore(mockExpenseStore.subscribe, mockExpenseStore.get);
  const addExpense = (expense) => mockExpenseStore.add(expense);
  const updateExpense = (id, patch) => mockExpenseStore.update(id, patch);
  return { expenses, addExpense, updateExpense };
}
