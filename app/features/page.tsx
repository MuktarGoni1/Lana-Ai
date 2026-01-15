import { Metadata } from "next";
import ClientFeaturesPage from './ClientFeaturesPage';

export const metadata: Metadata = {
  title: "Features | Lana AI",
  description: "Discover the powerful features of Lana AI that personalize learning for every student.",
};

export default function Page() {
  return <ClientFeaturesPage />;
}