import { Metadata } from "next";
import ClientPrivacyPage from "./ClientPrivacyPage";

export const metadata: Metadata = {
  title: "Privacy Policy | LanaMind",
  description: "Read LanaMind's privacy policy to understand how we collect, use, and protect your personal information.",
};

export default function Page() {
  return <ClientPrivacyPage />;
}
