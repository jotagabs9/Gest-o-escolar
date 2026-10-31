"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Simula o salvamento e volta para a listagem com `?status=created|saved`.
 * TODO: trocar por Server Action (validação com Zod + Prisma, escola vinda da sessão).
 */
export function useMockSubmit(listHref: string) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function submit(mode: "created" | "saved") {
    start(async () => {
      await new Promise((r) => setTimeout(r, 600));
      router.push(`${listHref}?status=${mode}`);
      router.refresh();
    });
  }

  return { pending, submit };
}
