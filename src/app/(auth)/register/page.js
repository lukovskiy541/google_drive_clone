import Link from 'next/link';
import RegisterForm from '@/components/auth/RegisterForm.js';
import AuthShell from '@/components/auth/AuthShell.js';
import '@/styles/auth.css';

export default function RegisterPage() {
  return (
    <AuthShell
      heading="Реєстрація"
      footer={
        <p className="auth-switch">
          Вже маєш акаунт? <Link href="/login">Увійти</Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
