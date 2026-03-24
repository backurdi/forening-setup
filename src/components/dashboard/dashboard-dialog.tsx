"use client";

import { useEffect } from "react";

type DashboardDialogProps = {
  children: React.ReactNode;
  description?: string;
  eyebrow?: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

export function DashboardDialog({
  children,
  description,
  eyebrow = "Actions",
  isOpen,
  onClose,
  title
}: DashboardDialogProps) {
  useEffect(() => {
    function closeAllDialogs() {
      onClose();
    }

    window.addEventListener("dashboard:close-modals", closeAllDialogs);
    return () => window.removeEventListener("dashboard:close-modals", closeAllDialogs);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onClose}>
      <div aria-modal="true" className="dialog-shell" role="dialog" onClick={(event) => event.stopPropagation()}>
        <div className="dialog-header">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 className="dialog-title">{title}</h2>
            {description ? <p className="body-copy">{description}</p> : null}
          </div>
          <button className="dialog-close" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="dialog-body">{children}</div>
      </div>
    </div>
  );
}
