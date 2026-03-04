import { Metadata } from "next";
import ClientContactPage from "./ClientContactPage";

export const metadata: Metadata = {
  title: "Contact Us | Lana AI",
  description: "Get in touch with the Lana AI team for support, partnerships, or general inquiries about our personalized AI tutoring platform.",
};

export default function Page() {
  return <ClientContactPage />;
}