export const DEFAULT_PAYMENT_METHODS = ['Cash', 'GCash', 'Bank', 'BPI', 'Credit Card', 'Debit Card', 'PayPal', 'Other']
export const CATEGORY_COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6']
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const VALID_TABS = ['dashboard', 'daily', 'monthly', 'categories', 'savings', 'debts', 'lists', 'goals', 'summary', 'settings']

export const CURRENCIES = [
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'KRW', symbol: '₩', name: 'Korean Won' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
]

export const DEFAULT_EXCHANGE_RATES = {
    USD: 0.0177,
    EUR: 0.0163,
    GBP: 0.0140,
    JPY: 2.6500,
    KRW: 24.5000,
    CNY: 0.1280,
    AUD: 0.0275,
    CAD: 0.0243,
    INR: 1.4900,
    THB: 0.6100,
}

export const ICON_GRID = [
    'wallet', 'cart-shopping', 'utensils', 'house', 'car', 'bolt', 'droplet', 'wifi',
    'phone', 'tv', 'gamepad', 'shirt', 'graduation-cap', 'briefcase-medical', 'plane',
    'bus', 'gas-pump', 'basket-shopping', 'gift', 'heart', 'dumbbell', 'book',
    'music', 'film', 'coffee', 'pizza-slice', 'dog', 'cat', 'baby', 'pills',
    'tooth', 'scissors', 'paint-roller', 'hammer', 'wrench', 'laptop', 'mobile',
    'credit-card', 'piggy-bank', 'coins', 'money-bill-wave', 'chart-line', 'chart-pie',
    'building', 'church', 'school', 'store', 'hotel', 'tree', 'seedling', 'sun',
    'umbrella', 'snowflake', 'fire', 'cloud', 'star', 'gem', 'crown', 'trophy',
    'flag', 'bell', 'envelope', 'calendar', 'clock', 'tag', 'tags', 'bookmark',
]

export const DENOMINATIONS = [
    { label: '₱1,000', value: 1000, type: 'bill' },
    { label: '₱500', value: 500, type: 'bill' },
    { label: '₱200', value: 200, type: 'bill' },
    { label: '₱100', value: 100, type: 'bill' },
    { label: '₱50', value: 50, type: 'bill' },
    { label: '₱20', value: 20, type: 'coin' },
    { label: '₱10', value: 10, type: 'coin' },
    { label: '₱5', value: 5, type: 'coin' },
    { label: '₱1', value: 1, type: 'coin' },
]
