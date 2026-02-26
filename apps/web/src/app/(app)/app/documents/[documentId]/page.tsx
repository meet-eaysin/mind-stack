import { DocumentDetailPage } from "@/features/documents/components/document-detail-page";

type DocumentDetailRouteProps = {
  params: Promise<{
    documentId: string;
  }>;
};

export default async function DocumentDetailRoute({
  params,
}: DocumentDetailRouteProps) {
  const { documentId } = await params;
  return <DocumentDetailPage documentId={documentId} />;
}
