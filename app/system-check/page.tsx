import type { Metadata } from "next";
import SystemCheckClient from "@/components/SystemCheckClient";

export const metadata: Metadata = {
  title: "운영 연결 상태",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SystemCheckPage() {
  return <SystemCheckClient />;
}
