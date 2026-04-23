"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import { AdminContentItemMap, AdminContentKind, sortAdminItems } from "@/lib/admin-content";
import {
  deleteAdminItem,
  listAdminItems,
  saveAdminItem
} from "@/services/admin-content-service";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";

type FieldType = "text" | "textarea" | "select" | "checkbox" | "tags";

type FieldConfig = {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  rows?: number;
  options?: Array<{ label: string; value: string }>;
  helpText?: string;
};

type FormValue = string | boolean;
type FormState = Record<string, FormValue>;

function formStateFromItem<T extends { id: string }>(
  item: T,
  initialValues: FormState
): FormState {
  const next: FormState = { ...initialValues, id: item.id };

  Object.entries(item as Record<string, unknown>).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      next[key] = value.join(", ");
      return;
    }

    if (typeof value === "boolean") {
      next[key] = value;
      return;
    }

    if (typeof value === "string") {
      next[key] = value;
    }
  });

  return next;
}

export function AdminContentManager<K extends AdminContentKind>({
  kind,
  title,
  description,
  fields,
  initialValues,
  emptyTitle,
  emptyDescription,
  getItemTitle,
  getItemSummary,
  getBadges
}: {
  kind: K;
  title: string;
  description: string;
  fields: FieldConfig[];
  initialValues: FormState;
  emptyTitle: string;
  emptyDescription: string;
  getItemTitle: (item: AdminContentItemMap[K]) => string;
  getItemSummary: (item: AdminContentItemMap[K]) => string;
  getBadges?: (item: AdminContentItemMap[K]) => string[];
}) {
  const [items, setItems] = useState<AdminContentItemMap[K][]>([]);
  const [formState, setFormState] = useState<FormState>(initialValues);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitLabel = useMemo(
    () => (editingId ? "Save changes" : "Create item"),
    [editingId]
  );

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const response = await listAdminItems(kind);

        if (!isMounted) {
          return;
        }

        setItems(response.items);
        setMessage(response.message ?? null);
      } catch (nextError) {
        if (!isMounted) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "Could not load content.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [kind]);

  function resetForm() {
    setEditingId(null);
    setFormState(initialValues);
  }

  function updateField(name: string, value: FormValue) {
    setFormState((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload = {
        ...formState,
        id: editingId ?? undefined
      } as Partial<AdminContentItemMap[K]>;

      const response = await saveAdminItem(kind, payload);
      const nextItems = sortAdminItems([
        ...items.filter((item) => item.id !== response.item.id),
        response.item
      ]);

      setItems(nextItems);
      setMessage(response.message ?? (editingId ? "Updated successfully." : "Created successfully."));
      resetForm();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not save this item.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    setMessage(null);

    try {
      const response = await deleteAdminItem(kind, id);
      setItems((current) => current.filter((item) => item.id !== id));
      if (editingId === id) {
        resetForm();
      }
      setMessage(response.message);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not delete this item.");
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_24rem]">
      <section className="space-y-4">
        <SectionHeader eyebrow="Manage" title={title} description={description} />

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
          <div className="rounded-[28px] border border-brand-100 bg-white/96 p-6 text-sm text-stone-500 shadow-soft">
            Loading existing items...
          </div>
        ) : !items.length ? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-[28px] border border-brand-100 bg-white/96 p-4 shadow-soft sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                      {item.id}
                    </p>
                    <h3 className="mt-2 text-lg font-black tracking-tight text-ink">
                      {getItemTitle(item)}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{getItemSummary(item)}</p>
                    {getBadges ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {getBadges(item).map((badge) => (
                          <span
                            key={badge}
                            className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingId(item.id);
                        setFormState(formStateFromItem(item, initialValues));
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => void handleDelete(item.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[30px] border border-brand-100 bg-white/96 p-4 shadow-soft sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <SectionHeader
            eyebrow="Editor"
            title={editingId ? "Update item" : "Add new item"}
            description="Save changes straight into the live curated collection. Public reads stay intact, and only approved admins can write."
          />
          <Button type="button" variant="outline" onClick={resetForm}>
            <Plus className="mr-2 h-4 w-4" />
            New
          </Button>
        </div>

        <form className="mt-4 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          {fields.map((field) => {
            const value = formState[field.name];
            const inputId = `${kind}-${field.name}`;

            if (field.type === "textarea") {
              return (
                <label key={field.name} htmlFor={inputId} className="block space-y-2">
                  <span className="text-sm font-semibold text-ink">{field.label}</span>
                  <textarea
                    id={inputId}
                    value={typeof value === "string" ? value : ""}
                    rows={field.rows ?? 4}
                    placeholder={field.placeholder}
                    className="min-h-[6.5rem] w-full rounded-[22px] border border-brand-100 bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                    onChange={(event) => updateField(field.name, event.target.value)}
                  />
                  {field.helpText ? (
                    <p className="text-xs text-stone-500">{field.helpText}</p>
                  ) : null}
                </label>
              );
            }

            if (field.type === "select") {
              return (
                <label key={field.name} htmlFor={inputId} className="block space-y-2">
                  <span className="text-sm font-semibold text-ink">{field.label}</span>
                  <select
                    id={inputId}
                    value={typeof value === "string" ? value : ""}
                    className="min-h-11 w-full rounded-[22px] border border-brand-100 bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                    onChange={(event) => updateField(field.name, event.target.value)}
                  >
                    {(field.options ?? []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {field.helpText ? (
                    <p className="text-xs text-stone-500">{field.helpText}</p>
                  ) : null}
                </label>
              );
            }

            if (field.type === "checkbox") {
              return (
                <label
                  key={field.name}
                  htmlFor={inputId}
                  className="flex items-center justify-between gap-4 rounded-[22px] border border-brand-100 bg-surface px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{field.label}</p>
                    {field.helpText ? <p className="text-xs text-stone-500">{field.helpText}</p> : null}
                  </div>
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={Boolean(value)}
                    className="h-4 w-4 rounded border-brand-300 text-brand-600 focus:ring-brand-200"
                    onChange={(event) => updateField(field.name, event.target.checked)}
                  />
                </label>
              );
            }

            return (
              <label key={field.name} htmlFor={inputId} className="block space-y-2">
                <span className="text-sm font-semibold text-ink">{field.label}</span>
                <input
                  id={inputId}
                  type="text"
                  value={typeof value === "string" ? value : ""}
                  placeholder={field.placeholder}
                  className="min-h-11 w-full rounded-[22px] border border-brand-100 bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                  onChange={(event) => updateField(field.name, event.target.value)}
                />
                {field.helpText ? (
                  <p className="text-xs text-stone-500">{field.helpText}</p>
                ) : null}
              </label>
            );
          })}

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : submitLabel}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm} disabled={isSaving}>
              Reset
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
