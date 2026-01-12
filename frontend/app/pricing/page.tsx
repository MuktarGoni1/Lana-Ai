import { Metadata } from "next";
import ClientPricingPage from './ClientPricingPage';

export const metadata: Metadata = {
  title: "Pricing | Lana AI",
  description: "Choose the perfect plan for your family's learning needs with Lana AI.",
};

export default function Page() {
  return <ClientPricingPage />;
}