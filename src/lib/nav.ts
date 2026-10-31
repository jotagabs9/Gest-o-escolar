import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Library,
  ListOrdered,
  School,
  ScrollText,
  UserCog,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/types/auth";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}
export interface NavGroup {
  label?: string;
  items: NavItem[];
}

/** Navegação por papel. Só módulos: nenhuma matéria/curso fica fixa no menu. */
export const NAV_BY_ROLE: Record<Role, NavGroup[]> = {
  SCHOOL_ADMIN: [
    { items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }] },
    {
      label: "Estrutura acadêmica",
      items: [
        { label: "Anos letivos", href: "/admin/estrutura/anos-letivos", icon: CalendarDays },
        { label: "Modalidades", href: "/admin/estrutura/modalidades", icon: Layers },
        { label: "Séries e etapas", href: "/admin/estrutura/series", icon: ListOrdered },
        { label: "Turmas", href: "/admin/estrutura/turmas", icon: School },
        { label: "Matrizes curriculares", href: "/admin/estrutura/matrizes", icon: Library },
      ],
    },
    {
      label: "Pessoas",
      items: [
        { label: "Alunos", href: "/admin/alunos", icon: GraduationCap },
        { label: "Professores", href: "/admin/professores", icon: UserCog },
        { label: "Responsáveis", href: "/admin/responsaveis", icon: UsersRound },
      ],
    },
    {
      label: "Secretaria",
      items: [
        { label: "Matrículas", href: "/admin/matriculas", icon: FileText },
        { label: "Notas e frequência", href: "/admin/avaliacao", icon: BarChart3 },
        { label: "Boletins", href: "/admin/boletins", icon: ScrollText },
      ],
    },
  ],
  TEACHER: [
    { items: [{ label: "Dashboard", href: "/professor", icon: LayoutDashboard }] },
    {
      label: "Diário de classe",
      items: [
        { label: "Minhas turmas", href: "/professor/turmas", icon: Users },
        { label: "Notas", href: "/professor/notas", icon: BookOpenCheck },
        { label: "Frequência", href: "/professor/frequencia", icon: ClipboardCheck },
      ],
    },
  ],
  STUDENT_GUARDIAN: [
    { items: [{ label: "Início", href: "/aluno", icon: LayoutDashboard }] },
    {
      label: "Acompanhamento",
      items: [{ label: "Boletim", href: "/aluno/boletim", icon: FileText }],
    },
  ],
};

/** Itens de dashboard só ficam ativos com match exato. */
export const HOME_PATHS = ["/admin", "/professor", "/aluno"];
