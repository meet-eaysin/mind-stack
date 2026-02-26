import { ApplicationShell } from "@/components/application-shell"

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ApplicationShell>{children}</ApplicationShell>
}
