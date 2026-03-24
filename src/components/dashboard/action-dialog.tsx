"use client";

import { useEffect, useState } from "react";

import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import { PlusIcon } from "@/components/dashboard/icons";

type ActionDialogProps = {
  buttonLabel: string;
  buttonClassName?: string;
  children: React.ReactNode;
  description?: string;
  title: string;
};

export function ActionDialog({ buttonClassName, buttonLabel, children, description, title }: ActionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function closeAllDialogs() {
      setIsOpen(false);
    }

    window.addEventListener("dashboard:close-modals", closeAllDialogs);
    return () => window.removeEventListener("dashboard:close-modals", closeAllDialogs);
  }, []);

  return (
    <>
      <button className={buttonClassName ?? "primary-action"} type="button" onClick={() => setIsOpen(true)}>
        <PlusIcon />
        {buttonLabel}
      </button>

      <DashboardDialog description={description} eyebrow="Create" isOpen={isOpen} onClose={() => setIsOpen(false)} title={title}>
        {children}
      </DashboardDialog>
    </>
  );
}
