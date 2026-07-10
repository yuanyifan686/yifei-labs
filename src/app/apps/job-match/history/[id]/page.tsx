import { HistorySessionDetailClient } from "@/components/job-match/HistorySessionDetailClient";

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <HistorySessionDetailClient sessionId={id} />;
}
