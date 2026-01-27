import { Metadata } from "next";
import ClientBlogPage from "./ClientBlogPage";

export const metadata: Metadata = {
  title: "Blog | Lana AI",
  description: "Read the latest articles, insights, and tips on personalized learning and AI-powered education from Lana AI.",
};

export default function Page() {
  return <ClientBlogPage />;
}