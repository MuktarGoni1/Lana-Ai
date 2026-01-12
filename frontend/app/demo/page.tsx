import { Metadata } from "next";
import ClientDemoPage from './ClientDemoPage';

export const metadata: Metadata = {
  title: "Request a Demo | Lana AI",
  description: "Experience the power of Lana AI with a personalized demo.",
};

export default function Page() {
  return <ClientDemoPage />;
}