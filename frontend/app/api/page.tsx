import { Metadata } from "next";
import ClientApiPage from './ClientApiPage';

export const metadata: Metadata = {
  title: "API Access | Lana AI",
  description: "Access Lana AI's powerful educational APIs for developers and integrations.",
};

export default function Page() {
  return <ClientApiPage />;
}