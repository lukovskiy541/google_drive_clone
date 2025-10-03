'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext.js';

export default function RegisterForm() {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', password: '', displayName: '' });
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
      await register(form);
    } catch (err) {
      setError(err.message || 'Реєстрація не вдалася');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <label>
        Нікнейм
        <input
          name="displayName"
          value={form.displayName}
          onChange={handleChange}
          placeholder="Студент Петро"
          required
        />
      </label>
      <label>
        Логін
        <input
          name="username"
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
          value={form.password}
          onChange={handleChange}
          required
        />
      </label>
      {error && <p className="auth-error">{error}</p>}
      <button type="submit" className="btn auth-form__submit" disabled={loading}>
        {loading ? 'Зачекайте...' : 'Зареєструватися'}
      </button>
    </form>
  );
}
