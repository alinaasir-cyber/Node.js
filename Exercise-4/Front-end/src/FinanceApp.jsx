import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest, DEMO_TOKEN, displayDate, formatMoney, localDateInput, monthLabel } from './api.js'
import { Icon } from './Icons.jsx'
import {
  AccountsPanel,
  BudgetsPanel,
  CsvImportButton,
  DebtsPanel,
  GoalsPanel,
  ResourceModal
} from './FinanceModules.jsx'

const categories = {
  income: ['Salary', 'Business', 'Investment', 'Gift', 'Other'],
  expense: ['Food', 'Transport', 'Housing', 'Utilities', 'Health', 'Education', 'Shopping', 'Entertainment', 'Other']
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'transactions', label: 'Transactions', icon: 'card' },
  { id: 'accounts', label: 'Accounts', icon: 'wallet' },
  { id: 'budgets', label: 'Budgets', icon: 'chart' },
  { id: 'goals', label: 'Savings goals', icon: 'spark' },
  { id: 'debts', label: 'Debt & credit', icon: 'card' },
  { id: 'reports', label: 'Reports', icon: 'chart' }
]

function getMonthParams(date) {
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

function MetricCard({ title, value, note, icon, tone, sign }) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <div className="metric-top">
        <span>{title}</span>
        <span className="metric-icon"><Icon name={icon} size={19} /></span>
      </div>
      <strong>{value}</strong>
      <div className="metric-note"><span className="trend-chip"><Icon name={sign === 'down' ? 'arrowDown' : 'arrowUp'} size={13} /> This month</span><span>{note}</span></div>
    </article>
  )
}

function TransactionForm({ token, transaction, accounts, onClose, onSaved }) {
  const [type, setType] = useState(transaction?.type ?? 'expense')
  const [costType, setCostType] = useState(transaction?.costType ?? 'variable')
  const [sourceAccountId, setSourceAccountId] = useState(transaction?.accountId ?? '')
  const [error, setError] = useState('')
  const edit = Boolean(transaction)
  const mutation = useMutation({
    mutationFn: (body) => apiRequest(edit ? `/transactions/${transaction._id}` : '/transactions', {
      token,
      method: edit ? 'PUT' : 'POST',
      body: JSON.stringify(body)
    }),
    onSuccess: onSaved,
    onError: (requestError) => setError(requestError.message)
  })

  function submit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const body = {
      title: formData.get('title').trim(),
      amount: Number(formData.get('amount')),
      type,
      category: type === 'transfer' ? 'Transfer' : formData.get('category'),
      date: new Date(`${formData.get('date')}T12:00:00`).toISOString(),
      costType: type === 'transfer' ? 'variable' : costType,
      accountId: formData.get('accountId') || undefined,
      transferAccountId: type === 'transfer' ? formData.get('transferAccountId') : undefined
    }
    mutation.mutate(body)
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section aria-labelledby="transaction-modal-title" aria-modal="true" className="transaction-modal" role="dialog">
        <div className="modal-heading">
          <div><span className="eyebrow">YOUR MONEY, ORGANIZED</span><h2 id="transaction-modal-title">{edit ? 'Edit transaction' : 'Add transaction'}</h2></div>
          <button aria-label="Close dialog" className="icon-button" onClick={onClose} type="button"><Icon name="close" /></button>
        </div>
        <form className="transaction-form" onSubmit={submit}>
          <div className="type-switch" role="group" aria-label="Transaction type">
            {['expense', 'income', 'transfer'].map((item) => (
              <button className={type === item ? `type-option is-${item}` : 'type-option'} key={item} onClick={() => setType(item)} type="button">
                <Icon name={item === 'income' ? 'arrowDown' : item === 'transfer' ? 'card' : 'arrowUp'} size={16} /> {item === 'income' ? 'Income' : item === 'transfer' ? 'Transfer' : 'Expense'}
              </button>
            ))}
          </div>
          <label>Description<input autoFocus defaultValue={transaction?.title ?? ''} maxLength={120} name="title" placeholder="e.g. Grocery shopping" required /></label>
          <div className="form-row">
            <label>Amount<input defaultValue={transaction?.amount ?? ''} min="0.01" name="amount" placeholder="0.00" required step="0.01" type="number" /></label>
            <label>Date<input defaultValue={transaction ? localDateInput(new Date(transaction.date)) : localDateInput()} name="date" required type="date" /></label>
          </div>
          {accounts.length > 0 && (
            <label>{type === 'transfer' ? 'From account' : 'Account (optional)'}
              <select onChange={(event) => setSourceAccountId(event.target.value)} value={sourceAccountId} name="accountId" required={type === 'transfer'}>
                {type !== 'transfer' && <option value="">Not linked to an account</option>}
                {type === 'transfer' && <option value="">Choose source account</option>}
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
            </label>
          )}
          {type === 'transfer' && (
            <label>To account
              <select defaultValue={transaction?.transferAccountId ?? ''} name="transferAccountId" required>
                <option value="">Choose destination</option>
                {accounts.filter((account) => account.id !== sourceAccountId).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
            </label>
          )}
          {type !== 'transfer' && <>
            <label>Category
              <select defaultValue={transaction?.category ?? categories[type][0]} key={type} name="category">
                {categories[type].map((category) => <option key={category}>{category}</option>)}
              </select>
            </label>
            <div className="cost-type-field"><span>Expense type</span><div><button className={costType === 'fixed' ? 'cost-type-active' : ''} onClick={() => setCostType('fixed')} type="button">Fixed cost</button><button className={costType === 'variable' ? 'cost-type-active' : ''} onClick={() => setCostType('variable')} type="button">Variable</button></div></div>
          </>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="button button-quiet" onClick={onClose} type="button">Cancel</button>
            <button className="button button-primary" disabled={mutation.isPending} type="submit">{mutation.isPending ? 'Saving...' : edit ? 'Save changes' : 'Add transaction'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}

function TransactionTable({ transactions, onEdit, onDelete, deletingId, emptyText }) {
  if (!transactions.length) {
    return <div className="empty-state"><span className="empty-icon"><Icon name="wallet" size={23} /></span><strong>No transactions yet</strong><p>{emptyText}</p></div>
  }
  return (
    <div className="transaction-table-wrap">
      <table className="transaction-table">
        <thead><tr><th>Transaction</th><th>Category</th><th>Date</th><th>Amount</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
        <tbody>
          {transactions.map((transaction) => {
            const income = transaction.type === 'income'
            const transfer = transaction.type === 'transfer'
            return (
              <tr key={transaction._id}>
                <td><div className="transaction-name"><span className={`transaction-avatar ${income ? 'avatar-income' : transfer ? 'avatar-transfer' : 'avatar-expense'}`}><Icon name={income ? 'arrowDown' : transfer ? 'card' : 'arrowUp'} size={17} /></span><span><strong>{transaction.title}</strong><small>{income ? 'Income' : transfer ? 'Account transfer' : `${transaction.costType === 'fixed' ? 'Fixed' : 'Variable'} expense`}</small></span></div></td>
                <td><span className="category-tag">{transfer ? transaction.fromAccountName ? `${transaction.fromAccountName} → ${transaction.toAccountName}` : 'Transfer' : transaction.category}</span></td>
                <td className="date-cell">{displayDate(transaction.date)}</td>
                <td><strong className={transfer ? 'amount-transfer' : income ? 'amount-positive' : 'amount-negative'}>{transfer ? '' : income ? '+' : '−'}{formatMoney(transaction.amount)}</strong></td>
                <td><div className="row-actions"><button aria-label={`Edit ${transaction.title}`} className="text-action" onClick={() => onEdit(transaction)} type="button">Edit</button><button aria-label={`Delete ${transaction.title}`} className="text-action text-danger" disabled={deletingId === transaction._id} onClick={() => onDelete(transaction)} type="button">Delete</button></div></td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function SpendingBreakdown({ categories: items = [] }) {
  const colors = ['#ef4444', '#f97316', '#10b981', '#a855f7', '#2563eb', '#eab308', '#06b6d4']
  const max = Math.max(...items.map((item) => Number(item.total)), 0)
  return (
    <div className="breakdown-list">
      {items.length ? items.slice(0, 5).map((item, index) => (
        <div className="breakdown-item" key={item.category}>
          <div className="breakdown-label"><span><i style={{ backgroundColor: colors[index % colors.length] }} />{item.category}</span><strong>{formatMoney(item.total)}</strong></div>
          <div className="progress-track"><span style={{ width: `${max ? Math.max((Number(item.total) / max) * 100, 4) : 0}%`, backgroundColor: colors[index % colors.length] }} /></div>
        </div>
      )) : <p className="muted-copy">Your category insights will show here as you add expenses.</p>}
    </div>
  )
}

function SpendingChart({ history }) {
  const max = Math.max(...history.map((item) => Math.max(item.income, item.expense)), 1)
  return (
    <div className="chart-area">
      <div className="chart-legend"><span><i className="legend-income" /> Income</span><span><i className="legend-expense" /> Expenses</span></div>
      <div className="bar-chart">
        {history.map((item) => (
          <div className="bar-group" key={`${item.year}-${item.month}`}>
            <div className="bar-pair">
              <span className="chart-bar bar-income" style={{ height: `${Math.max((item.income / max) * 100, item.income ? 4 : 0)}%` }} title={`Income ${formatMoney(item.income)}`} />
              <span className="chart-bar bar-expense" style={{ height: `${Math.max((item.expense / max) * 100, item.expense ? 4 : 0)}%` }} title={`Expenses ${formatMoney(item.expense)}`} />
            </div>
            <span className="bar-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SpendingPie({ categories: items = [] }) {
  const colors = ['#ef4444', '#f97316', '#10b981', '#a855f7', '#2563eb', '#eab308', '#06b6d4']
  const total = items.reduce((sum, item) => sum + Number(item.total), 0)
  let start = 0
  const segments = items.map((item, index) => {
    const end = start + (total ? Number(item.total) / total * 100 : 0)
    const segment = `${colors[index % colors.length]} ${start}% ${end}%`
    start = end
    return segment
  })
  return (
    <div className="pie-report">
      {total ? <div aria-label={`Total expenses ${formatMoney(total)}`} className="spending-pie" role="img" style={{ background: `conic-gradient(${segments.join(', ')})` }}><span><strong>{formatMoney(total)}</strong><small>spent</small></span></div> : <div className="spending-pie spending-pie-empty"><span><strong>$0</strong><small>spent</small></span></div>}
      <div className="pie-legend">{items.length ? items.slice(0, 7).map((item, index) => <div key={item.category}><span><i style={{ background: colors[index % colors.length] }} />{item.category}</span><strong>{total ? Math.round((Number(item.total) / total) * 100) : 0}%</strong></div>) : <p className="muted-copy">No expenses in this period yet.</p>}</div>
    </div>
  )
}

export function FinanceApp({ auth, onSignOut }) {
  const [activePage, setActivePage] = useState('overview')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [resource, setResource] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')
  const queryClient = useQueryClient()
  const now = new Date()
  const monthParams = getMonthParams(now)
  const queryKey = ['transactions', auth.token, filterType, filterCategory]
  const accountsQuery = useQuery({
    queryKey: ['accounts', auth.token],
    queryFn: () => apiRequest('/accounts', { token: auth.token }),
    retry: 1
  })
  const budgetsQuery = useQuery({
    queryKey: ['budgets', auth.token, monthParams.year, monthParams.month],
    queryFn: () => apiRequest(`/budgets?year=${monthParams.year}&month=${monthParams.month}`, { token: auth.token }),
    retry: 1
  })
  const goalsQuery = useQuery({
    queryKey: ['goals', auth.token],
    queryFn: () => apiRequest('/goals', { token: auth.token }),
    retry: 1
  })
  const debtsQuery = useQuery({
    queryKey: ['debts', auth.token],
    queryFn: () => apiRequest('/debts', { token: auth.token }),
    retry: 1
  })
  const netWorthQuery = useQuery({
    queryKey: ['net-worth', auth.token],
    queryFn: () => apiRequest('/net-worth', { token: auth.token }),
    retry: 1
  })
  const summaryQuery = useQuery({
    queryKey: ['summary', auth.token, monthParams.year, monthParams.month],
    queryFn: () => apiRequest(`/transactions/monthly-summary?year=${monthParams.year}&month=${monthParams.month}`, { token: auth.token }),
    retry: 1
  })
  const transactionQuery = useQuery({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams({ page: '1', limit: '100' })
      if (filterType !== 'all') params.set('type', filterType)
      if (filterCategory !== 'all') params.set('category', filterCategory)
      return apiRequest(`/transactions?${params}`, { token: auth.token })
    },
    retry: 1
  })
  const historyQuery = useQuery({
    queryKey: ['monthly-history', auth.token, now.getFullYear(), now.getMonth()],
    queryFn: async () => {
      const result = await apiRequest(`/monthly-comparison?year=${monthParams.year}&month=${monthParams.month}&count=6`, { token: auth.token })
      return result.data.months.map((item) => ({
        ...item,
        label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(item.year, item.month - 1, 1))
      }))
    },
    retry: 1
  })

  const deleteMutation = useMutation({
    mutationFn: (transaction) => apiRequest(`/transactions/${transaction._id}`, { token: auth.token, method: 'DELETE' }),
    onSuccess: () => {
      setNotice('Transaction deleted.')
      queryClient.invalidateQueries({ queryKey: ['transactions', auth.token] })
      queryClient.invalidateQueries({ queryKey: ['summary', auth.token] })
      queryClient.invalidateQueries({ queryKey: ['monthly-history', auth.token] })
      queryClient.invalidateQueries({ queryKey: ['accounts', auth.token] })
      queryClient.invalidateQueries({ queryKey: ['net-worth', auth.token] })
    },
    onError: (error) => setNotice(error.message)
  })

  const transactions = transactionQuery.data?.data?.transactions ?? []
  const accounts = accountsQuery.data?.data?.accounts ?? []
  const accountNames = new Map(accounts.map((account) => [account.id, account.name]))
  const visibleTransactions = useMemo(() => {
    const query = search.trim().toLowerCase()
    return transactions
      .map((item) => ({ ...item, fromAccountName: accountNames.get(item.accountId), toAccountName: accountNames.get(item.transferAccountId) }))
      .filter((item) => !query || `${item.title} ${item.category} ${item.fromAccountName ?? ''} ${item.toAccountName ?? ''}`.toLowerCase().includes(query))
  }, [transactions, search, accounts])
  const summary = summaryQuery.data?.data
  const budgets = budgetsQuery.data?.data?.budgets ?? []
  const goals = goalsQuery.data?.data?.goals ?? []
  const debts = debtsQuery.data?.data?.debts ?? []
  const netWorth = netWorthQuery.data?.data
  const userName = auth.user?.name?.trim().replace(/\s+/g, ' ') || auth.user?.email?.split('@')[0] || 'there'
  const [firstName, ...lastNameParts] = userName.split(' ')
  const lastName = lastNameParts.join(' ')
  const greetingName = [firstName, lastName].filter(Boolean).join(' ')
  const avatar = auth.user?.profilePicture
  const currentPageTitle = navItems.find((item) => item.id === activePage)?.label ?? 'Overview'
  const categoriesForFilter = filterType === 'income' ? categories.income : filterType === 'expense' ? categories.expense : [...new Set([...categories.income, ...categories.expense])]
  const resourcePage = {
    accounts: 'account',
    budgets: 'budget',
    goals: 'goal',
    debts: 'debt'
  }[activePage]

  function invalidateFinanceData(message = 'Your transaction has been saved.') {
    queryClient.invalidateQueries({ queryKey: ['transactions', auth.token] })
    queryClient.invalidateQueries({ queryKey: ['summary', auth.token] })
    queryClient.invalidateQueries({ queryKey: ['monthly-history', auth.token] })
    queryClient.invalidateQueries({ queryKey: ['accounts', auth.token] })
    queryClient.invalidateQueries({ queryKey: ['net-worth', auth.token] })
    setShowForm(false)
    setEditing(null)
    setNotice(message)
  }

  function askDelete(transaction) {
    if (window.confirm(`Delete "${transaction.title}"? This cannot be undone.`)) {
      deleteMutation.mutate(transaction)
    }
  }

  function invalidateResourceData() {
    for (const key of ['accounts', 'budgets', 'goals', 'debts', 'net-worth', 'summary']) {
      queryClient.invalidateQueries({ queryKey: [key, auth.token] })
    }
    setResource(null)
    setNotice('Your changes have been saved.')
  }

  const resourceDeleteMutation = useMutation({
    mutationFn: ({ collection, id }) => apiRequest(`/${collection}/${id}`, { token: auth.token, method: 'DELETE' }),
    onSuccess: invalidateResourceData,
    onError: (error) => setNotice(error.message)
  })

  function deleteResource(collection, record) {
    const label = record.name ?? record.category
    if (window.confirm(`Delete "${label}"? This cannot be undone.`)) {
      resourceDeleteMutation.mutate({ collection, id: record.id })
    }
  }

  function importFinished(message) {
    invalidateFinanceData(message)
  }

  const dataError = summaryQuery.error || transactionQuery.error || historyQuery.error ||
    accountsQuery.error || budgetsQuery.error || goalsQuery.error || debtsQuery.error || netWorthQuery.error

  return (
    <div className="finance-shell">
      <aside className="sidebar">
        <a aria-label="Ledgerly home" className="sidebar-brand" href="/" onClick={(event) => { event.preventDefault(); setActivePage('overview') }}>
          <span className="brand-mark"><Icon name="chart" size={21} /></span><span>ledgerly</span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav aria-label="Main navigation" className="main-nav">
          {navItems.map((item) => (
            <button aria-current={activePage === item.id ? 'page' : undefined} className={activePage === item.id ? 'nav-item nav-active' : 'nav-item'} key={item.id} onClick={() => setActivePage(item.id)} type="button">
              <Icon name={item.icon} size={19} /><span>{item.label}</span>{item.id === 'transactions' && <Icon className="nav-chevron" name="chevron" size={16} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip"><span><Icon name="spark" size={16} /></span><strong>Small steps add up</strong><p>Every transaction you track brings you closer to your goals.</p></div>
          <div className="sidebar-user">
            {avatar ? <img alt="" className="avatar-image" src={avatar} /> : <span className="user-avatar">{firstName.slice(0, 1).toUpperCase()}</span>}
            <span className="user-details"><strong>{userName}</strong><small>{auth.user?.email}</small></span>
            <button aria-label="Sign out" className="icon-button signout-button" onClick={onSignOut} title="Sign out" type="button"><Icon name="logout" size={18} /></button>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><Icon name="chevron" size={14} /><strong>{currentPageTitle}</strong></div>
          <div className="topbar-actions"><span className="today-label">{new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(now)}</span><button aria-label="Notifications" className="icon-button notification-button" type="button"><Icon name="bell" size={19} /><i /></button><span className="topbar-divider" />{avatar ? <img alt="" className="avatar-image top-avatar" src={avatar} /> : <span className="user-avatar top-avatar">{firstName.slice(0, 1).toUpperCase()}</span>}</div>
        </header>

        <div className="page-content">
          {auth.token === DEMO_TOKEN && (
            <div className="demo-mode-banner"><Icon name="eye" size={16} /><span><strong>Demo account</strong> — sample data only; changes stay in this browser.</span></div>
          )}
          {notice && <div className={notice.includes('failed') || notice.includes('Error') ? 'notice notice-error' : 'notice'} role="status">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice('')} type="button"><Icon name="close" size={15} /></button></div>}
          {dataError && <div className="notice notice-error" role="alert">{dataError.message}. {auth.token === DEMO_TOKEN ? 'Try refreshing the page.' : 'Check that your backend is running and try refreshing the page.'}</div>}
          <section className="page-heading">
            <div><span className="eyebrow"><Icon name="spark" size={14} /> {monthLabel(now).toUpperCase()}</span><h1>{activePage === 'overview' ? `Good morning, ${greetingName}` : currentPageTitle}<span className="heading-period">.</span></h1><p>{activePage === 'overview' ? 'Here’s what’s happening with your money.' : activePage === 'transactions' ? 'Keep track of every dollar coming in and going out.' : activePage === 'accounts' ? 'See the balances of the accounts you track.' : activePage === 'budgets' ? 'Set spending limits and know before you go over.' : activePage === 'goals' ? 'A little progress, one goal at a time.' : activePage === 'debts' ? 'Make balances and repayments easier to follow.' : 'A thoughtful look at your spending patterns.'}</p></div>
            <button className="button button-primary add-button" onClick={() => {
              if (resourcePage) setResource({ type: resourcePage, record: null })
              else { setEditing(null); setShowForm(true) }
            }} type="button"><Icon name="plus" size={18} /> {resourcePage ? `Add ${resourcePage === 'goal' ? 'goal' : resourcePage}` : 'Add transaction'}</button>
          </section>

          <section aria-label="Financial summary" className="metrics-grid">
            <MetricCard icon="wallet" note="Available" sign="up" title="Total balance" tone="balance" value={summary ? formatMoney(summary.balance) : '—'} />
            <MetricCard icon="chart" note="Assets minus liabilities" sign="up" title="Net worth" tone="capital" value={netWorth ? formatMoney(netWorth.netWorth) : '—'} />
            <MetricCard icon="arrowDown" note="Money in" sign="up" title="Income" tone="income" value={summary ? formatMoney(summary.income) : '—'} />
            <MetricCard icon="arrowUp" note="Money out" sign="down" title="Expenses" tone="expense" value={summary ? formatMoney(summary.expense) : '—'} />
            <MetricCard icon="spark" note="This month" sign="up" title="Savings rate" tone="saving" value={summary && summary.income > 0 ? `${Math.round((summary.balance / summary.income) * 100)}%` : '—'} />
          </section>

          {activePage === 'overview' && (
            <section className="insights-grid">
              <article className="panel chart-panel">
                <div className="panel-heading"><div><h2>Cash flow</h2><p>Your income and expenses over time</p></div><span className="panel-period">Last 6 months</span></div>
                {historyQuery.isLoading ? <div className="loading-chart">Loading your cash flow...</div> : <SpendingChart history={historyQuery.data ?? []} />}
              </article>
              <article className="panel breakdown-panel">
                <div className="panel-heading"><div><h2>Spending breakdown</h2><p>Where your money goes</p></div><span className="panel-icon"><Icon name="more" size={20} /></span></div>
                {summaryQuery.isLoading ? <div className="loading-chart">Loading insights...</div> : <SpendingBreakdown categories={summary?.expensesByCategory} />}
                <button className="panel-link" onClick={() => setActivePage('reports')} type="button">View monthly report <Icon name="chevron" size={15} /></button>
              </article>
            </section>
          )}

          {activePage === 'reports' && (
            <section className="reports-grid">
              <article className="panel report-summary">
                <div className="panel-heading"><div><h2>{monthLabel(now)} report</h2><p>Your month at a glance</p></div><span className="panel-icon"><Icon name="chart" size={19} /></span></div>
                <div className="net-worth-report"><span>Net worth</span><strong>{netWorth ? formatMoney(netWorth.netWorth) : '—'}</strong><small>{netWorth ? `${formatMoney(netWorth.assets)} assets · ${formatMoney(netWorth.liabilities)} liabilities` : 'Add accounts and debts to calculate net worth'}</small></div>
                <div className="report-total"><span>Net cash flow</span><strong className={Number(summary?.balance) < 0 ? 'amount-negative' : 'amount-positive'}>{summary ? formatMoney(summary.balance) : '—'}</strong></div>
                <div className="report-line"><span>Income</span><strong className="amount-positive">{summary ? formatMoney(summary.income) : '—'}</strong></div>
                <div className="report-line"><span>Expenses</span><strong className="amount-negative">{summary ? formatMoney(summary.expense) : '—'}</strong></div>
                <div className="report-line"><span>Savings rate</span><strong>{summary && summary.income > 0 ? `${Math.round((summary.balance / summary.income) * 100)}%` : '—'}</strong></div>
                <div className="report-line"><span>Fixed costs</span><strong>{summary ? formatMoney(summary.expensesByType?.fixed) : '—'}</strong></div>
                <div className="report-line"><span>Variable expenses</span><strong>{summary ? formatMoney(summary.expensesByType?.variable) : '—'}</strong></div>
              </article>
              <article className="panel report-breakdown"><div className="panel-heading"><div><h2>Expenses by category</h2><p>Spending share this month</p></div></div><SpendingPie categories={summary?.expensesByCategory} /><SpendingBreakdown categories={summary?.expensesByCategory} /></article>
              <article className="panel report-chart"><div className="panel-heading"><div><h2>Six-month cash flow</h2><p>Compare your income and spending</p></div></div>{historyQuery.isLoading ? <div className="loading-chart">Loading your cash flow...</div> : <SpendingChart history={historyQuery.data ?? []} />}</article>
            </section>
          )}

          {activePage === 'accounts' && <AccountsPanel accounts={accounts} onAdd={() => setResource({ type: 'account', record: null })} onDelete={(account) => deleteResource('accounts', account)} onEdit={(account) => setResource({ type: 'account', record: account })} />}
          {activePage === 'budgets' && <BudgetsPanel budgets={budgets} onAdd={() => setResource({ type: 'budget', record: null })} onDelete={(budget) => deleteResource('budgets', budget)} onEdit={(budget) => setResource({ type: 'budget', record: budget })} />}
          {activePage === 'goals' && <GoalsPanel goals={goals} onAdd={() => setResource({ type: 'goal', record: null })} onDelete={(goal) => deleteResource('goals', goal)} onEdit={(goal) => setResource({ type: 'goal', record: goal })} />}
          {activePage === 'debts' && <DebtsPanel debts={debts} onAdd={() => setResource({ type: 'debt', record: null })} onDelete={(debt) => deleteResource('debts', debt)} onEdit={(debt) => setResource({ type: 'debt', record: debt })} />}

          {(activePage === 'overview' || activePage === 'transactions') && (
            <section className="panel transactions-panel">
              <div className="panel-heading transactions-heading"><div><h2>{activePage === 'overview' ? 'Recent transactions' : 'All transactions'}</h2><p>{activePage === 'overview' ? 'Your latest money moves' : `${visibleTransactions.length} transactions found`}</p></div>
                <div className="table-controls">
                  {activePage === 'transactions' && <label className="search-field"><Icon name="search" size={17} /><input aria-label="Search transactions" onChange={(event) => setSearch(event.target.value)} placeholder="Search..." value={search} /></label>}
                  {activePage === 'transactions' && <CsvImportButton onError={(error) => setNotice(error.message)} onImported={importFinished} token={auth.token} />}
                  <label className="select-filter"><Icon name="filter" size={15} /><select aria-label="Filter by transaction type" onChange={(event) => { setFilterType(event.target.value); setFilterCategory('all') }} value={filterType}><option value="all">All types</option><option value="income">Income</option><option value="expense">Expenses</option><option value="transfer">Transfers</option></select></label>
                  {activePage === 'transactions' && <label className="select-filter category-filter"><select aria-label="Filter by category" onChange={(event) => setFilterCategory(event.target.value)} value={filterCategory}><option value="all">All categories</option>{categoriesForFilter.map((category) => <option key={category}>{category}</option>)}</select></label>}
                  {activePage === 'overview' && <button className="panel-link" onClick={() => setActivePage('transactions')} type="button">See all <Icon name="chevron" size={15} /></button>}
                </div>
              </div>
              {transactionQuery.isLoading ? <div className="table-loading">Loading your transactions...</div> : <TransactionTable deletingId={deleteMutation.isPending ? deleteMutation.variables?._id : null} emptyText="Add your first transaction and your financial story starts here." onDelete={askDelete} onEdit={(transaction) => { setEditing(transaction); setShowForm(true) }} transactions={activePage === 'overview' ? visibleTransactions.slice(0, 5) : visibleTransactions} />}
            </section>
          )}
          <footer className="page-footer"><span>Made for a healthier relationship with money.</span><span>Ledgerly <i>·</i> Your finances, in focus</span></footer>
        </div>
      </main>
      {showForm && <TransactionForm accounts={accounts} key={editing?._id ?? 'new'} onClose={() => { setShowForm(false); setEditing(null) }} onSaved={invalidateFinanceData} token={auth.token} transaction={editing} />}
      {resource && <ResourceModal key={`${resource.type}-${resource.record?.id ?? 'new'}`} onClose={() => setResource(null)} onSaved={invalidateResourceData} record={resource.record} token={auth.token} type={resource.type} />}
    </div>
  )
}
