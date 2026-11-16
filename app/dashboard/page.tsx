import { redirect } from 'next/navigation';

// Dashboard content now lives at / for signed-in users — this route is kept only
// so old links/bookmarks don't 404.
export default function DashboardRedirect() {
  redirect('/');
}
