import { ApplicationShell } from "@/components/application-shell";
import { CookieConsentBanner } from "@/components/ui/cookie-consent-banner";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ApplicationShell>{children}</ApplicationShell>
      <CookieConsentBanner />
    </>
  );
}
