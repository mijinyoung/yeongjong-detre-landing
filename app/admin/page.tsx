import type { Metadata } from "next";
import AdminDashboardClient from "@/components/AdminDashboardClient";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "관심고객 관리자",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminDashboardClient siteUrl={getSiteUrl()} />;
}
