import { Metadata } from "next";
import ClientSecurityPage from "./ClientSecurityPage";

export const metadata: Metadata = {
  title: "Security Policy | Lana AI",
  description: "Learn how Lana AI protects your data and keeps your account secure with our comprehensive security policy.",
};

export default function Page() {
  return <ClientSecurityPage />;
}
