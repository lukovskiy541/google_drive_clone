'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext.js';

export default function LoginForm() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
    } catch (err) {
      setError(err.message || 'Не вийшло авторизуватись');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <label>
        Логін
        <input
          name="username"
          autoComplete="username"
          value={form.username}
          onChange={handleChange}
          placeholder="student"
          required
        />
      </label>
      <label>
        Пароль
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={handleChange}
          required
        />
      </label>
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" className="btn auth-form__submit" disabled={loading}>
        {loading ? 'Зачекайте...' : 'Увійти'}
      </button>
    </form>
  );
}
