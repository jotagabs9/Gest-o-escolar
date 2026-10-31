import { StatusBadge } from "@/components/academic/status-badge";
import {
  ENROLLMENT_ROLE_OPTIONS,
  ENROLLMENT_STATUS_OPTIONS,
  LINK_STATUS_OPTIONS,
  PERSON_STATUS_OPTIONS,
  type EnrollmentStatus,
  type LinkStatus,
  type PersonStatus,
} from "@/lib/mock/people";
import { optionLabel } from "@/lib/mock/academic";

type Tone = "success" | "warning" | "info" | "neutral" | "danger";

const ENROLLMENT_TONE: Record<EnrollmentStatus, Tone> = {
  ACTIVE: "success",
  PENDING: "warning",
  TRANSFERRED: "info",
  CANCELLED: "danger",
  COMPLETED: "neutral",
};

const LINK_TONE: Record<LinkStatus, Tone> = {
  ACTIVE: "success",
  PENDING: "warning",
  COMPLETED: "neutral",
  DROPPED: "danger",
  TRANSFERRED: "info",
};

export function EnrollmentStatusBadge({ status }: { status: EnrollmentStatus }) {
  return <StatusBadge tone={ENROLLMENT_TONE[status]}>{optionLabel(ENROLLMENT_STATUS_OPTIONS, status)}</StatusBadge>;
}

export function LinkStatusBadge({ status }: { status: LinkStatus }) {
  return <StatusBadge tone={LINK_TONE[status]}>{optionLabel(LINK_STATUS_OPTIONS, status)}</StatusBadge>;
}

export function RoleBadge({ role }: { role: string }) {
  return <StatusBadge tone="neutral">{optionLabel(ENROLLMENT_ROLE_OPTIONS, role)}</StatusBadge>;
}

export function PersonStatusBadge({ status }: { status: PersonStatus }) {
  return (
    <StatusBadge tone={status === "ACTIVE" ? "success" : "neutral"}>
      {optionLabel(PERSON_STATUS_OPTIONS, status)}
    </StatusBadge>
  );
}
