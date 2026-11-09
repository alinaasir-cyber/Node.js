import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiRequest, formatMoney, localDateInput } from './api.js'
import { Icon } from './Icons.jsx'

const resourceConfig = {
  account: {
    title: 'Account',
    collection: 'accounts',
    fields: ['name', 'accountType', 'institution', 'openingBalance', 'creditLimit']
  },
  budget: {
    title: 'Monthly budget',
    collection: 'budgets',
    fields: ['category', 'monthlyLimit', 'month', 'year']
  },
  goal: {
    title: 'Savings goal',
    collection: 'goals',
    fields: ['name', 'targetAmount', 'savedAmount', 'targetDate']
  },
  debt: {
    title: 'Debt',
    collection: 'debts',
    fields: ['name', 'debtType', 'balance', 'creditLimit', 'minimumPayment', 'dueDate']
  }
}

function getInitialValue(record, field) {
  if (!record) {
    if (field === 'month') return new Date().getMonth() + 1
    if (field === 'year') return new Date().getFullYear()
    if (field === 'accountType') return 'checking'
    if (field === 'debtType') return 'credit_card'
    if (field === 'category') return 'Food'
    if (field === 'openingBalance' || field === 'savedAmount' || field === 'minimumPayment') return 0
    return ''
  }
  const values = {
    account: {
      name: record.name,
      accountType: record.accountType,
      institution: record.institution,
      openingBalance: record.openingBalance,
      creditLimit: record.creditLimit
    },
    budget: {
      category: record.category,
      monthlyLimit: record.monthlyLimit,
      month: record.month,
      year: record.year
    },
    goal: {
      name: record.name,
      targetAmount: record.targetAmount,
      savedAmount: record.savedAmount,
      targetDate: record.targetDate ? localDateInput(new Date(record.targetDate)) : ''
    },
    debt: {
      name: record.name,
      debtType: record.debtType,
      balance: record.balance,
      creditLimit: record.creditLimit,
      minimumPayment: record.minimumPayment,
      dueDate: record.dueDate ? localDateInput(new Date(record.dueDate)) : ''
    }
  }
  return values[record.resourceType]?.[field] ?? record[field] ?? ''
}

function ResourceField({ type, name, record }) {
  const value = getInitialValue(record, name)
  const common = { name, required: !['institution', 'creditLimit', 'targetDate', 'dueDate'].includes(name) }
  const numeric = (min = 0, step = '0.01') => (
    <input {...common} defaultValue={value} min={min} step={step} type="number" />
  )

  if (name === 'accountType' || name === 'debtType') {
    const options = name === 'accountType'
      ? [['checking', 'Checking'], ['savings', 'Savings'], ['cash', 'Cash'], ['investment', 'Investment'], ['credit_card', 'Credit card'], ['loan', 'Loan']]
      : [['credit_card', 'Credit card'], ['loan', 'Loan'], ['other', 'Other']]
    return <label>{name === 'accountType' ? 'Account type' : 'Debt type'}<select {...common} defaultValue={value}>{options.map(([option, label]) => <option key={option} value={option}>{label}</option>)}</select></label>
  }
  if (name === 'category') {
    return <label>Category<select {...common} defaultValue={value}>{['Food', 'Transport', 'Housing', 'Utilities', 'Health', 'Education', 'Shopping', 'Entertainment', 'Other'].map((category) => <option key={category}>{category}</option>)}</select></label>
  }
  if (name === 'month') {
    return <label>Month<select {...common} defaultValue={value}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(2026, index, 1))}</option>)}</select></label>
  }
  if (name === 'year') return <label>Year{numeric(2000, '1')}</label>
  if (name === 'openingBalance') return <label>Opening balance{numeric(undefined)}</label>
  if (name === 'monthlyLimit' || name === 'targetAmount' || name === 'creditLimit') {
    return <label>{name === 'monthlyLimit' ? 'Monthly spending limit' : name === 'targetAmount' ? 'Target amount' : 'Credit limit'}{numeric(name === 'creditLimit' ? '0.01' : '0.01')}</label>
  }
  if (name === 'savedAmount' || name === 'balance' || name === 'minimumPayment') {
    return <label>{name === 'savedAmount' ? 'Already saved' : name === 'balance' ? 'Current balance' : 'Minimum monthly payment'}{numeric()}</label>
  }
  if (name === 'targetDate' || name === 'dueDate') {
    return <label>{name === 'targetDate' ? 'Target date (optional)' : 'Payment due date (optional)'}<input {...common} defaultValue={value} type="date" /></label>
  }
  return <label>{name === 'institution' ? 'Bank or institution (optional)' : 'Name'}<input {...common} defaultValue={value} maxLength={80} placeholder={name === 'institution' ? 'e.g. Local Bank' : 'Give it a name'} /></label>
}

export function ResourceModal({ type, record, token, onClose, onSaved }) {
  const config = resourceConfig[type]
  const [error, setError] = useState('')
  const mutation = useMutation({
    mutationFn: (body) => {
      const path = type === 'budget'
        ? `/${config.collection}`
        : `/${config.collection}${record ? `/${record.id}` : ''}`
      return apiRequest(path, {
        token,
        method: type === 'budget' ? 'PUT' : record ? 'PUT' : 'POST',
        body: JSON.stringify(body)
      })
    },
    onSuccess: onSaved,
    onError: (requestError) => setError(requestError.message)
  })

  function submit(event) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))
    for (const key of ['openingBalance', 'creditLimit', 'monthlyLimit', 'month', 'year', 'targetAmount', 'savedAmount', 'balance', 'minimumPayment']) {
      if (data[key] === '') delete data[key]
      else if (data[key] !== undefined) data[key] = Number(data[key])
    }
    for (const key of ['targetDate', 'dueDate']) {
      if (data[key]) data[key] = new Date(`${data[key]}T12:00:00`).toISOString()
      else if (key in data) delete data[key]
    }
    mutation.mutate(data)
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section aria-labelledby="resource-modal-title" aria-modal="true" className="transaction-modal" role="dialog">
        <div className="modal-heading"><div><span className="eyebrow">PERSONAL FINANCE</span><h2 id="resource-modal-title">{record ? `Edit ${config.title.toLowerCase()}` : `Add ${config.title.toLowerCase()}`}</h2></div><button aria-label="Close dialog" className="icon-button" onClick={onClose} type="button"><Icon name="close" /></button></div>
        <form className="transaction-form" onSubmit={submit}>
          <div className="resource-fields">
            {config.fields.map((field) => <ResourceField key={field} name={field} record={record ? { ...record, resourceType: type } : null} type={type} />)}
          </div>
          {type === 'debt' && <p className="resource-hint">Only record each debt once in net-worth calculations.</p>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions"><button className="button button-quiet" onClick={onClose} type="button">Cancel</button><button className="button button-primary" disabled={mutation.isPending} type="submit">{mutation.isPending ? 'Saving...' : record ? 'Save changes' : 'Save'}</button></div>
        </form>
      </section>
    </div>
  )
}

export function AccountsPanel({ accounts, onAdd, onEdit, onDelete }) {
  const types = { checking: 'Checking', savings: 'Savings', cash: 'Cash', investment: 'Investment', credit_card: 'Credit card', loan: 'Loan' }
  return (
    <section className="panel module-panel">
      <div className="panel-heading module-heading"><div><h2>Your accounts</h2><p>Manually track cash, bank, savings, credit and investment accounts.</p></div><button className="button button-primary" onClick={onAdd} type="button"><Icon name="plus" size={16} /> Add account</button></div>
      {accounts.length ? <div className="account-grid">{accounts.map((account) => (
        <article className="account-card" key={account.id}>
          <div className="account-card-top"><span className={`account-type-icon account-${account.accountType}`}><Icon name={['credit_card', 'loan'].includes(account.accountType) ? 'card' : account.accountType === 'investment' ? 'chart' : 'wallet'} size={18} /></span><div className="account-actions"><button className="text-action" onClick={() => onEdit(account)} type="button">Edit</button><button aria-label={`Delete ${account.name}`} className="text-action text-danger" onClick={() => onDelete(account)} type="button">Delete</button></div></div>
          <span className="account-type-label">{types[account.accountType]}{account.institution ? ` · ${account.institution}` : ''}</span>
          <strong className={account.isLiability ? 'amount-negative' : ''}>{formatMoney(account.balance)}</strong>
          <span className="account-name">{account.name}{account.isLiability ? ' · Balance owed' : ''}</span>
          {account.creditLimit != null && <span className="account-credit">Credit limit {formatMoney(account.creditLimit)}</span>}
        </article>
      ))}</div> : <div className="empty-state"><span className="empty-icon"><Icon name="wallet" size={22} /></span><strong>No accounts yet</strong><p>Add an account to see balances and calculate your net worth.</p></div>}
    </section>
  )
}

export function BudgetsPanel({ budgets, onAdd, onEdit, onDelete }) {
  return (
    <section className="panel module-panel">
      <div className="panel-heading module-heading"><div><h2>Monthly budgets</h2><p>Set category limits and keep an eye on spending.</p></div><button className="button button-primary" onClick={onAdd} type="button"><Icon name="plus" size={16} /> Set a budget</button></div>
      {budgets.length ? <div className="budget-list">{budgets.map((budget) => {
        const over = budget.spent > budget.monthlyLimit
        const percent = Math.min(budget.percentUsed, 100)
        return <article className="budget-item" key={budget.id}>
          <div className="budget-top"><div><strong>{budget.category}</strong><span>{formatMoney(budget.spent)} of {formatMoney(budget.monthlyLimit)}</span></div><div className="budget-actions">{over && <span className="over-budget">Over budget</span>}<button aria-label={`Edit ${budget.category} budget`} className="text-action" onClick={() => onEdit(budget)} type="button">Edit</button><button aria-label={`Delete ${budget.category} budget`} className="text-action text-danger" onClick={() => onDelete(budget)} type="button">Delete</button></div></div>
          <div className={`budget-progress ${over ? 'budget-over' : ''}`}><span style={{ width: `${percent}%` }} /></div>
          <div className="budget-bottom"><span>{budget.percentUsed}% used</span><span>{formatMoney(Math.max(budget.remaining, 0))} remaining</span></div>
        </article>
      })}</div> : <div className="empty-state"><span className="empty-icon"><Icon name="chart" size={22} /></span><strong>No budgets for this month</strong><p>Create a category limit to get helpful over-spending alerts.</p></div>}
    </section>
  )
}

export function GoalsPanel({ goals, onAdd, onEdit, onDelete }) {
  return (
    <section className="panel module-panel">
      <div className="panel-heading module-heading"><div><h2>Savings goals</h2><p>Put a little aside for the things that matter to you.</p></div><button className="button button-primary" onClick={onAdd} type="button"><Icon name="plus" size={16} /> Create a goal</button></div>
      {goals.length ? <div className="goal-grid">{goals.map((goal) => (
        <article className="goal-card" key={goal.id}>
          <div className="goal-card-top"><span className="goal-icon"><Icon name="spark" size={18} /></span><div className="account-actions"><button className="text-action" onClick={() => onEdit(goal)} type="button">Update</button><button aria-label={`Delete ${goal.name}`} className="text-action text-danger" onClick={() => onDelete(goal)} type="button">Delete</button></div></div>
          <strong>{goal.name}</strong>
          <div className="goal-progress-copy"><span>{formatMoney(goal.savedAmount)} saved</span><span>{goal.progress}%</span></div>
          <div className="budget-progress"><span style={{ width: `${goal.progress}%` }} /></div>
          <div className="goal-bottom"><span>of {formatMoney(goal.targetAmount)}</span><span>{goal.targetDate ? `By ${new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(goal.targetDate))}` : `${formatMoney(goal.remaining)} to go`}</span></div>
        </article>
      ))}</div> : <div className="empty-state"><span className="empty-icon"><Icon name="spark" size={22} /></span><strong>No savings goals yet</strong><p>Create a goal and track your progress as you save.</p></div>}
    </section>
  )
}

export function DebtsPanel({ debts, onAdd, onEdit, onDelete }) {
  const total = debts.reduce((sum, debt) => sum + debt.balance, 0)
  return (
    <section className="panel module-panel">
      <div className="panel-heading module-heading"><div><h2>Debt & credit</h2><p>Keep balances, utilization and upcoming repayments in view.</p></div><button className="button button-primary" onClick={onAdd} type="button"><Icon name="plus" size={16} /> Add debt</button></div>
      {debts.length ? <>
        <div className="debt-total"><span>Total tracked debt</span><strong>{formatMoney(total)}</strong><small>Credit card utilization is calculated against each card’s limit.</small></div>
        <div className="debt-list">{debts.map((debt) => (
          <article className="debt-row" key={debt.id}>
            <span className="debt-icon"><Icon name={debt.debtType === 'credit_card' ? 'card' : 'wallet'} size={18} /></span>
            <div className="debt-main"><strong>{debt.name}</strong><span>{debt.debtType === 'credit_card' ? 'Credit card' : debt.debtType === 'loan' ? 'Loan' : 'Other debt'}{debt.dueDate ? ` · Due ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(debt.dueDate))}` : ''}</span>{debt.utilization != null && <div className="debt-utilization"><span style={{ width: `${Math.min(debt.utilization, 100)}%` }} /></div>}</div>
            <div className="debt-amount"><strong>{formatMoney(debt.balance)}</strong>{debt.creditLimit != null && <small>{debt.utilization}% of {formatMoney(debt.creditLimit)}</small>}{debt.minimumPayment > 0 && <small>Min. {formatMoney(debt.minimumPayment)}/mo</small>}</div>
            <div className="account-actions"><button className="text-action" onClick={() => onEdit(debt)} type="button">Update</button><button aria-label={`Delete ${debt.name}`} className="text-action text-danger" onClick={() => onDelete(debt)} type="button">Delete</button></div>
          </article>
        ))}</div>
      </> : <div className="empty-state"><span className="empty-icon"><Icon name="card" size={22} /></span><strong>No debts tracked</strong><p>Add a credit card or loan to include liabilities in your net worth.</p></div>}
    </section>
  )
}

export function CsvImportButton({ token, onImported, onError }) {
  const mutation = useMutation({
    mutationFn: (csv) => apiRequest('/transactions/import', { token, method: 'POST', body: JSON.stringify({ csv }) }),
    onSuccess: (result) => onImported(result.message),
    onError
  })
  return (
    <label className="button button-quiet csv-import-button">
      <Icon name="plus" size={15} /> Import CSV
      <input accept=".csv,text/csv" className="visually-hidden" disabled={mutation.isPending} onChange={(event) => {
        const file = event.target.files?.[0]
        event.target.value = ''
        if (!file) return
        if (file.size > 1_000_000) {
          onError(new Error('CSV must be smaller than 1 MB.'))
          return
        }
        file.text().then((csv) => mutation.mutate(csv)).catch(onError)
      }} type="file" />
    </label>
  )
}
