interface MultipartPart {
  part_number: number;
  upload_url: string;
}

interface UploadMultipartFileArgs {
  file: File;
  presignedParts: MultipartPart[];
  partSizeBytes: number;
  onProgress?: (uploadedCount: number, totalCount: number) => void;
}

export async function uploadMultipartFile({
  file,
  presignedParts,
  partSizeBytes,
  onProgress,
}: UploadMultipartFileArgs) {
  const completedParts: Array<{ part_number: number; etag: string }> = [];

  for (const [index, part] of presignedParts.entries()) {
    const start = (part.part_number - 1) * partSizeBytes;
    const end = Math.min(start + partSizeBytes, file.size);
    const blob = file.slice(start, end);

    const response = await fetch(part.upload_url, {
      method: "PUT",
      body: blob,
    });

    if (!response.ok) {
      throw new Error(`Part ${part.part_number} upload failed.`);
    }

    const etag = response.headers.get("etag");
    if (!etag) {
      throw new Error(`Missing ETag for part ${part.part_number}.`);
    }

    completedParts.push({ part_number: part.part_number, etag });
    onProgress?.(index + 1, presignedParts.length);
  }

  return completedParts;
}
