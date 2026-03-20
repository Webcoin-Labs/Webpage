"use client";

import { useState, useTransition } from "react";
import { Loader2, UploadCloud, CheckCircle2, FileText } from "lucide-react";
import { submitPitchDeck } from "@/app/actions/pitchdeck";

type ProjectOption = { id: string; name: string };

export function PitchDeckUploadForm({ projects }: { projects: ProjectOption[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fileName, setFileName] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");
        const form = e.currentTarget;
        const data = new FormData(form);
        startTransition(async () => {
          const result = await submitPitchDeck(data);
          if (result.success) {
            setSuccessMessage("Upload complete. Your AI report has been generated.");
            form.reset();
            setFileName("");
          } else {
            setError(result.error);
          }
        });
      }}
      className="mt-6 space-y-4"
    >
      {projects.length > 0 ? (
        <select
          name="projectId"
          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm"
          defaultValue=""
        >
          <option value="">Attach to project (optional)</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      ) : null}

      <label className="rounded-lg border border-dashed border-border/80 bg-background px-4 py-6 text-sm text-muted-foreground flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-400/60 transition-colors">
        {fileName ? (
          <>
            <FileText className="h-5 w-5 text-blue-400" />
            <span className="text-blue-300 font-medium truncate max-w-full">{fileName}</span>
            <span className="text-xs text-muted-foreground/70">Click to change file</span>
          </>
        ) : (
          <>
            <UploadCloud className="h-5 w-5 text-blue-300" />
            <span>Upload PDF or DOCX pitch deck (max 14MB)</span>
          </>
        )}
        <input
          type="file"
          name="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          required
          className="hidden"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            setFileName(selected?.name ?? "");
            setError("");
          }}
        />
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-blue-500 text-white py-3 text-sm font-medium hover:bg-blue-500/90 disabled:opacity-70 inline-flex items-center justify-center gap-2"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isPending ? "Uploading, extracting, and analyzing..." : "Upload & Run AI Review"}
      </button>

      {successMessage ? (
        <p className="text-sm text-emerald-300 inline-flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4" />
          {successMessage}
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
