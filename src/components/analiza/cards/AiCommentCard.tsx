// Karta z komentarzem AI
interface AiCommentCardProps {
  comment: string | null | undefined;
  section: string;
  loading?: boolean;
}

export default function AiCommentCard({ comment, section, loading }: AiCommentCardProps) {
  if (loading) {
    return (
      <div
        className="rounded-xl p-4 mt-4"
        style={{ background: "#0d1a0d", border: "1px solid rgba(74,222,128,0.2)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs" style={{ color: "rgba(74,222,128,0.7)" }}>
            Generowanie analizy AI...
          </span>
        </div>
      </div>
    );
  }

  if (!comment) return null;

  return (
    <div
      className="rounded-xl p-4 mt-4"
      style={{ background: "#0d1a0d", border: "1px solid rgba(74,222,128,0.2)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(74,222,128,0.7)" }}>
          Analiza AI
        </span>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
        {comment}
      </p>
    </div>
  );
}
