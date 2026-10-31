"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RowActionsProps {
  /** Nome do registro, usado nos rótulos e na confirmação. */
  label: string;
  editHref: string;
  /** Para onde voltar depois de excluir. */
  listHref: string;
  viewHref?: string;
  /** Se informado, a exclusão é bloqueada e o motivo aparece no diálogo. */
  blockedReason?: string;
}

export function RowActions({ label, editHref, listHref, viewHref, blockedReason }: RowActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function confirmDelete() {
    // TODO: chamar Server Action de exclusão (respeitando RLS e as regras de integridade do banco).
    router.push(`${listHref}?status=deleted`);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label={`Ações para ${label}`}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {viewHref && (
            <DropdownMenuItem asChild>
              <Link href={viewHref}>
                <Eye className="mr-2 size-4" /> Abrir
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href={editHref}>
              <Pencil className="mr-2 size-4" /> Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 size-4" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {blockedReason ? "Não é possível excluir" : `Excluir “${label}”?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {blockedReason ?? "Essa ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{blockedReason ? "Entendi" : "Cancelar"}</AlertDialogCancel>
            {!blockedReason && (
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
