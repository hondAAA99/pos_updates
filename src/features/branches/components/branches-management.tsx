"use client";

import { Plus, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useRouter } from "@/i18n/navigation";
import { ApiClientError } from "@/lib/api-client";
import {
  createBranchOnApi,
  deleteBranchFromApi,
  getBranchDetailsFromApi,
  listBranchesFromApi,
  updateBranchOnApi,
} from "../services/branches-api-service";
import type { Branch, BranchSupply } from "../types/branch";
import { BranchDetailsSheet } from "./branch-details-sheet";
import { BranchFormSheet } from "./branch-form-sheet";
import { BranchesTable } from "./branches-table";
import { DeleteBranchSheet } from "./delete-branch-sheet";

type LoadState = "loading" | "ready" | "error";

export function BranchesManagement() {
  const t = useTranslations("branchManagement");
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const canManage = user?.role === "admin";
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [retryCount, setRetryCount] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [viewingBranch, setViewingBranch] = useState<Branch | null>(null);
  const [viewingSupply, setViewingSupply] = useState<BranchSupply | null>(null);
  const [detailsLoadState, setDetailsLoadState] =
    useState<LoadState>("loading");
  const [detailsError, setDetailsError] = useState("");
  const [deletingBranch, setDeletingBranch] = useState<Branch | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const detailsRequestId = useRef(0);

  const handleApiError = useCallback(
    (caught: unknown, fallback = t("states.operationError")) => {
      setError(
        caught instanceof ApiClientError && caught.status === 401
          ? t("states.unauthorized")
          : fallback,
      );
      if (caught instanceof ApiClientError && caught.status === 401) {
        logout();
        router.replace("/login");
      }
    },
    [logout, router, t],
  );

  const loadBranches = useCallback(async () => {
    if (!token) {
      setBranches([]);
      setLoadState("error");
      setError(t("states.unauthorized"));
      return;
    }

    try {
      const result = await listBranchesFromApi(token);
      setBranches(result);
      setLoadState("ready");
      setError("");
    } catch (caught) {
      setLoadState("error");
      handleApiError(caught);
    }
  }, [handleApiError, t, token]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!token) {
        setLoadState("error");
        setError(t("states.unauthorized"));
        return;
      }

      try {
        const result = await listBranchesFromApi(token);
        if (active) {
          setBranches(result);
          setLoadState("ready");
          setError("");
        }
      } catch (caught) {
        if (active) {
          setLoadState("error");
          handleApiError(caught, t("states.loadError"));
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [handleApiError, retryCount, t, token]);

  function openCreateForm() {
    setEditingBranch(null);
    setEditorOpen(true);
    setFeedback("");
    setError("");
  }

  function openEditForm(branch: Branch) {
    detailsRequestId.current += 1;
    setViewingBranch(null);
    setViewingSupply(null);
    setEditingBranch(branch);
    setEditorOpen(true);
    setFeedback("");
    setError("");
  }

  function closeEditor(open: boolean) {
    setEditorOpen(open);
    if (!open) setEditingBranch(null);
  }

  async function handleSave(name: string) {
    if (!token || !canManage) return;
    try {
      if (editingBranch) {
        await updateBranchOnApi(token, editingBranch._id, name);
        setFeedback(t("feedback.updated"));
      } else {
        await createBranchOnApi(token, name);
        setFeedback(t("feedback.created"));
      }
      setError("");
      closeEditor(false);
      await loadBranches();
    } catch (caught) {
      handleApiError(caught);
    }
  }

  async function handleDelete() {
    if (!deletingBranch || !token || !canManage) return;

    try {
      await deleteBranchFromApi(token, deletingBranch._id);
      setFeedback(t("feedback.deleted"));
      setError("");
      setDeletingBranch(null);
      detailsRequestId.current += 1;
      setViewingBranch(null);
      setViewingSupply(null);
      await loadBranches();
    } catch (caught) {
      handleApiError(caught);
    }
  }

  async function openDetails(branch: Branch) {
    const requestId = ++detailsRequestId.current;
    setViewingBranch(branch);
    setViewingSupply(null);
    setDetailsLoadState("loading");
    setDetailsError("");

    if (!token) {
      setDetailsLoadState("error");
      setDetailsError(t("states.unauthorized"));
      return;
    }

    try {
      const details = await getBranchDetailsFromApi(token, branch._id);
      if (requestId !== detailsRequestId.current) return;
      setViewingBranch(details.branch);
      setViewingSupply(details.supply);
      setDetailsLoadState("ready");
      setFeedback("");
      setError("");
    } catch (caught) {
      if (requestId !== detailsRequestId.current) return;
      setDetailsLoadState("error");
      setDetailsError(
        caught instanceof ApiClientError && caught.status === 401
          ? t("states.unauthorized")
          : t("details.loadError"),
      );
      if (caught instanceof ApiClientError && caught.status === 401) {
        logout();
        router.replace("/login");
      }
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex items-end justify-between gap-6">
        <div>
          <h1 className="type-page-title">{t("title")}</h1>
          <p className="type-secondary mt-2">{t("description")}</p>
        </div>
        {canManage && (
          <Button type="button" onClick={openCreateForm}>
            <Plus aria-hidden="true" />
            {t("actions.add")}
          </Button>
        )}
      </header>

      {feedback && (
        <p role="status" className="text-sm text-success">
          {feedback}
        </p>
      )}

      {error && loadState === "ready" && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {loadState === "loading" ? (
        <Card
          aria-label={t("states.loading")}
          className="min-h-64 items-center justify-center"
        >
          <p className="text-sm text-muted-foreground" role="status">
            {t("states.loading")}
          </p>
        </Card>
      ) : loadState === "error" ? (
        <Card className="min-h-64 items-center justify-center text-center">
          <p role="alert" className="text-sm text-destructive">
            {error || t("states.loadError")}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setLoadState("loading");
              setRetryCount((count) => count + 1);
            }}
          >
            <RefreshCw aria-hidden="true" />
            {t("actions.retry")}
          </Button>
        </Card>
      ) : (
        <BranchesTable
          branches={branches}
          canManage={canManage}
          onAdd={openCreateForm}
          onView={openDetails}
          onEdit={openEditForm}
          onDelete={(branch) => {
            setDeletingBranch(branch);
            setFeedback("");
            setError("");
          }}
        />
      )}

      {canManage && (
        <BranchFormSheet
          key={`${editorOpen}:${editingBranch?._id ?? "new"}`}
          open={editorOpen}
          branch={editingBranch}
          onOpenChange={closeEditor}
          onSubmit={handleSave}
        />
      )}
      <BranchDetailsSheet
        branch={viewingBranch}
        supply={viewingSupply}
        loadState={detailsLoadState}
        error={detailsError}
        canManage={canManage}
        onOpenChange={(open) => {
          if (!open) {
            detailsRequestId.current += 1;
            setViewingBranch(null);
            setViewingSupply(null);
          }
        }}
        onRetry={() => {
          if (viewingBranch) void openDetails(viewingBranch);
        }}
        onEdit={openEditForm}
        onDelete={(branch) => {
          detailsRequestId.current += 1;
          setViewingBranch(null);
          setViewingSupply(null);
          setDeletingBranch(branch);
        }}
      />
      {canManage && (
        <DeleteBranchSheet
          branch={deletingBranch}
          onOpenChange={(open) => {
            if (!open) setDeletingBranch(null);
          }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
