import { FormEvent, useMemo, useState } from "react";

import { api } from "../../app/api";
import { useAuth } from "../../app/auth";
import { uploadMultipartFile } from "./multipartUpload";

function estimatedParts(file: File | null) {
  if (!file) {
    return 1;
  }
  return Math.max(1, Math.ceil(file.size / (10 * 1024 * 1024)));
}

export function AdminUploadPage() {
  const { tokens } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentRating, setContentRating] = useState("PG-13");
  const [releaseYear, setReleaseYear] = useState(new Date().getFullYear());
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const partCount = useMemo(() => estimatedParts(file), [file]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!tokens?.access || !file) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setStatus("Creating upload...");

    try {
      const initiated = await api.initiateUpload(
        {
          title,
          description,
          content_rating: contentRating,
          release_year: releaseYear,
          filename: file.name,
          file_size_bytes: file.size,
          part_count: partCount,
        },
        tokens.access,
      );

      setStatus("Uploading file directly to object storage...");

      const completedParts = await uploadMultipartFile({
        file,
        presignedParts: initiated.presigned_parts,
        partSizeBytes: initiated.part_size_bytes,
        onProgress: (uploadedCount, totalCount) => {
          setStatus(`Uploading parts ${uploadedCount}/${totalCount}...`);
        },
      });

      setStatus("Finalising multipart upload and queueing processing...");

      await api.completeUpload(
        initiated.video_id,
        {
          upload_id: initiated.upload_id,
          parts: completedParts,
        },
        tokens.access,
      );

      setStatus("Upload completion request sent. The backend should now queue transcoding.");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Upload flow failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="admin-layout">
      <div>
        <p className="eyebrow">Admin upload</p>
        <h2>Trigger the Phase 1 ingest pipeline</h2>
        <p>
          This screen wires the frontend to the backend contract now, while keeping the flow
          intentionally focused on one clean multipart upload path.
        </p>
      </div>

      <form className="upload-form" onSubmit={handleSubmit}>
        <label>
          Title
          <input onChange={(event) => setTitle(event.target.value)} required value={title} />
        </label>

        <label>
          Description
          <textarea
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            value={description}
          />
        </label>

        <div className="form-row">
          <label>
            Rating
            <select onChange={(event) => setContentRating(event.target.value)} value={contentRating}>
              <option value="G">G</option>
              <option value="PG">PG</option>
              <option value="PG-13">PG-13</option>
              <option value="R">R</option>
            </select>
          </label>

          <label>
            Release year
            <input
              onChange={(event) => setReleaseYear(Number(event.target.value))}
              type="number"
              value={releaseYear}
            />
          </label>
        </div>

        <label>
          Video file
          <input
            accept=".mp4,.mov,.mkv,.avi"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            required
            type="file"
          />
        </label>

        {file ? (
          <p className="upload-hint">
            Selected {file.name} ({Math.round(file.size / 1024 / 1024)} MB), estimated {partCount} parts.
          </p>
        ) : null}

        {status ? <p className="upload-status">{status}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}

        <button className="primary-button" disabled={submitting || !file} type="submit">
          {submitting ? "Submitting..." : "Start upload flow"}
        </button>
      </form>
    </section>
  );
}
