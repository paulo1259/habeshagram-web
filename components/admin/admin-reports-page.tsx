"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ExternalLink, Flag, ShieldAlert } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { formatDate } from "@/lib/utils";
import { listAdminReports, updateAdminReportStatus } from "@/services/admin-report-service";
import { PostReport, PostReportStatus } from "@/types";

const statusActions: Array<{
  label: string;
  status: PostReportStatus;
}> = [
  { label: "Mark reviewed", status: "reviewed" },
  { label: "Dismiss", status: "dismissed" },
  { label: "Escalate", status: "escalated" }
];

const statusStyles: Record<PostReportStatus, string> = {
  open: "bg-orange-50 text-orange-700 border-orange-100",
  reviewed: "bg-brand-50 text-brand-700 border-brand-100",
  dismissed: "bg-stone-100 text-stone-600 border-stone-200",
  escalated: "bg-red-50 text-red-700 border-red-100"
};

export function AdminReportsPage() {
  const [reports, setReports] = useState<PostReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const response = await listAdminReports();

        if (!isMounted) {
          return;
        }

        setReports(response.reports);
        setMessage(response.message ?? null);
      } catch (nextError) {
        if (!isMounted) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "Could not load reports.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleStatusUpdate(reportId: string, status: PostReportStatus) {
    setUpdatingId(reportId);
    setError(null);
    setMessage(null);

    try {
      const response = await updateAdminReportStatus(reportId, status);
      setReports((current) =>
        current.map((report) => (report.id === reportId ? response.report : report))
      );
      setMessage(response.message ?? `Report marked as ${status}.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not update report status.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <AdminLayout
      title="Moderation Reports"
      description="Review community-submitted reports privately inside the admin workspace. Public users can submit reports, but only approved admins can read or resolve them."
    >
      <section className="space-y-4">
        <SectionHeader
          eyebrow="Reports"
          title="Community moderation queue"
          description="Reports are shown newest first so the latest issues are easy to triage."
        />

        {error ? (
          <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-[24px] border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[28px] border border-brand-100 bg-card/96 p-6 text-sm text-stone-500 shadow-soft">
            Loading moderation reports...
          </div>
        ) : !reports.length ? (
          <EmptyState
            title="No reports in the queue"
            description="When community members flag posts, they will appear here for review."
          />
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <article
                key={report.id}
                className="rounded-[30px] border border-brand-100 bg-card/96 p-4 shadow-soft sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">
                        <Flag className="h-3.5 w-3.5" />
                        {report.reason}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusStyles[report.status]}`}
                      >
                        {report.status}
                      </span>
                      <span className="text-xs text-stone-500">{formatDate(report.createdAt)}</span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                        Report {report.id}
                      </p>
                      <h2 className="text-xl font-black tracking-tight text-ink">
                        Post {report.postId}
                      </h2>
                      <p className="text-sm leading-6 text-stone-600">
                        Reported user: <span className="font-semibold text-ink">{report.reportedUserId}</span>
                        {" · "}
                        Reporter: <span className="font-semibold text-ink">@{report.reporterUsername}</span>
                      </p>
                    </div>
                  </div>

                  <div className="rounded-[24px] bg-gradient-to-br from-brand-50 via-card to-orange-50 px-4 py-3 text-sm text-stone-600 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Avatar
                        username={report.reporterUsername}
                        imageURL={report.reporterProfileImageURL}
                        className="h-10 w-10"
                      />
                      <div>
                        <p className="font-semibold text-ink">@{report.reporterUsername}</p>
                        <p className="text-xs text-stone-500">{report.reporterUserId}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_14rem]">
                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-brand-100 bg-brand-50/40 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                        Report details
                      </p>
                      <p className="mt-2 text-sm leading-6 text-stone-700">
                        {report.details || "No extra detail was provided with this report."}
                      </p>
                    </div>

                    <div className="rounded-[24px] border border-brand-100 bg-card p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                        Post preview
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                        {report.postTextPreview || "No text preview was captured for this post."}
                      </p>
                      {report.postImageURL ? (
                        <div className="mt-3 overflow-hidden rounded-[20px] border border-brand-100 bg-brand-50/30">
                          <img
                            src={report.postImageURL}
                            alt="Reported post"
                            className="max-h-64 w-full object-cover"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {statusActions.map((action) => (
                      <Button
                        key={action.status}
                        type="button"
                        variant={report.status === action.status ? "primary" : "outline"}
                        className="w-full"
                        disabled={updatingId === report.id || report.status === action.status}
                        onClick={() => void handleStatusUpdate(report.id, action.status)}
                      >
                        {updatingId === report.id && report.status !== action.status
                          ? "Updating..."
                          : action.label}
                      </Button>
                    ))}

                    <div className="rounded-[22px] border border-brand-100 bg-surface px-4 py-3 text-xs leading-6 text-stone-500">
                      <p className="font-semibold uppercase tracking-[0.16em] text-brand-700">
                        IDs
                      </p>
                      <p className="mt-2 break-all">Reported: {report.reportedUserId}</p>
                      <p className="break-all">Reporter: {report.reporterUserId}</p>
                      <p className="break-all">Post: {report.postId}</p>
                    </div>

                    <div className="rounded-[22px] border border-dashed border-brand-200 bg-card px-4 py-3 text-xs leading-6 text-stone-500">
                      <div className="inline-flex items-center gap-2 font-semibold uppercase tracking-[0.16em] text-brand-700">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Next step
                      </div>
                      <p className="mt-2">
                        Use status updates to track moderation progress without exposing reports to the public app.
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
