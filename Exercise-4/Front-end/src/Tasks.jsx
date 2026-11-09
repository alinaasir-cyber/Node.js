import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import './Tasks.css'

const tasksQueryKey = ['tasks']

async function requestTasks(path, options) {
  const response = await fetch(`/backend/api/tasks${path}`, options)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || `Request failed with status ${response.status}`)
  }

  return result
}

async function createTask(title) {
  return requestTasks('', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  })
}

async function updateTask({ id, ...changes }) {
  return requestTasks(`/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes)
  })
}

async function deleteTask(id) {
  return requestTasks(`/${id}`, { method: 'DELETE' })
}

function Tasks() {
  const [title, setTitle] = useState('')
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: tasksQueryKey,
    queryFn: () => requestTasks('', { method: 'GET' })
  })

  const refreshTasks = () => queryClient.invalidateQueries({ queryKey: tasksQueryKey })
  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      setTitle('')
      return refreshTasks()
    }
  })
  const updateMutation = useMutation({ mutationFn: updateTask, onSuccess: refreshTasks })
  const deleteMutation = useMutation({ mutationFn: deleteTask, onSuccess: refreshTasks })

  function handleSubmit(event) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (trimmedTitle) createMutation.mutate(trimmedTitle)
  }

  const tasks = data?.data?.tasks ?? []
  const mutationError = createMutation.error || updateMutation.error || deleteMutation.error

  return (
    <main className="tasks-page">
      <section className="tasks-card">
        <h1>My Tasks</h1>
        <form className="tasks-form" onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="task-title">New task</label>
          <input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs to be done?"
            maxLength={120}
            required
          />
          <button type="submit" disabled={createMutation.isPending || !title.trim()}>
            {createMutation.isPending ? 'Adding...' : 'Add task'}
          </button>
        </form>

        {isLoading && <p>Loading tasks...</p>}
        {error && <p className="tasks-error" role="alert">{error.message}</p>}
        {mutationError && <p className="tasks-error" role="alert">{mutationError.message}</p>}

        {!isLoading && !error && (
          tasks.length ? (
            <ul className="tasks-list">
              {tasks.map((task) => (
                <li className="task-row" key={task._id}>
                  <label className={task.completed ? 'task-title task-completed' : 'task-title'}>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      disabled={updateMutation.isPending}
                      onChange={(event) => updateMutation.mutate({
                        id: task._id,
                        completed: event.target.checked
                      })}
                    />
                    <span>{task.title}</span>
                  </label>
                  <button
                    className="task-delete"
                    type="button"
                    onClick={() => deleteMutation.mutate(task._id)}
                    disabled={deleteMutation.isPending}
                    aria-label={`Delete ${task.title}`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="tasks-empty">No tasks yet. Add one above.</p>
          )
        )}
      </section>
    </main>
  )
}

export default Tasks