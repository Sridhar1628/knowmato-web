"use client";

import CompanyShell from "@/components/company/CompanyShell";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CompanyShell>{children}</CompanyShell>;
}