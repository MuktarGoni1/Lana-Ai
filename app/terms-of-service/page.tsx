import { Metadata } from "next";
import ClientTermsPage from "./ClientTermsPage";

export const metadata: Metadata = {
  title: "Terms of Service | Lana AI",
  description: "Read Lana AI's terms of service to understand the rules and guidelines for using our personalized AI tutoring platform.",
};

export default function Page() {
  return <ClientTermsPage />;
}
