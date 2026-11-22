"use client";

import { useFormStatus } from "react-dom";
import { Arrow } from "./Logo";

/** Submit button that shows progress and blocks double submits while a server action runs. */
export function SubmitButton({
  children,
  pendingLabel,
  className = "btn btn-primary",
  arrow = true,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
  arrow?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-disabled={pending}>
      {pending ? pendingLabel : children} {arrow && !pending && <Arrow />}
    </button>
  );
}
