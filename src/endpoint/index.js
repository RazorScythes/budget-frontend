import axios from 'axios'
import Cookies from 'universal-cookie';
import { attachApiShield } from '../security/apiShield'

const cookies = new Cookies();

const baseURL = import.meta.env.VITE_DEVELOPMENT == "true"
    ? `${import.meta.env.VITE_APP_PROTOCOL}://${import.meta.env.VITE_APP_LOCALHOST}:${import.meta.env.VITE_APP_SERVER_PORT}`
    : import.meta.env.VITE_APP_BASE_URL

const endpoint = axios.create({ baseURL })
attachApiShield(endpoint)

endpoint.interceptors.request.use((config) => {
    const token = cookies.get('token', { doNotParse: true });
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

endpoint.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 403 && error.response?.data?.alert?.type === 'banned') {
            cookies.remove('token');
            localStorage.removeItem('profile');
            localStorage.removeItem('avatar');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

/*
    USER
*/
export const login = (formData) => endpoint.post('/user/login', formData)
export const register = (formData) => endpoint.post('/user/register', formData)
export const googleLogin = (formData) => endpoint.post('/user/googleLogin', formData)
export const forgotPassword = (formData) => endpoint.post('/user/forgotPassword', formData)
export const resetPassword = (formData) => endpoint.post('/user/resetPassword', formData)
export const verifyEmail = (formData) => endpoint.post('/user/verifyEmail', formData)
export const sendVerificationEmail = () => endpoint.post('/user/sendVerificationEmail')

/*
    BUDGET
*/
export const getBudgetInitialLoad = (params) => endpoint.get('/budget/initial-load', { params })
export const getBudgetDashboard = (params) => endpoint.get('/budget/dashboard', { params })
export const getBudgetCategories = (params) => endpoint.get('/budget/categories', { params })
export const createBudgetCategory = (formData) => endpoint.post('/budget/category', formData)
export const updateBudgetCategory = (formData) => endpoint.patch('/budget/category', formData)
export const deleteBudgetCategory = (id, params) => endpoint.delete(`/budget/category/${id}`, { params })
export const shareBudgetCategory = (formData) => endpoint.post('/budget/category/share', formData)
export const unshareBudgetCategory = (formData) => endpoint.post('/budget/category/unshare', formData)
export const importBudgetCSV = (formData) => endpoint.post('/budget/import-csv', formData)
export const searchBudgetExpenses = (params) => endpoint.get('/budget/search', { params })
export const processRecurring = () => endpoint.post('/budget/recurring/process')
export const processSavingsInterest = () => endpoint.post('/budget/savings/interest/process')
export const getBudgetExpenses = (params) => endpoint.get('/budget/expenses', { params })
export const createBudgetExpense = (formData) => endpoint.post('/budget/expense', formData)
export const updateBudgetExpense = (formData) => endpoint.patch('/budget/expense', formData)
export const deleteBudgetExpense = (id, params) => endpoint.delete(`/budget/expense/${id}`, { params })
export const bulkDeleteBudgetExpenses = (formData) => endpoint.post('/budget/expenses/bulkDelete', formData)
export const bulkUpdateBudgetCategory = (formData) => endpoint.patch('/budget/expenses/bulkCategory', formData)
export const bulkUpdateBudgetCurrency = (formData) => endpoint.patch('/budget/expenses/bulkCurrency', formData)
export const bulkUpdateBudgetDate = (formData) => endpoint.patch('/budget/expenses/bulkDate', formData)
export const bulkUpdateBudgetPaymentMethod = (formData) => endpoint.patch('/budget/expenses/bulkPaymentMethod', formData)
export const deleteReceipt = (formData) => endpoint.post('/budget/receipt/delete', formData)
export const getExchangeRates = (params) => endpoint.get('/budget/exchange-rates', { params })
export const saveExchangeRates = (formData) => endpoint.post('/budget/exchange-rates', formData)
export const resetExchangeRates = () => endpoint.post('/budget/exchange-rates/reset')
export const saveBudgetSettings = (formData) => endpoint.post('/budget/settings', formData)
export const getSavings = (params) => endpoint.get('/budget/savings', { params })
export const saveSavings = (formData) => endpoint.post('/budget/savings', formData)
export const createSavingsAccount = (formData) => endpoint.post('/budget/savings/account', formData)
export const updateSavingsAccount = (formData) => endpoint.patch('/budget/savings/account', formData)
export const deleteSavingsAccount = (id, params) => endpoint.delete(`/budget/savings/account/${id}`, { params })
export const getSavingsHistory = (params) => endpoint.get('/budget/savings/history', { params })
export const deleteSavingsHistory = (id, params) => endpoint.delete(`/budget/savings/history/${id}`, { params })
export const getDebts = (params) => endpoint.get('/budget/debts', { params })
export const createDebt = (formData) => endpoint.post('/budget/debt', formData)
export const updateDebt = (formData) => endpoint.patch('/budget/debt', formData)
export const deleteDebt = (id, params) => endpoint.delete(`/budget/debt/${id}`, { params })
export const addDebtPayment = (id, formData) => endpoint.post(`/budget/debt/${id}/payment`, formData)
export const removeDebtPayment = (id, paymentId, params) => endpoint.delete(`/budget/debt/${id}/payment/${paymentId}`, { params })
export const toggleDebtStatus = (id, params) => endpoint.patch(`/budget/debt/${id}/toggle`, null, { params })
export const getBudgetLists = (params) => endpoint.get('/budget/lists', { params })
export const createBudgetList = (formData) => endpoint.post('/budget/list', formData)
export const updateBudgetList = (formData) => endpoint.patch('/budget/list', formData)
export const deleteBudgetList = (id, params) => endpoint.delete(`/budget/list/${id}`, { params })
export const getFinancialGoals = (params) => endpoint.get('/budget/goals', { params })
export const createFinancialGoal = (formData) => endpoint.post('/budget/goal', formData)
export const updateFinancialGoal = (formData) => endpoint.patch('/budget/goal', formData)
export const deleteFinancialGoal = (id, params) => endpoint.delete(`/budget/goal/${id}`, { params })
export const addGoalContribution = (id, formData) => endpoint.post(`/budget/goal/${id}/contribution`, formData)
export const removeGoalContribution = (id, contributionId, params) => endpoint.delete(`/budget/goal/${id}/contribution/${contributionId}`, { params })
export const shareBudget = (formData) => endpoint.post('/budget/share', formData)
export const unshareBudget = (formData) => endpoint.post('/budget/unshare', formData)
export const updateBudgetShare = (formData) => endpoint.patch('/budget/share', formData)
export const getSharedBudgets = () => endpoint.get('/budget/shared-with-me')
export const getSharedUsers = () => endpoint.get('/budget/shared-users')
export const searchBudgetUsers = (params) => endpoint.get('/budget/search-users', { params })
export const getBudgetShareLink = () => endpoint.get('/budget/share-link')
export const createBudgetShareLink = (formData) => endpoint.post('/budget/share-link', formData)
export const refreshBudgetShareLink = (formData) => endpoint.post('/budget/share-link/refresh', formData)
export const acceptBudgetInvite = (formData) => endpoint.post('/budget/share-link/accept', formData)
export const getBudgetAuditLogs = (params) => endpoint.get('/budget/audit-logs', { params })

export default endpoint
