import { Metadata } from "next";
import ClientPrivacyPage from "./ClientPrivacyPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Lana AI",
  description: "Read Lana AI's privacy policy to understand how we collect, use, and protect your personal information.",
};

export default function Page() {
  return <ClientPrivacyPage />;
}
