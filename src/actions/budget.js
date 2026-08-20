import * as api from '../endpoint'
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const initialState = {
    dashboard       : null,
    categories      : [],
    expenses        : [],
    savings         : [],
    savingsAccounts : [],
    savingsHistory  : [],
    debts           : [],
    budgetLists     : [],
    goals           : [],
    searchResults   : [],
    exchangeRates   : null,
    liveRates       : null,
    baseCurrency    : 'PHP',
    viewCurrency    : '',
    selectedMonth   : new Date().getMonth() + 1,
    selectedYear    : new Date().getFullYear(),
    budgetSettings  : null,
    sharedUsers     : [],
    sharedBudgets   : [],
    viewingBudgetOwner: null,
    alert           : {},
    isLoading       : false,
    isCategoriesLoading: false,
    isExpensesLoading: false,
    isSavingsLoading: false,
    isDebtsLoading  : false,
    isGoalsLoading  : false,
    isListsLoading  : false,
    isMutating      : false,
}

// ==================== INITIAL LOAD (BATCHED) ====================

export const getBudgetInitialLoad = createAsyncThunk('budget/getInitialLoad', async (params, thunkAPI) => {
    try {
        const response = await api.getBudgetInitialLoad(params)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to load budget data' } })
    }
})

// ==================== DASHBOARD ====================

export const getBudgetDashboard = createAsyncThunk('budget/getDashboard', async (params, thunkAPI) => {
    try {
        const response = await api.getBudgetDashboard(params)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to load dashboard' } })
    }
})

// ==================== CATEGORIES ====================

export const getBudgetCategories = createAsyncThunk('budget/getCategories', async (params, thunkAPI) => {
    try {
        const response = await api.getBudgetCategories(params)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to load categories' } })
    }
})

export const createBudgetCategory = createAsyncThunk('budget/createCategory', async (formData, thunkAPI) => {
    try {
        const response = await api.createBudgetCategory(formData)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to create category' } })
    }
})

export const updateBudgetCategory = createAsyncThunk('budget/updateCategory', async (formData, thunkAPI) => {
    try {
        const response = await api.updateBudgetCategory(formData)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to update category' } })
    }
})

export const deleteBudgetCategory = createAsyncThunk('budget/deleteCategory', async ({ id, budgetOwnerId }, thunkAPI) => {
    try {
        const params = budgetOwnerId ? { budgetOwnerId } : undefined
        const response = await api.deleteBudgetCategory(id, params)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to delete category' } })
    }
})

export const shareBudgetCategory = createAsyncThunk('budget/shareCategory', async (formData, thunkAPI) => {
    try {
        const response = await api.shareBudgetCategory(formData)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to share category' } })
    }
})

export const unshareBudgetCategory = createAsyncThunk('budget/unshareCategory', async (formData, thunkAPI) => {
    try {
        const response = await api.unshareBudgetCategory(formData)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to unshare category' } })
    }
})

// ==================== EXPENSES ====================

export const getBudgetExpenses = createAsyncThunk('budget/getExpenses', async (params, thunkAPI) => {
    try {
        const response = await api.getBudgetExpenses(params)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to load expenses' } })
    }
})

export const createBudgetExpense = createAsyncThunk('budget/createExpense', async (formData, thunkAPI) => {
    try {
        const response = await api.createBudgetExpense(formData)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to add transaction' } })
    }
})

export const updateBudgetExpense = createAsyncThunk('budget/updateExpense', async (formData, thunkAPI) => {
    try {
        const response = await api.updateBudgetExpense(formData)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to update transaction' } })
    }
})

export const deleteBudgetExpense = createAsyncThunk('budget/deleteExpense', async ({ id, month, year, budgetOwnerId }, thunkAPI) => {
    try {
        const params = { month, year }
        if (budgetOwnerId) params.budgetOwnerId = budgetOwnerId
        const response = await api.deleteBudgetExpense(id, params)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to delete transaction' } })
    }
})

export const bulkDeleteBudgetExpenses = createAsyncThunk('budget/bulkDeleteExpenses', async (data, thunkAPI) => {
    try {
        const response = await api.bulkDeleteBudgetExpenses(data)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to delete transactions' } })
    }
})

export const bulkUpdateBudgetCategory = createAsyncThunk('budget/bulkUpdateCategory', async (data, thunkAPI) => {
    try {
        const response = await api.bulkUpdateBudgetCategory(data)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to update category' } })
    }
})

export const bulkUpdateBudgetCurrency = createAsyncThunk('budget/bulkUpdateCurrency', async (data, thunkAPI) => {
    try {
        const response = await api.bulkUpdateBudgetCurrency(data)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to update currency' } })
    }
})

export const bulkUpdateBudgetDate = createAsyncThunk('budget/bulkUpdateDate', async (data, thunkAPI) => {
    try {
        const response = await api.bulkUpdateBudgetDate(data)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to update date' } })
    }
})

export const bulkUpdateBudgetPaymentMethod = createAsyncThunk('budget/bulkUpdatePaymentMethod', async (data, thunkAPI) => {
    try {
        const response = await api.bulkUpdateBudgetPaymentMethod(data)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to update payment method' } })
    }
})

// ==================== EXCHANGE RATES ====================

export const getExchangeRates = createAsyncThunk('budget/getExchangeRates', async (params, thunkAPI) => {
    try {
        const response = await api.getExchangeRates(params)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to load exchange rates' } })
    }
})

export const saveExchangeRates = createAsyncThunk('budget/saveExchangeRates', async (data, thunkAPI) => {
    try {
        const response = await api.saveExchangeRates(data)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to save exchange rates' } })
    }
})

export const resetExchangeRates = createAsyncThunk('budget/resetExchangeRates', async (_, thunkAPI) => {
    try {
        const response = await api.resetExchangeRates()
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to reset exchange rates' } })
    }
})

// ==================== BUDGET SETTINGS ====================

export const saveBudgetSettings = createAsyncThunk('budget/saveBudgetSettings', async (data, thunkAPI) => {
    try {
        const response = await api.saveBudgetSettings(data)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to save settings' } })
    }
})

// ==================== SEARCH ====================

export const searchBudgetExpenses = createAsyncThunk('budget/searchExpenses', async (params, thunkAPI) => {
    try {
        const response = await api.searchBudgetExpenses(params)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Search failed' } })
    }
})

// ==================== CSV IMPORT ====================

export const importBudgetCSV = createAsyncThunk('budget/importCSV', async (data, thunkAPI) => {
    try {
        const response = await api.importBudgetCSV(data)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Import failed' } })
    }
})

// ==================== RECURRING ====================

export const processRecurring = createAsyncThunk('budget/processRecurring', async (_, thunkAPI) => {
    try {
        const response = await api.processRecurring()
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to process recurring' } })
    }
})

export const processSavingsInterest = createAsyncThunk('budget/processSavingsInterest', async (_, thunkAPI) => {
    try {
        const response = await api.processSavingsInterest()
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to process savings interest' } })
    }
})

// ==================== SAVINGS ====================

export const getBudgetSavings = createAsyncThunk('budget/getSavings', async (params, thunkAPI) => {
    try {
        const response = await api.getSavings(params)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to load savings' } })
    }
})

export const createBudgetSavingsAccount = createAsyncThunk('budget/createSavingsAccount', async (data, thunkAPI) => {
    try {
        const response = await api.createSavingsAccount(data)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to create savings account' } })
    }
})

export const updateBudgetSavingsAccount = createAsyncThunk('budget/updateSavingsAccount', async (data, thunkAPI) => {
    try {
        const response = await api.updateSavingsAccount(data)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to update savings account' } })
    }
})

export const deleteBudgetSavingsAccount = createAsyncThunk('budget/deleteSavingsAccount', async ({ id }, thunkAPI) => {
    try {
        const response = await api.deleteSavingsAccount(id)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to delete savings account' } })
    }
})

export const saveBudgetSavings = createAsyncThunk('budget/saveSavings', async (data, thunkAPI) => {
    try {
        const response = await api.saveSavings(data)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to save savings' } })
    }
})

export const getBudgetSavingsHistory = createAsyncThunk('budget/getSavingsHistory', async (params, thunkAPI) => {
    try {
        const response = await api.getSavingsHistory(params)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to load savings history' } })
    }
})

export const deleteBudgetSavingsHistory = createAsyncThunk('budget/deleteSavingsHistory', async ({ id, budgetOwnerId }, thunkAPI) => {
    try {
        const params = budgetOwnerId ? { budgetOwnerId } : undefined
        const response = await api.deleteSavingsHistory(id, params)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to delete history entry' } })
    }
})

// ==================== DEBTS ====================

export const getDebts = createAsyncThunk('budget/getDebts', async (params, thunkAPI) => {
    try {
        const response = await api.getDebts(params)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to load debts' } })
    }
})

export const createDebt = createAsyncThunk('budget/createDebt', async (formData, thunkAPI) => {
    try {
        const response = await api.createDebt(formData)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to create debt' } })
    }
})

export const updateDebt = createAsyncThunk('budget/updateDebt', async (formData, thunkAPI) => {
    try {
        const response = await api.updateDebt(formData)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to update debt' } })
    }
})

export const deleteDebt = createAsyncThunk('budget/deleteDebt', async ({ id, budgetOwnerId }, thunkAPI) => {
    try {
        const params = budgetOwnerId ? { budgetOwnerId } : undefined
        const response = await api.deleteDebt(id, params)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to delete debt' } })
    }
})

export const addDebtPayment = createAsyncThunk('budget/addDebtPayment', async ({ id, amount, notes, category, paymentMethod, budgetOwnerId }, thunkAPI) => {
    try {
        const response = await api.addDebtPayment(id, { amount, notes, category, paymentMethod, budgetOwnerId })
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to add payment' } })
    }
})

export const removeDebtPayment = createAsyncThunk('budget/removeDebtPayment', async ({ id, paymentId, budgetOwnerId }, thunkAPI) => {
    try {
        const params = budgetOwnerId ? { budgetOwnerId } : undefined
        const response = await api.removeDebtPayment(id, paymentId, params)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to remove payment' } })
    }
})

export const toggleDebtStatus = createAsyncThunk('budget/toggleDebtStatus', async ({ id, budgetOwnerId }, thunkAPI) => {
    try {
        const params = budgetOwnerId ? { budgetOwnerId } : undefined
        const response = await api.toggleDebtStatus(id, params)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to update status' } })
    }
})

// ==================== BUDGET LISTS ====================

export const getBudgetLists = createAsyncThunk('budget/getBudgetLists', async (params, thunkAPI) => {
    try {
        const response = await api.getBudgetLists(params)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to load lists' } })
    }
})

export const createBudgetList = createAsyncThunk('budget/createBudgetList', async (formData, thunkAPI) => {
    try {
        const response = await api.createBudgetList(formData)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to create list' } })
    }
})

export const updateBudgetList = createAsyncThunk('budget/updateBudgetList', async (formData, thunkAPI) => {
    try {
        const response = await api.updateBudgetList(formData)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to update list' } })
    }
})

export const deleteBudgetList = createAsyncThunk('budget/deleteBudgetList', async ({ id, budgetOwnerId }, thunkAPI) => {
    try {
        const params = budgetOwnerId ? { budgetOwnerId } : undefined
        const response = await api.deleteBudgetList(id, params)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to delete list' } })
    }
})

// ==================== FINANCIAL GOALS ====================

export const getFinancialGoals = createAsyncThunk('budget/getGoals', async (params, thunkAPI) => {
    try {
        const response = await api.getFinancialGoals(params)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to load goals' } })
    }
})

export const createFinancialGoal = createAsyncThunk('budget/createGoal', async (formData, thunkAPI) => {
    try {
        const response = await api.createFinancialGoal(formData)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to create goal' } })
    }
})

export const updateFinancialGoal = createAsyncThunk('budget/updateGoal', async (formData, thunkAPI) => {
    try {
        const response = await api.updateFinancialGoal(formData)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to update goal' } })
    }
})

export const deleteFinancialGoal = createAsyncThunk('budget/deleteGoal', async ({ id, budgetOwnerId }, thunkAPI) => {
    try {
        const params = budgetOwnerId ? { budgetOwnerId } : undefined
        const response = await api.deleteFinancialGoal(id, params)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to delete goal' } })
    }
})

export const addGoalContribution = createAsyncThunk('budget/addGoalContribution', async ({ id, amount, notes, budgetOwnerId }, thunkAPI) => {
    try {
        const response = await api.addGoalContribution(id, { amount, notes, budgetOwnerId })
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to add contribution' } })
    }
})

export const removeGoalContribution = createAsyncThunk('budget/removeGoalContribution', async ({ id, contributionId, budgetOwnerId }, thunkAPI) => {
    try {
        const params = budgetOwnerId ? { budgetOwnerId } : undefined
        const response = await api.removeGoalContribution(id, contributionId, params)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to remove contribution' } })
    }
})

// ==================== BUDGET SHARING ====================

export const shareBudget = createAsyncThunk('budget/shareBudget', async (formData, thunkAPI) => {
    try {
        const response = await api.shareBudget(formData)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to share budget' } })
    }
})

export const unshareBudget = createAsyncThunk('budget/unshareBudget', async (formData, thunkAPI) => {
    try {
        const response = await api.unshareBudget(formData)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to unshare budget' } })
    }
})

export const updateBudgetShareAction = createAsyncThunk('budget/updateBudgetShare', async (formData, thunkAPI) => {
    try {
        const response = await api.updateBudgetShare(formData)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to update share role' } })
    }
})

export const getSharedBudgets = createAsyncThunk('budget/getSharedBudgets', async (_, thunkAPI) => {
    try {
        const response = await api.getSharedBudgets()
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to load shared budgets' } })
    }
})

export const getSharedUsers = createAsyncThunk('budget/getSharedUsers', async (_, thunkAPI) => {
    try {
        const response = await api.getSharedUsers()
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to load shared users' } })
    }
})

export const acceptBudgetInvite = createAsyncThunk('budget/acceptInvite', async (formData, thunkAPI) => {
    try {
        const response = await api.acceptBudgetInvite(formData)
        return response
    } catch (err) {
        if (err.response?.data) return thunkAPI.rejectWithValue(err.response.data)
        return thunkAPI.rejectWithValue({ alert: { variant: 'danger', message: 'Failed to accept invite' } })
    }
})

// ==================== SLICE ====================

export const budgetSlice = createSlice({
    name: 'budget',
    initialState,
    extraReducers: (builder) => {
        // Initial Load (batched)
        builder.addCase(getBudgetInitialLoad.pending, (state) => {
            state.isLoading = true
            state.isCategoriesLoading = true
            state.isExpensesLoading = true
            state.isSavingsLoading = true
            state.isDebtsLoading = true
            state.isGoalsLoading = true
            state.isListsLoading = true
        })
        builder.addCase(getBudgetInitialLoad.fulfilled, (state, action) => {
            const r = action.payload.data.result
            state.dashboard = r.dashboard
            state.expenses = r.expenses
            state.categories = r.categories
            state.savingsAccounts = Array.isArray(r.savings) ? r.savings : []
            state.savings = state.savingsAccounts
            state.debts = r.debts
            state.budgetLists = r.lists
            state.goals = r.goals
            state.exchangeRates = r.exchangeRates.rates
            state.liveRates = r.exchangeRates.liveRates
            state.baseCurrency = r.exchangeRates.baseCurrency || 'PHP'
            if (r.exchangeRates.budgetSettings) state.budgetSettings = r.exchangeRates.budgetSettings
            state.isLoading = false
            state.isCategoriesLoading = false
            state.isExpensesLoading = false
            state.isSavingsLoading = false
            state.isDebtsLoading = false
            state.isGoalsLoading = false
            state.isListsLoading = false
        })
        builder.addCase(getBudgetInitialLoad.rejected, (state, action) => {
            state.alert = action.payload?.alert || {}
            state.isLoading = false
            state.isCategoriesLoading = false
            state.isExpensesLoading = false
            state.isSavingsLoading = false
            state.isDebtsLoading = false
            state.isGoalsLoading = false
            state.isListsLoading = false
        })

        // Dashboard
        builder.addCase(getBudgetDashboard.pending, (state) => { state.isLoading = true })
        builder.addCase(getBudgetDashboard.fulfilled, (state, action) => {
            state.dashboard = action.payload.data.result
            state.isLoading = false
        })
        builder.addCase(getBudgetDashboard.rejected, (state, action) => {
            state.alert = action.payload?.alert || {}
            state.isLoading = false
        })

        // Categories
        builder.addCase(getBudgetCategories.pending, (state) => { state.isCategoriesLoading = true })
        builder.addCase(getBudgetCategories.fulfilled, (state, action) => { state.categories = action.payload.data.result; state.isCategoriesLoading = false })
        builder.addCase(getBudgetCategories.rejected, (state, action) => { state.alert = action.payload?.alert || {}; state.isCategoriesLoading = false })

        builder.addCase(createBudgetCategory.pending, (state) => { state.isMutating = true })
        builder.addCase(createBudgetCategory.fulfilled, (state, action) => {
            state.categories = action.payload.data.result
            state.alert = action.payload.data.alert
            state.isMutating = false
        })
        builder.addCase(createBudgetCategory.rejected, (state, action) => { state.alert = action.payload?.alert || {}; state.isMutating = false })

        builder.addCase(updateBudgetCategory.pending, (state) => { state.isMutating = true })
        builder.addCase(updateBudgetCategory.fulfilled, (state, action) => {
            state.categories = action.payload.data.result
            state.alert = action.payload.data.alert
            state.isMutating = false
        })
        builder.addCase(updateBudgetCategory.rejected, (state, action) => { state.alert = action.payload?.alert || {}; state.isMutating = false })

        builder.addCase(deleteBudgetCategory.fulfilled, (state, action) => {
            state.categories = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(deleteBudgetCategory.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(shareBudgetCategory.fulfilled, (state, action) => {
            state.categories = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(shareBudgetCategory.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(unshareBudgetCategory.fulfilled, (state, action) => {
            state.categories = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(unshareBudgetCategory.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        // Expenses
        builder.addCase(getBudgetExpenses.pending, (state) => { state.isExpensesLoading = true })
        builder.addCase(getBudgetExpenses.fulfilled, (state, action) => { state.expenses = action.payload.data.result; state.isExpensesLoading = false })
        builder.addCase(getBudgetExpenses.rejected, (state, action) => { state.alert = action.payload?.alert || {}; state.isExpensesLoading = false })

        builder.addCase(createBudgetExpense.pending, (state) => { state.isMutating = true })
        builder.addCase(createBudgetExpense.fulfilled, (state, action) => {
            state.expenses = action.payload.data.result
            state.alert = action.payload.data.alert
            state.isMutating = false
        })
        builder.addCase(createBudgetExpense.rejected, (state, action) => { state.alert = action.payload?.alert || {}; state.isMutating = false })

        builder.addCase(updateBudgetExpense.pending, (state) => { state.isMutating = true })
        builder.addCase(updateBudgetExpense.fulfilled, (state, action) => {
            state.expenses = action.payload.data.result
            state.alert = action.payload.data.alert
            state.isMutating = false
        })
        builder.addCase(updateBudgetExpense.rejected, (state, action) => { state.alert = action.payload?.alert || {}; state.isMutating = false })

        builder.addCase(deleteBudgetExpense.fulfilled, (state, action) => {
            state.expenses = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(deleteBudgetExpense.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(bulkDeleteBudgetExpenses.fulfilled, (state, action) => {
            state.expenses = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(bulkDeleteBudgetExpenses.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(bulkUpdateBudgetCategory.fulfilled, (state, action) => {
            state.expenses = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(bulkUpdateBudgetCategory.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(bulkUpdateBudgetCurrency.fulfilled, (state, action) => {
            state.expenses = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(bulkUpdateBudgetCurrency.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(bulkUpdateBudgetDate.fulfilled, (state, action) => {
            state.expenses = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(bulkUpdateBudgetDate.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(bulkUpdateBudgetPaymentMethod.fulfilled, (state, action) => {
            state.expenses = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(bulkUpdateBudgetPaymentMethod.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        // Exchange Rates
        builder.addCase(getExchangeRates.fulfilled, (state, action) => {
            state.exchangeRates = action.payload.data.result.rates
            state.liveRates = action.payload.data.result.liveRates
            state.baseCurrency = action.payload.data.result.baseCurrency || 'PHP'
            if (action.payload.data.result.budgetSettings) state.budgetSettings = action.payload.data.result.budgetSettings
        })
        builder.addCase(getExchangeRates.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(saveExchangeRates.fulfilled, (state, action) => {
            state.exchangeRates = action.payload.data.result.rates
            if (action.payload.data.result.baseCurrency) state.baseCurrency = action.payload.data.result.baseCurrency
            state.alert = action.payload.data.alert
        })
        builder.addCase(saveExchangeRates.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(resetExchangeRates.fulfilled, (state, action) => {
            state.exchangeRates = action.payload.data.result.rates
            state.liveRates = action.payload.data.result.liveRates
            state.alert = action.payload.data.alert
        })
        builder.addCase(resetExchangeRates.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        // Budget Settings
        builder.addCase(saveBudgetSettings.fulfilled, (state, action) => {
            state.budgetSettings = action.payload.data.result.budgetSettings
            state.alert = action.payload.data.alert
        })
        builder.addCase(saveBudgetSettings.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        // Search
        builder.addCase(searchBudgetExpenses.fulfilled, (state, action) => { state.searchResults = action.payload.data.result })
        builder.addCase(searchBudgetExpenses.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        // CSV Import
        builder.addCase(importBudgetCSV.fulfilled, (state, action) => {
            state.expenses = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(importBudgetCSV.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        // Recurring
        builder.addCase(processRecurring.fulfilled, (state, action) => {
            if (action.payload.data.result) state.expenses = action.payload.data.result
            if (action.payload.data.alert) state.alert = action.payload.data.alert
        })
        builder.addCase(processRecurring.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(processSavingsInterest.fulfilled, (state, action) => {
            if (action.payload?.data?.result) state.savingsAccounts = action.payload.data.result
            if (action.payload?.data?.alert) state.alert = action.payload.data.alert
        })
        builder.addCase(processSavingsInterest.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        // Savings (with loading states - Bug 5 fix)
        builder.addCase(getBudgetSavings.pending, (state) => { state.isSavingsLoading = true })
        builder.addCase(getBudgetSavings.fulfilled, (state, action) => {
            state.savingsAccounts = action.payload.data.result || []
            state.savings = state.savingsAccounts
            state.isSavingsLoading = false
        })
        builder.addCase(getBudgetSavings.rejected, (state, action) => {
            state.alert = action.payload?.alert || {}
            state.isSavingsLoading = false
        })

        builder.addCase(saveBudgetSavings.fulfilled, (state, action) => {
            state.savingsAccounts = action.payload.data.result || []
            state.savings = state.savingsAccounts
            state.alert = action.payload.data.alert
        })
        builder.addCase(saveBudgetSavings.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(createBudgetSavingsAccount.fulfilled, (state, action) => {
            state.savingsAccounts = action.payload.data.result || []
            state.savings = state.savingsAccounts
            state.alert = action.payload.data.alert
        })
        builder.addCase(createBudgetSavingsAccount.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(updateBudgetSavingsAccount.fulfilled, (state, action) => {
            state.savingsAccounts = action.payload.data.result || []
            state.savings = state.savingsAccounts
            state.alert = action.payload.data.alert
        })
        builder.addCase(updateBudgetSavingsAccount.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(deleteBudgetSavingsAccount.fulfilled, (state, action) => {
            state.savingsAccounts = action.payload.data.result || []
            state.savings = state.savingsAccounts
            state.alert = action.payload.data.alert
        })
        builder.addCase(deleteBudgetSavingsAccount.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(getBudgetSavingsHistory.pending, (state) => { state.isSavingsLoading = true })
        builder.addCase(getBudgetSavingsHistory.fulfilled, (state, action) => {
            state.savingsHistory = action.payload.data.result || []
            state.isSavingsLoading = false
        })
        builder.addCase(getBudgetSavingsHistory.rejected, (state, action) => {
            state.alert = action.payload?.alert || {}
            state.isSavingsLoading = false
        })

        builder.addCase(deleteBudgetSavingsHistory.fulfilled, (state, action) => {
            state.savingsHistory = action.payload.data.result || []
            state.alert = action.payload.data.alert
        })
        builder.addCase(deleteBudgetSavingsHistory.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        // Debts
        builder.addCase(getDebts.pending, (state) => { state.isDebtsLoading = true })
        builder.addCase(getDebts.fulfilled, (state, action) => { state.debts = action.payload.data.result; state.isDebtsLoading = false })
        builder.addCase(getDebts.rejected, (state, action) => { state.alert = action.payload?.alert || {}; state.isDebtsLoading = false })

        builder.addCase(createDebt.pending, (state) => { state.isMutating = true })
        builder.addCase(createDebt.fulfilled, (state, action) => {
            state.debts = action.payload.data.result
            state.alert = action.payload.data.alert
            state.isMutating = false
        })
        builder.addCase(createDebt.rejected, (state, action) => { state.alert = action.payload?.alert || {}; state.isMutating = false })

        builder.addCase(updateDebt.fulfilled, (state, action) => {
            state.debts = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(updateDebt.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(deleteDebt.fulfilled, (state, action) => {
            state.debts = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(deleteDebt.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(addDebtPayment.fulfilled, (state, action) => {
            state.debts = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(addDebtPayment.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(removeDebtPayment.fulfilled, (state, action) => {
            state.debts = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(removeDebtPayment.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(toggleDebtStatus.fulfilled, (state, action) => {
            state.debts = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(toggleDebtStatus.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        // Budget Lists
        builder.addCase(getBudgetLists.pending, (state) => { state.isListsLoading = true })
        builder.addCase(getBudgetLists.fulfilled, (state, action) => { state.budgetLists = action.payload.data.result; state.isListsLoading = false })
        builder.addCase(getBudgetLists.rejected, (state, action) => { state.alert = action.payload?.alert || {}; state.isListsLoading = false })

        builder.addCase(createBudgetList.fulfilled, (state, action) => {
            state.budgetLists = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(createBudgetList.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(updateBudgetList.fulfilled, (state, action) => {
            state.budgetLists = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(updateBudgetList.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(deleteBudgetList.fulfilled, (state, action) => {
            state.budgetLists = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(deleteBudgetList.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        // Financial Goals
        builder.addCase(getFinancialGoals.pending, (state) => { state.isGoalsLoading = true })
        builder.addCase(getFinancialGoals.fulfilled, (state, action) => { state.goals = action.payload.data.result; state.isGoalsLoading = false })
        builder.addCase(getFinancialGoals.rejected, (state, action) => { state.alert = action.payload?.alert || {}; state.isGoalsLoading = false })

        builder.addCase(createFinancialGoal.pending, (state) => { state.isMutating = true })
        builder.addCase(createFinancialGoal.fulfilled, (state, action) => {
            state.goals = action.payload.data.result
            state.alert = action.payload.data.alert
            state.isMutating = false
        })
        builder.addCase(createFinancialGoal.rejected, (state, action) => { state.alert = action.payload?.alert || {}; state.isMutating = false })

        builder.addCase(updateFinancialGoal.fulfilled, (state, action) => {
            state.goals = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(updateFinancialGoal.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(deleteFinancialGoal.fulfilled, (state, action) => {
            state.goals = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(deleteFinancialGoal.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(addGoalContribution.fulfilled, (state, action) => {
            state.goals = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(addGoalContribution.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(removeGoalContribution.fulfilled, (state, action) => {
            state.goals = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(removeGoalContribution.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        // Budget Sharing
        builder.addCase(shareBudget.fulfilled, (state, action) => {
            state.sharedUsers = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(shareBudget.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(unshareBudget.fulfilled, (state, action) => {
            state.sharedUsers = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(unshareBudget.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(updateBudgetShareAction.fulfilled, (state, action) => {
            state.sharedUsers = action.payload.data.result
            state.alert = action.payload.data.alert
        })
        builder.addCase(updateBudgetShareAction.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(getSharedBudgets.fulfilled, (state, action) => { state.sharedBudgets = action.payload.data.result })
        builder.addCase(getSharedBudgets.rejected, (state, action) => { state.alert = action.payload?.alert || {} })

        builder.addCase(getSharedUsers.fulfilled, (state, action) => { state.sharedUsers = action.payload.data.result })
        builder.addCase(getSharedUsers.rejected, (state, action) => { state.alert = action.payload?.alert || {} })
    },
    reducers: {
        clearAlert: (state) => { state.alert = {} },
        clearSearchResults: (state) => { state.searchResults = [] },
        setViewingBudgetOwner: (state, action) => { state.viewingBudgetOwner = action.payload },
        setExpenses: (state, action) => { state.expenses = action.payload },
        setCategories: (state, action) => { state.categories = action.payload },
        setDashboard: (state, action) => { state.dashboard = action.payload },
        setSavings: (state, action) => {
            state.savingsAccounts = Array.isArray(action.payload) ? action.payload : []
            state.savings = state.savingsAccounts
        },
        setSavingsHistory: (state, action) => { state.savingsHistory = action.payload },
        setDebts: (state, action) => { state.debts = action.payload },
        setBudgetLists: (state, action) => { state.budgetLists = action.payload },
        setGoals: (state, action) => { state.goals = action.payload },
        setExchangeRatesData: (state, action) => {
            const d = action.payload
            if (d.rates !== undefined) state.exchangeRates = d.rates
            if (d.liveRates !== undefined) state.liveRates = d.liveRates
            if (d.baseCurrency) state.baseCurrency = d.baseCurrency
            if (d.budgetSettings) state.budgetSettings = d.budgetSettings
        },
        setViewCurrency: (state, action) => { state.viewCurrency = action.payload },
        setSelectedMonth: (state, action) => { state.selectedMonth = action.payload },
        setSelectedYear: (state, action) => { state.selectedYear = action.payload },
        setSharedUsers: (state, action) => { state.sharedUsers = action.payload },
    },
})

export const { clearAlert, clearSearchResults, setViewingBudgetOwner, setExpenses, setCategories, setDashboard, setSavings, setSavingsHistory, setDebts, setBudgetLists, setGoals, setExchangeRatesData, setSharedUsers, setViewCurrency, setSelectedMonth, setSelectedYear } = budgetSlice.actions

export default budgetSlice.reducer
