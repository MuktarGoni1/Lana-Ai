import { Metadata } from "next";
import ClientCareersPage from "./ClientCareersPage";

export const metadata: Metadata = {
  title: "Careers | Lana AI",
  description: "Join our team at Lana AI and help revolutionize education through personalized AI tutoring for children worldwide.",
};

export default function Page() {
  return <ClientCareersPage />;
}