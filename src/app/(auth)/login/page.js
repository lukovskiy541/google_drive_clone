import Link from 'next/link';
import LoginForm from '@/components/auth/LoginForm.js';
import AuthShell from '@/components/auth/AuthShell.js';
import '@/styles/auth.css';

export default function LoginPage() {
  return (
    <AuthShell
      heading="Вхід"
      footer={
        <p className="auth-switch">
          Ще немає акаунта? <Link href="/register">Зареєструватися</Link>
        </p>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
