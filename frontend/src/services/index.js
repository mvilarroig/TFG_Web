import api from './api'

export const movementService = {
  getAll:  (params)     => api.get('/movements', { params }).then(r => r.data),
  getById: (id)         => api.get(`/movements/${id}`).then(r => r.data),
  create:  (data)       => api.post('/movements', data).then(r => r.data),
  update:  (id, data)   => api.put(`/movements/${id}`, data).then(r => r.data),
  delete:  (id)         => api.delete(`/movements/${id}`).then(r => r.data),
  import:  (movements)  => api.post('/movements/import', { movements }).then(r => r.data),
}

export const categoryService = {
  getAll:  ()           => api.get('/categories').then(r => r.data),
  create:  (data)       => api.post('/categories', data).then(r => r.data),
  update:  (id, data)   => api.put(`/categories/${id}`, data).then(r => r.data),
  delete:  (id)         => api.delete(`/categories/${id}`).then(r => r.data),
}

export const summaryService = {
  monthly: (year, month) => api.get('/summary/monthly', { params: { year, month } }).then(r => r.data),
  yearly:  (year)        => api.get('/summary/yearly',  { params: { year } }).then(r => r.data),
}

export const fixedExpenseService = {
  getAll:  ()           => api.get('/fixed-expenses').then(r => r.data),
  create:  (data)       => api.post('/fixed-expenses', data).then(r => r.data),
  update:  (id, data)   => api.put(`/fixed-expenses/${id}`, data).then(r => r.data),
  delete:  (id)         => api.delete(`/fixed-expenses/${id}`).then(r => r.data),
}

export const authService = {
  forgotPassword: (email)            => api.post('/auth/forgot-password', { email }).then(r => r.data),
  resetPassword:  (token, password)  => api.post('/auth/reset-password',  { token, password }).then(r => r.data),
}

export const savingsGoalService = {
  getAll:   ()            => api.get('/savings-goals').then(r => r.data),
  create:   (data)        => api.post('/savings-goals', data).then(r => r.data),
  update:   (id, data)    => api.put(`/savings-goals/${id}`, data).then(r => r.data),
  deposit:  (id, amount)  => api.patch(`/savings-goals/${id}/deposit`, { amount }).then(r => r.data),
  delete:   (id)          => api.delete(`/savings-goals/${id}`).then(r => r.data),
}

export const userService = {
  updateProfile:  (data) => api.put('/users/profile', data).then(r => r.data),
  changePassword: (data) => api.put('/users/password', data).then(r => r.data),
  deleteAccount:  ()     => api.delete('/users').then(r => r.data),
}