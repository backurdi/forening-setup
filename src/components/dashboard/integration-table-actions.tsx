"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition, type MouseEvent } from "react";
import { createPortal } from "react-dom";

import { updateIntegrationStatus } from "@/actions/integrations";
import { CreateIntegrationFlow } from "@/components/dashboard/create-integration-flow";
import { DashboardDialog } from "@/components/dashboard/dashboard-dialog";
import { MoreHorizontalIcon } from "@/components/dashboard/icons";
import { createDefaultIntegrationFieldSelections, type IntegrationBuilderInput } from "@/lib/validations/integrations";

type IntegrationTableActionsProps = {
  integration: {
    buttonLabel: string;
    destinationType: "external_url" | "stripe_checkout";
    destinationUrl: string;
    fields: Array<{
      fieldType: "text" | "email" | "phone" | "textarea";
      key: "company" | "email" | "first_name" | "last_name" | "notes" | "phone";
      label: string;
      required: boolean;
    }>;
    integrationType: "onboarding_button" | "onboarding_form";
    name: string;
    slug: string;
    status: "active" | "draft";
    summary: string;
    title: string;
  };
  orgSlug: string;
  publicBaseUrl: string;
  stripeConnected: boolean;
};

type ActionMenuState = {
  left: number;
  openUpward: boolean;
  top: number;
  width: number;
};

const ACTION_MENU_GUTTER = 12;
const ACTION_MENU_OFFSET = 8;
const ACTION_MENU_WIDTH = 260;
const ACTION_MENU_ESTIMATED_HEIGHT = 320;

function getActionMenuState(trigger: HTMLButtonElement): ActionMenuState {
  const rect = trigger.getBoundingClientRect();
  const width = Math.min(ACTION_MENU_WIDTH, window.innerWidth - ACTION_MENU_GUTTER * 2);
  const openUpward =
    window.innerHeight - rect.bottom < ACTION_MENU_ESTIMATED_HEIGHT && rect.top > ACTION_MENU_ESTIMATED_HEIGHT;
  const left = Math.max(
    ACTION_MENU_GUTTER,
    Math.min(rect.right - width, window.innerWidth - width - ACTION_MENU_GUTTER)
  );

  return {
    left,
    openUpward,
    top: openUpward ? rect.top - ACTION_MENU_OFFSET : rect.bottom + ACTION_MENU_OFFSET,
    width
  };
}

function buildInitialValues(orgSlug: string, integration: IntegrationTableActionsProps["integration"]): Partial<IntegrationBuilderInput> {
  const baseSelections = createDefaultIntegrationFieldSelections();
  const selectedKeys = new Map(integration.fields.map((field) => [field.key, field.required]));

  return {
    buttonLabel: integration.buttonLabel,
    destinationType: integration.destinationType,
    destinationUrl: integration.destinationUrl,
    existingSlug: integration.slug,
    fieldSelections: baseSelections.map((field) => ({
      ...field,
      enabled: selectedKeys.has(field.key),
      required: selectedKeys.get(field.key) ?? false
    })),
    integrationType: integration.integrationType,
    name: integration.name,
    orgSlug,
    slug: integration.slug,
    status: integration.status,
    summary: integration.summary,
    title: integration.title
  };
}

export function IntegrationTableActions({
  integration,
  orgSlug,
  publicBaseUrl,
  stripeConnected
}: IntegrationTableActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rowMessage, setRowMessage] = useState<string | null>(null);
  const [useMessage, setUseMessage] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUseOpen, setIsUseOpen] = useState(false);
  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null);
  const publicUrl = `${publicBaseUrl}/${orgSlug}/integrations/${integration.slug}`;
  const previewUrl = `${publicBaseUrl}/${orgSlug}/integrations/${integration.slug}/preview`;
  const htmlSnippet =
    integration.integrationType === "onboarding_button"
      ? `<a href="${publicUrl}">${integration.buttonLabel}</a>`
      : `<iframe src="${publicUrl}" title="${integration.title}" style="width:100%;min-height:760px;border:0;"></iframe>`;
  const initialValues = useMemo(() => buildInitialValues(orgSlug, integration), [integration, orgSlug]);

  useEffect(() => {
    if (!actionMenu) {
      return;
    }

    function closeActionMenu() {
      setActionMenu(null);
    }

    function handlePointerDown(event: PointerEvent) {
      if (!(event.target instanceof HTMLElement)) {
        return;
      }

      if (event.target.closest("[data-integration-action-menu], [data-integration-action-trigger]")) {
        return;
      }

      closeActionMenu();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeActionMenu();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", closeActionMenu);
    window.addEventListener("scroll", closeActionMenu, true);
    window.addEventListener("dashboard:close-modals", closeActionMenu);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", closeActionMenu);
      window.removeEventListener("scroll", closeActionMenu, true);
      window.removeEventListener("dashboard:close-modals", closeActionMenu);
    };
  }, [actionMenu]);

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setUseMessage("Copied to clipboard.");
    } catch {
      setUseMessage("Copy failed. You can still select the text manually.");
    }
  }

  function onToggleStatus() {
    setRowMessage(null);
    setActionMenu(null);

    startTransition(async () => {
      const result = await updateIntegrationStatus({
        orgSlug,
        slug: integration.slug,
        status: integration.status === "active" ? "draft" : "active"
      });

      if (!result.ok) {
        setRowMessage("message" in result ? result.message : "Status could not be updated.");
        return;
      }

      router.refresh();
    });
  }

  function toggleActionMenu(event: MouseEvent<HTMLButtonElement>) {
    if (actionMenu) {
      setActionMenu(null);
      return;
    }

    setActionMenu(getActionMenuState(event.currentTarget));
  }

  return (
    <>
      <div className="integration-action-stack">
        <button
          aria-label={`Open actions for ${integration.title}`}
          aria-expanded={Boolean(actionMenu)}
          aria-haspopup="menu"
          className={`member-action-trigger${actionMenu ? " is-open" : ""}`}
          data-integration-action-trigger="true"
          onClick={toggleActionMenu}
          type="button"
        >
          <span className="sr-only">Actions</span>
          <MoreHorizontalIcon />
        </button>
        {rowMessage ? <p className="integration-action-note">{rowMessage}</p> : null}
      </div>

      {actionMenu
        ? createPortal(
            <div
              className="member-action-menu"
              data-integration-action-menu="true"
              role="menu"
              style={{
                left: `${actionMenu.left}px`,
                top: `${actionMenu.top}px`,
                transform: actionMenu.openUpward ? "translateY(-100%)" : undefined,
                width: `${actionMenu.width}px`
              }}
            >
              <button
                className="member-action-button"
                onClick={() => {
                  setActionMenu(null);
                  setIsUseOpen(true);
                }}
                type="button"
              >
                Use
              </button>
              <button
                className="member-action-button"
                onClick={() => {
                  setActionMenu(null);
                  setIsEditOpen(true);
                }}
                type="button"
              >
                Edit
              </button>
              <button className="member-action-button" disabled={isPending} onClick={onToggleStatus} type="button">
                {integration.status === "active" ? "Deactivate" : "Activate"}
              </button>
            </div>,
            document.body
          )
        : null}

      <DashboardDialog
        description="Update the integration setup and save the changes back into the table."
        eyebrow="Edit"
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit ${integration.title}`}
      >
        <CreateIntegrationFlow
          initialValues={initialValues}
          orgSlug={orgSlug}
          stripeConnected={stripeConnected}
          submitLabel="Save integration"
        />
      </DashboardDialog>

      <DashboardDialog
        description="Use this hosted URL directly, or embed it into another website."
        eyebrow="Use"
        isOpen={isUseOpen}
        onClose={() => setIsUseOpen(false)}
        title={integration.title}
      >
        <div className="dashboard-form dialog-form integration-use-dialog">
          <div className="notice-card">
            {integration.status !== "active"
              ? "This draft has its own standalone preview page. Activate the integration before using the hosted URL or website snippet publicly."
              : integration.integrationType === "onboarding_button"
                ? "This integration is hosted inside the app. Drop the link into a website button, menu item, or CTA."
                : "This integration has a hosted page you can link to, and it also has an iframe embed option for website placement."}
          </div>

          <label>
            {integration.status === "active" ? "Hosted URL" : "Preview URL"}
            <textarea readOnly rows={2} value={integration.status === "active" ? publicUrl : previewUrl} />
          </label>

          <div className="actions-row">
            <button
              className="secondary-action compact"
              type="button"
              onClick={() => copyText(integration.status === "active" ? publicUrl : previewUrl)}
            >
              Copy URL
            </button>
            <a className="link-button" href={integration.status === "active" ? publicUrl : previewUrl} rel="noreferrer" target="_blank">
              {integration.status === "active" ? "Open hosted page" : "Preview draft"}
            </a>
          </div>

          <label>
            Website snippet
            <textarea readOnly rows={integration.integrationType === "onboarding_button" ? 3 : 5} value={htmlSnippet} />
          </label>

          <button className="secondary-action compact" type="button" onClick={() => copyText(htmlSnippet)}>
            Copy snippet
          </button>

          {useMessage ? <p className="success-text">{useMessage}</p> : null}
        </div>
      </DashboardDialog>
    </>
  );
}
