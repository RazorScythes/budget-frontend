import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcPath = path.join(root, 'src/components/Pages/Budget.jsx')
const destDir = path.join(root, 'src/components/Pages/Budget')
const src = fs.readFileSync(srcPath, 'utf8')
const lines = src.split(/\r?\n/)

const TABS = [
    { file: 'DashboardTab.jsx', start: 1688, end: 3416, extra: `import React, { useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faWallet, faChartPie, faArrowUp, faArrowDown, faSyncAlt, faPiggyBank,
    faHandHoldingUsd, faCheckCircle, faExclamationTriangle, faCalendarCheck,
    faEye, faFilePdf, faCoins,
} from '@fortawesome/free-solid-svg-icons'
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { AnimateIn, ModalOverlay } from './SharedComponents'
import BalanceAmount from './BalanceAmount'
import TrendsChart from './TrendsChart'
import { calcNetWorth } from '../../../utils/netWorth'
import { calcAllSavingsTotal } from '../../../utils/savings'
import { calcCashRunway } from '../../../utils/cashRunway'
import { MONTHS } from './constants'` },
    { file: 'DailyExpensesTab.jsx', start: 3417, end: 4686, extra: `import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faPlus, faMinus, faTrash, faPen, faCheck, faTimes, faFilter, faSearch,
    faFileExport, faSyncAlt, faClone, faEye, faSpinner, faCalendarDay,
} from '@fortawesome/free-solid-svg-icons'
import { AnimateIn, ModalOverlay } from './SharedComponents'
import { toLocalDateString } from './utils'
import { CURRENCIES, DEFAULT_EXCHANGE_RATES } from './constants'
import { findDuplicateCandidates, applyCategoryRules } from '../../../utils/duplicates'
import {
    searchBudgetExpenses, importBudgetCSV, processRecurring, clearSearchResults,
    createBudgetExpense, getExchangeRates, saveExchangeRates, resetExchangeRates,
} from '../../../actions/budget'` },
    { file: 'MonthlyBudgetTab.jsx', start: 4687, end: 4928, extra: `import React, { useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faWallet, faChartPie, faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons'
import { AnimateIn, ModalOverlay } from './SharedComponents'
import { MONTHS } from './constants'` },
    { file: 'CategoriesTab.jsx', start: 4929, end: 5227, extra: `import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faPen, faTrash, faShare, faTags } from '@fortawesome/free-solid-svg-icons'
import { AnimateIn } from './SharedComponents'
import ShareCategoryModal from './ShareCategoryModal'
import { CATEGORY_COLORS, ICON_GRID } from './constants'
import { shareBudgetCategory, unshareBudgetCategory } from '../../../actions/budget'` },
    { file: 'DebtTab.jsx', start: 5228, end: 5623, extra: `import React, { useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faPen, faTrash, faHandHoldingUsd, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { AnimateIn, DeleteConfirmModal } from './SharedComponents'
import BalanceAmount from './BalanceAmount'
import { CURRENCIES } from './constants'
import { monthsToPayOff, remainingBalance, snowballOrder, avalancheOrder } from '../../../utils/debtPayoff'
import { createDebt, updateDebt, deleteDebt, addDebtPayment, removeDebtPayment, toggleDebtStatus } from '../../../actions/budget'` },
    { file: 'ListsTab.jsx', start: 5625, end: 6231, extra: `import React, { useState, useEffect, useMemo, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faPen, faTrash, faListAlt, faSearch, faCheck } from '@fortawesome/free-solid-svg-icons'
import { AnimateIn, DeleteConfirmModal, SafeIcon as SafeIconShared } from './SharedComponents'
import { CATEGORY_COLORS, CURRENCIES } from './constants'
import { createBudgetList, updateBudgetList, deleteBudgetList, createBudgetExpense } from '../../../actions/budget'` },
    { file: 'SummaryTab.jsx', start: 6232, end: 7121, extra: `import React, { useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFilePdf, faFileExport, faChartPie } from '@fortawesome/free-solid-svg-icons'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { AnimateIn } from './SharedComponents'
import BalanceAmount from './BalanceAmount'
import TrendsChart from './TrendsChart'
import { MONTHS } from './constants'
import { generateBudgetSummaryPdf, formatPdfAmount, sanitizePdfText } from '../../../utils/budgetSummaryPdf'` },
    { file: 'GoalsTab.jsx', start: 7122, end: 7471, extra: `import React, { useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faPen, faTrash, faPiggyBank, faCheckCircle } from '@fortawesome/free-solid-svg-icons'
import { AnimateIn, DeleteConfirmModal } from './SharedComponents'
import BalanceAmount from './BalanceAmount'
import { CATEGORY_COLORS, CURRENCIES } from './constants'
import { createFinancialGoal, updateFinancialGoal, deleteFinancialGoal, addGoalContribution, removeGoalContribution } from '../../../actions/budget'` },
]

for (const tab of TABS) {
    const body = lines.slice(tab.start - 1, tab.end).join('\n')
        .replace(/^const (\w+) = React\.memo/, 'const $1 = React.memo')
    const exported = body.includes('export default')
        ? body
        : `${body}\n\nexport default ${body.match(/const (\w+) = React\.memo/)?.[1] || 'Component'}\n`
    const out = `${tab.extra}\n\n${exported}`
    fs.writeFileSync(path.join(destDir, tab.file), out)
    console.log('wrote', tab.file, 'lines', tab.end - tab.start + 1)
}

const head = lines.slice(0, 1687)
const importBlock = `import DashboardTab from './Budget/DashboardTab'
import DailyExpensesTab from './Budget/DailyExpensesTab'
import MonthlyBudgetTab from './Budget/MonthlyBudgetTab'
import CategoriesTab from './Budget/CategoriesTab'
import DebtTab from './Budget/DebtTab'
import ListsTab from './Budget/ListsTab'
import SummaryTab from './Budget/SummaryTab'
import GoalsTab from './Budget/GoalsTab'`

let next = head.join('\n')
if (!next.includes("import DashboardTab")) {
    next = next.replace(
        "import SettingsTab from './Budget/SettingsTab'",
        `import SettingsTab from './Budget/SettingsTab'\n${importBlock}`
    )
}
next = next
    .replace(/const DeleteConfirmModal =[\s\S]*?^}\n\n/m, '')
    .replace(/const AnimateIn =[\s\S]*?^}\n\n/m, '')
    .replace(
        "import { ModalOverlay, AnimateIn as AnimateInShared, SafeIcon as SafeIconShared } from './Budget/SharedComponents'",
        "import { ModalOverlay, DeleteConfirmModal } from './Budget/SharedComponents'"
    )

if (!next.trimEnd().endsWith('export default Budget')) {
    next = `${next.trimEnd()}\n\nexport default Budget\n`
}

fs.writeFileSync(srcPath, next)
console.log('trimmed Budget.jsx to', next.split('\n').length, 'lines')
