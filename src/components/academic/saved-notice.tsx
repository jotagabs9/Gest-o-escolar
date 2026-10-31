import { CheckCircle2 } from "lucide-react";

const MESSAGES: Record<string, string> = {
  created: "Registro criado.",
  saved: "Alterações salvas.",
  deleted: "Registro excluído.",
};

/** Lê `?status=` da URL. Enquanto os dados forem mock, avisa que nada foi persistido. */
export function SavedNotice({ status }: { status?: string }) {
  const message = status ? MESSAGES[status] : undefined;
  if (!message) return null;
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
    >
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      <p>
        {message} <span className="opacity-80">Simulação: os dados ainda são mockados, então a lista não muda.</span>
      </p>
    </div>
  );
}
