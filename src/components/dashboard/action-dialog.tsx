"use client";

import { useEffect, useState } from "react";

import { PlusIcon } from "@/components/dashboard/icons";

type ActionDialogProps = {
  buttonLabel: string;
  children: React.ReactNode;
  description?: string;
  title: string;
};

export function ActionDialog({ buttonLabel, children, description, title }: ActionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function closeAllDialogs() {
      setIsOpen(false);
    }

    window.addEventListener("dashboard:close-modals", closeAllDialogs);
    return () => window.removeEventListener("dashboard:close-modals", closeAllDialogs);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button className="primary-action" type="button" onClick={() => setIsOpen(true)}>
        <PlusIcon />
        {buttonLabel}
      </button>

      {isOpen ? (
        <div className="dialog-backdrop" role="presentation" onClick={() => setIsOpen(false)}>
          <div
            aria-modal="true"
            className="dialog-shell"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="dialog-header">
              <div>
                <p className="eyebrow">Create</p>
                <h2 className="dialog-title">{title}</h2>
                {description ? <p className="body-copy">{description}</p> : null}
              </div>
              <button className="dialog-close" type="button" onClick={() => setIsOpen(false)}>
                Close
              </button>
            </div>
            <div className="dialog-body">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
