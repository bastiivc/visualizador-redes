import JSZip from "jszip";

/**
 * Downloads all files inside a folder packaged into a single .zip archive.
 */
export async function downloadFolderAsZip(
  folderId: string,
  folderName: string,
  onProgress?: (msg: string | null) => void
): Promise<void> {
  const zip = new JSZip();
  const folderZip = zip.folder(folderName) || zip;

  if (onProgress) onProgress("Obteniendo lista de archivos...");

  // 1. Fetch list of files in folder
  const res = await fetch(`/api/files?folderId=${folderId}`);
  if (!res.ok) throw new Error("Error al obtener la lista de archivos.");
  const filesList = await res.json();

  if (!Array.isArray(filesList) || filesList.length === 0) {
    alert(`La carpeta "${folderName}" está vacía y no contiene archivos para descargar.`);
    if (onProgress) onProgress(null);
    return;
  }

  // 2. Download each file content and add to zip
  for (let i = 0; i < filesList.length; i++) {
    const file = filesList[i];
    if (onProgress) onProgress(`Empaquetando ${i + 1}/${filesList.length}: ${file.name}...`);

    try {
      const contentRes = await fetch(`/api/files/${file.id}/content`);
      if (contentRes.ok) {
        const blob = await contentRes.blob();
        const ext = file.fileType === "png" ? ".png" : ".html";
        const safeName = file.name.replace(/[/\\?%*:|"<>]/g, "_");
        const filename = `${safeName}${ext}`;
        folderZip.file(filename, blob);
      }
    } catch (err) {
      console.warn(`No se pudo incluir el archivo "${file.name}" en el zip:`, err);
    }
  }

  if (onProgress) onProgress("Generando archivo comprimido .ZIP...");

  // 3. Generate zip and trigger browser download
  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${folderName.toLowerCase().replace(/\s+/g, "_")}_archivos.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  if (onProgress) onProgress(null);
}
