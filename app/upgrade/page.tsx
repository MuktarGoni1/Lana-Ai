import { redirect } from 'next/navigation';

export default function UpgradePage() {
  // Redirect to the pricing page
  redirect('/pricing');
}