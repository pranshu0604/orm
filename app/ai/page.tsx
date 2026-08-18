import { redirect } from 'next/navigation';

// This page used to be a static "how to run the AI microservice" placeholder.
// Reports and suggestions now have a real UI at /.
export default function AiPage() {
  redirect('/');
}
