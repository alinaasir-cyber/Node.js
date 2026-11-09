const API_ROOT = '/backend/api/v1'
export const DEMO_TOKEN = 'ledgerly-local-demo'
const DEMO_TRANSACTIONS_KEY = 'ledgerly-demo-transactions'
const DEMO_ACCOUNTS_KEY = 'ledgerly-demo-accounts'
const DEMO_BUDGETS_KEY = 'ledgerly-demo-budgets'
const DEMO_GOALS_KEY = 'ledgerly-demo-goals'
const DEMO_DEBTS_KEY = 'ledgerly-demo-debts'

function demoId() {
  return crypto.randomUUID()
}

function readDemoCollection(key, seed) {
  const saved = localStorage.getItem(key)
  if (saved) return JSON.parse(saved)
  const collection = seed()
  localStorage.setItem(key, JSON.stringify(collection))
  return collection
}

function saveDemoCollection(key, items) {
  localStorage.setItem(key, JSON.stringify(items))
  return items
}

function demoAccounts() {
  return readDemoCollection(DEMO_ACCOUNTS_KEY, () => [
    { id: demoId(), name: 'Everyday checking', accountType: 'checking', institution: 'Community Bank', openingBalance: 1200, creditLimit: null },
    { id: demoId(), name: 'Rainy day savings', accountType: 'savings', institution: 'Community Bank', openingBalance: 2500, creditLimit: null },
    { id: demoId(), name: 'Travel card', accountType: 'credit_card', institution: 'Everyday Card', openingBalance: 460, creditLimit: 3000 }
  ])
}

function demoBudgets() {
  return readDemoCollection(DEMO_BUDGETS_KEY, () => {
    const now = new Date()
    return [
      { id: demoId(), category: 'Housing', monthlyLimit: 1000, month: now.getMonth() + 1, year: now.getFullYear() },
      { id: demoId(), category: 'Food', monthlyLimit: 500, month: now.getMonth() + 1, year: now.getFullYear() },
      { id: demoId(), category: 'Transport', monthlyLimit: 300, month: now.getMonth() + 1, year: now.getFullYear() }
    ]
  })
}

function demoGoals() {
  return readDemoCollection(DEMO_GOALS_KEY, () => [
    { id: demoId(), name: 'Emergency fund', targetAmount: 10000, savedAmount: 4250, targetDate: null },
    { id: demoId(), name: 'Summer getaway', targetAmount: 2500, savedAmount: 1350, targetDate: new Date(new Date().getFullYear() + 1, 5, 1).toISOString() }
  ])
}

function demoDebts() {
  return readDemoCollection(DEMO_DEBTS_KEY, () => [
    { id: demoId(), name: 'Travel card', debtType: 'credit_card', balance: 460, creditLimit: 3000, minimumPayment: 35, dueDate: null },
    { id: demoId(), name: 'Student loan', debtType: 'loan', balance: 6800, creditLimit: null, minimumPayment: 180, dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15).toISOString() }
  ])
}

function demoTransactions() {
  const saved = localStorage.getItem(DEMO_TRANSACTIONS_KEY)
  if (saved) return JSON.parse(saved)

  const now = new Date()
  const accounts = demoAccounts()
  const entries = []
  const addEntry = (monthOffset, day, title, amount, type, category) => {
    const date = new Date(now.getFullYear(), now.getMonth() + monthOffset, day, 12)
    entries.push({
      _id: crypto.randomUUID(),
      owner: 'ledgerly-demo',
      title,
      amount,
      type,
      category,
      accountId: type === 'income' ? accounts[0].id : accounts[2].id,
      transferAccountId: null,
      costType: type === 'expense' && category === 'Housing' ? 'fixed' : 'variable',
      date: date.toISOString(),
      createdAt: date.toISOString(),
      updatedAt: date.toISOString()
    })
  }

  const monthlyData = [
    { income: 3900, expenses: [720, 390, 180], day: 5 },
    { income: 4050, expenses: [760, 420, 195], day: 4 },
    { income: 4050, expenses: [740, 410, 210], day: 6 },
    { income: 4200, expenses: [790, 445, 200], day: 3 },
    { income: 4200, expenses: [820, 400, 225], day: 5 },
    { income: 4200, expenses: [850, 430, 250], day: Math.min(now.getDate(), 8) }
  ]
  const expenseItems = [
    ['Apartment rent', 'Housing'],
    ['Grocery market', 'Food'],
    ['Local transit', 'Transport']
  ]

  monthlyData.forEach(({ income, expenses, day }, index) => {
    const offset = index - monthlyData.length + 1
    addEntry(offset, day, 'Monthly salary', income, 'income', 'Salary')
    expenses.forEach((amount, expenseIndex) => {
      const [title, category] = expenseItems[expenseIndex]
      addEntry(offset, Math.min(day + expenseIndex, 27), title, amount, 'expense', category)
    })
  })

  localStorage.setItem(DEMO_TRANSACTIONS_KEY, JSON.stringify(entries))
  return entries
}

function saveDemoTransactions(transactions) {
  localStorage.setItem(DEMO_TRANSACTIONS_KEY, JSON.stringify(transactions))
}

function parseDemoCsv(csv) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index]
    if (quoted) {
      if (character === '"' && csv[index + 1] === '"') {
        field += '"'
        index += 1
      } else if (character === '"') quoted = false
      else field += character
    } else if (character === '"' && field === '') quoted = true
    else if (character === ',') {
      row.push(field.trim())
      field = ''
    } else if (character === '\n' || character === '\r') {
      row.push(field.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      field = ''
      if (character === '\r' && csv[index + 1] === '\n') index += 1
    } else field += character
  }
  row.push(field.trim())
  if (row.some(Boolean)) rows.push(row)
  if (quoted) throw new Error('CSV contains an unclosed quoted field')
  if (rows.length < 2) throw new Error('CSV must include a header and at least one transaction')
  const headers = rows[0].map((header) => header.toLowerCase().replace(/[\s-]+/g, '_'))
  const required = ['date', 'description', 'amount', 'type', 'category']
  const missing = required.filter((header) => !headers.includes(header))
  if (missing.length) throw new Error(`CSV is missing required columns: ${missing.join(', ')}`)
  const accounts = demoAccounts()
  return rows.slice(1).map((cells, index) => {
    if (cells.length !== headers.length) throw new Error(`Line ${index + 2}: wrong number of columns`)
    const item = Object.fromEntries(headers.map((header, column) => [header, cells[column]]))
    const amount = Number(item.amount)
    const date = new Date(item.date)
    const type = item.type.toLowerCase()
    if (!item.description || !Number.isFinite(date.getTime()) || !Number.isFinite(amount) || amount <= 0 ||
      !['income', 'expense', 'transfer'].includes(type) || !item.category) {
      throw new Error(`Line ${index + 2}: check the date, description, amount, type and category`)
    }
    const account = accounts.find((entry) => entry.name.toLowerCase() === item.account?.toLowerCase())
    const transferAccount = accounts.find((entry) => entry.name.toLowerCase() === item.transfer_account?.toLowerCase())
    if (item.account && !account) throw new Error(`Line ${index + 2}: account "${item.account}" was not found`)
    if (item.transfer_account && !transferAccount) throw new Error(`Line ${index + 2}: transfer account "${item.transfer_account}" was not found`)
    if (type === 'transfer' && (!account || !transferAccount || account.id === transferAccount.id)) {
      throw new Error(`Line ${index + 2}: a transfer needs two different accounts`)
    }
    if (item.cost_type && !['fixed', 'variable'].includes(item.cost_type.toLowerCase())) {
      throw new Error(`Line ${index + 2}: cost_type must be fixed or variable`)
    }
    return {
      _id: demoId(),
      owner: 'ledgerly-demo',
      title: item.description,
      amount,
      type,
      category: item.category,
      date: date.toISOString(),
      accountId: account?.id ?? null,
      transferAccountId: transferAccount?.id ?? null,
      costType: item.cost_type?.toLowerCase() === 'fixed' ? 'fixed' : 'variable',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  })
}

async function requestDemoApi(path, options = {}) {
  const url = new URL(path, location.origin)
  const method = options.method ?? 'GET'
  let transactions = demoTransactions()
  const accounts = demoAccounts()
  const ownerId = 'ledgerly-demo'
  const idPath = (collection) => url.pathname.match(new RegExp(`^/${collection}/([0-9a-f-]+)$`, 'i'))

  if (url.pathname === '/accounts' && method === 'GET') {
    const result = accounts.map((account) => {
      const liability = ['credit_card', 'loan'].includes(account.accountType)
      const total = transactions.reduce((balance, transaction) => {
        if (transaction.accountId === account.id) {
          if (liability) return balance + (transaction.type === 'expense' ? Number(transaction.amount) : transaction.type === 'income' ? -Number(transaction.amount) : Number(transaction.amount))
          return balance + (transaction.type === 'income' ? Number(transaction.amount) : transaction.type === 'expense' ? -Number(transaction.amount) : -Number(transaction.amount))
        }
        if (transaction.transferAccountId === account.id) {
          return balance + (liability ? -Number(transaction.amount) : Number(transaction.amount))
        }
        return balance
      }, Number(account.openingBalance))
      return { ...account, balance: total, isLiability: liability }
    })
    return { success: true, data: { accounts: result } }
  }

  if (url.pathname === '/accounts' && method === 'POST') {
    const body = JSON.parse(options.body)
    const account = { ...body, id: demoId(), institution: body.institution ?? '', openingBalance: Number(body.openingBalance) || 0, creditLimit: body.creditLimit ? Number(body.creditLimit) : null }
    saveDemoCollection(DEMO_ACCOUNTS_KEY, [...accounts, account])
    return { success: true, data: { account } }
  }
  const accountMatch = idPath('accounts')
  if (accountMatch && method === 'PUT') {
    const body = JSON.parse(options.body)
    const updated = accounts.map((item) => item.id === accountMatch[1] ? { ...item, ...body } : item)
    if (updated.every((item) => item.id !== accountMatch[1])) throw new Error('Account not found')
    saveDemoCollection(DEMO_ACCOUNTS_KEY, updated)
    return { success: true, data: { account: updated.find((item) => item.id === accountMatch[1]) } }
  }
  if (accountMatch && method === 'DELETE') {
    if (transactions.some((item) => item.accountId === accountMatch[1] || item.transferAccountId === accountMatch[1])) {
      throw new Error("Delete or reassign this account's transactions first")
    }
    const updated = accounts.filter((item) => item.id !== accountMatch[1])
    saveDemoCollection(DEMO_ACCOUNTS_KEY, updated)
    return { success: true, message: 'Account deleted' }
  }

  if (url.pathname === '/transactions/monthly-summary' && method === 'GET') {
    const year = Number(url.searchParams.get('year'))
    const month = Number(url.searchParams.get('month'))
    const monthTransactions = transactions.filter((item) => {
      const date = new Date(item.date)
      return date.getFullYear() === year && date.getMonth() + 1 === month
    })
    const income = monthTransactions.filter((item) => item.type === 'income').reduce((total, item) => total + Number(item.amount), 0)
    const expense = monthTransactions.filter((item) => item.type === 'expense').reduce((total, item) => total + Number(item.amount), 0)
    const byCategory = new Map()
    const byCostType = { fixed: 0, variable: 0 }
    monthTransactions.filter((item) => item.type === 'expense').forEach((item) => {
      byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + Number(item.amount))
      const costType = item.costType === 'fixed' ? 'fixed' : 'variable'
      byCostType[costType] += Number(item.amount)
    })
    return {
      success: true,
      data: {
        year,
        month,
        income,
        expense,
        balance: income - expense,
        expensesByCategory: [...byCategory].map(([category, total]) => ({ category, total })).sort((a, b) => b.total - a.total),
        expensesByType: byCostType
      }
    }
  }

  if (url.pathname === '/transactions' && method === 'GET') {
    const type = url.searchParams.get('type')
    const category = url.searchParams.get('category')
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const filtered = transactions
      .filter((item) => !type || item.type === type)
      .filter((item) => !category || item.category === category)
      .filter((item) => !from || new Date(item.date) >= new Date(from))
      .filter((item) => !to || new Date(item.date) <= new Date(to))
      .sort((a, b) => new Date(b.date) - new Date(a.date) || b._id.localeCompare(a._id))
    const page = Math.max(Number(url.searchParams.get('page')) || 1, 1)
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 20, 1), 100)
    const total = filtered.length
    return {
      success: true,
      data: {
        transactions: filtered.slice((page - 1) * limit, page * limit),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    }
  }

  if (url.pathname === '/transactions' && method === 'POST') {
    const body = JSON.parse(options.body)
    const now = new Date().toISOString()
    const transaction = { ...body, _id: demoId(), owner: 'ledgerly-demo', createdAt: now, updatedAt: now }
    transactions = [transaction, ...transactions]
    saveDemoTransactions(transactions)
    return { success: true, data: { transaction } }
  }

  const transactionMatch = url.pathname.match(/^\/transactions\/([0-9a-f-]+)$/i)
  if (transactionMatch && method === 'PUT') {
    const body = JSON.parse(options.body)
    let updated = null
    transactions = transactions.map((item) => {
      if (item._id !== transactionMatch[1]) return item
      updated = { ...item, ...body, updatedAt: new Date().toISOString() }
      return updated
    })
    if (!updated) throw new Error('Transaction not found')
    saveDemoTransactions(transactions)
    return { success: true, data: { transaction: updated } }
  }

  if (transactionMatch && method === 'DELETE') {
    const remaining = transactions.filter((item) => item._id !== transactionMatch[1])
    if (remaining.length === transactions.length) throw new Error('Transaction not found')
    saveDemoTransactions(remaining)
    return { success: true, message: 'Transaction deleted' }
  }

  if (url.pathname === '/transactions/import' && method === 'POST') {
    const imported = parseDemoCsv(JSON.parse(options.body).csv)
    saveDemoTransactions([...imported, ...transactions])
    return { success: true, data: { imported: imported.length }, message: `${imported.length} transactions imported` }
  }

  if (url.pathname === '/monthly-comparison' && method === 'GET') {
    const year = Number(url.searchParams.get('year'))
    const month = Number(url.searchParams.get('month'))
    const count = Math.min(Math.max(Number(url.searchParams.get('count')) || 6, 2), 24)
    const months = Array.from({ length: count }, (_, index) => {
      const date = new Date(year, month - count + index, 1)
      const entries = transactions.filter((item) => {
        const transactionDate = new Date(item.date)
        return transactionDate.getFullYear() === date.getFullYear() && transactionDate.getMonth() === date.getMonth()
      })
      const income = entries.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0)
      const expense = entries.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0)
      return { year: date.getFullYear(), month: date.getMonth() + 1, income, expense, balance: income - expense }
    })
    return { success: true, data: { months } }
  }

  if (url.pathname === '/net-worth' && method === 'GET') {
    const balances = accounts.map((account) => {
      const liability = ['credit_card', 'loan'].includes(account.accountType)
      const current = transactions.reduce((balance, transaction) => {
        if (transaction.accountId === account.id) return balance + (transaction.type === 'income' ? (liability ? -1 : 1) : transaction.type === 'expense' ? (liability ? 1 : -1) : (liability ? 1 : -1)) * Number(transaction.amount)
        if (transaction.transferAccountId === account.id) return balance + (liability ? -1 : 1) * Number(transaction.amount)
        return balance
      }, Number(account.openingBalance))
      return { liability, current }
    })
    const debts = demoDebts().reduce((sum, item) => sum + Number(item.balance), 0)
    const assets = balances.filter((item) => !item.liability).reduce((sum, item) => sum + item.current, 0)
    const liabilities = balances.filter((item) => item.liability).reduce((sum, item) => sum + item.current, 0) + debts
    return { success: true, data: { assets, liabilities, netWorth: assets - liabilities } }
  }

  if (url.pathname === '/budgets' && method === 'GET') {
    const month = Number(url.searchParams.get('month'))
    const year = Number(url.searchParams.get('year'))
    const currentBudgets = demoBudgets().filter((item) => item.month === month && item.year === year)
    const budgets = currentBudgets.map((item) => {
      const spent = transactions.filter((transaction) => {
        const date = new Date(transaction.date)
        return transaction.type === 'expense' && transaction.category === item.category &&
          date.getFullYear() === year && date.getMonth() + 1 === month
      }).reduce((sum, transaction) => sum + Number(transaction.amount), 0)
      return { ...item, spent, remaining: item.monthlyLimit - spent, percentUsed: Math.round((spent / item.monthlyLimit) * 100) }
    })
    return { success: true, data: { budgets, month, year } }
  }
  if (url.pathname === '/budgets' && method === 'PUT') {
    const body = JSON.parse(options.body)
    const budget = { ...body, id: demoId(), monthlyLimit: Number(body.monthlyLimit), month: Number(body.month), year: Number(body.year) }
    const updated = demoBudgets().filter((item) => !(item.category === budget.category && item.month === budget.month && item.year === budget.year))
    saveDemoCollection(DEMO_BUDGETS_KEY, [...updated, budget])
    return { success: true, data: { budget } }
  }
  const budgetMatch = idPath('budgets')
  if (budgetMatch && method === 'DELETE') {
    saveDemoCollection(DEMO_BUDGETS_KEY, demoBudgets().filter((item) => item.id !== budgetMatch[1]))
    return { success: true, message: 'Budget deleted' }
  }

  const collectionConfig = [
    { path: '/goals', key: DEMO_GOALS_KEY, get: demoGoals, singular: 'goal' },
    { path: '/debts', key: DEMO_DEBTS_KEY, get: demoDebts, singular: 'debt' }
  ]
  for (const config of collectionConfig) {
    const collection = config.get()
    if (url.pathname === config.path && method === 'GET') return { success: true, data: { [config.path.slice(1)]: collection } }
    if (url.pathname === config.path && method === 'POST') {
      const body = JSON.parse(options.body)
      const created = { ...body, id: demoId() }
      saveDemoCollection(config.key, [...collection, created])
      return { success: true, data: { [config.singular]: created } }
    }
    const match = idPath(config.path.slice(1))
    if (match && method === 'PUT') {
      const body = JSON.parse(options.body)
      const updated = collection.map((item) => item.id === match[1] ? { ...item, ...body } : item)
      if (updated.every((item) => item.id !== match[1])) throw new Error(`${config.singular[0].toUpperCase()}${config.singular.slice(1)} not found`)
      saveDemoCollection(config.key, updated)
      return { success: true, data: { [config.singular]: updated.find((item) => item.id === match[1]) } }
    }
    if (match && method === 'DELETE') {
      saveDemoCollection(config.key, collection.filter((item) => item.id !== match[1]))
      return { success: true, message: `${config.singular} deleted` }
    }
  }

  throw new Error(`Demo mode does not support ${method} ${url.pathname}`)
}

export async function apiRequest(path, { token, ...options } = {}) {
  if (token === DEMO_TOKEN) return requestDemoApi(path, options)

  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${API_ROOT}${path}`, { ...options, headers })
  const result = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(result.message || `Request failed (${response.status})`)
  }

  return result
}

export const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2
})

export function formatMoney(value) {
  return currency.format(Number(value) || 0)
}

export function localDateInput(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export function displayDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value))
}

export function monthLabel(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
}
