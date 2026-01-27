import { Metadata } from "next";
import ClientAboutPage from "./ClientAboutPage";

export const metadata: Metadata = {
  title: "About Us | Lana AI",
  description: "Learn about Lana AI's mission to revolutionize education through personalized AI tutoring for every child.",
};

export default function Page() {
  return <ClientAboutPage />;
}