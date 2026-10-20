export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export function fileKind(file: File): "pdf" | "docx" | null {
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext === "pdf" || ext === "docx" ? ext : null;
}
export function validateFiles(files: readonly File[]): {
  accepted: File[];
  rejected: { name: string; message: string }[];
} {
  const accepted: File[] = [],
    rejected: { name: string; message: string }[] = [];
  for (const file of files) {
    const kind = fileKind(file);
    let message = "";
    if (files.length > 20) message = "Envie no máximo 20 arquivos por lote.";
    else if (!kind) message = "Escolha um arquivo DOCX ou PDF.";
    else if (file.size === 0) message = "O arquivo está vazio.";
    else if (file.size > MAX_FILE_SIZE)
      message = "Cada arquivo pode ter no máximo 10 MiB.";
    else if (
      file.type &&
      ![
        "application/octet-stream",
        "application/zip",
        kind === "pdf" ? "application/pdf" : DOCX_MIME,
      ].includes(file.type)
    )
      message = "O tipo do arquivo não corresponde à extensão.";
    if (message) rejected.push({ name: file.name, message });
    else accepted.push(file);
  }
  return { accepted, rejected };
}
