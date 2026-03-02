import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upgrade | Lana AI",
  description: "Upgrade your plan to access premium features with Lana AI.",
};

export default function UpgradeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      {children}
    </div>
  );
}