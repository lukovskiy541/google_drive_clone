import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth.js';

export default async function Home() {
  const user = await getCurrentUser();
  if (user) {
    redirect('/dashboard');
  }
  redirect('/login');
}
