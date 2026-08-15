import { NextRequest, NextResponse } from "next/server";
import { getFileById } from "@/lib/db";
import zlib from "zlib";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fileRecord = await getFileById(id);

    if (!fileRecord) {
      return new NextResponse("<h1>404 - Archivo no encontrado</h1>", {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const contentType = fileRecord.fileType === "png" ? "image/png" : "text/html; charset=utf-8";

    // If file is saved in disk / S3 storage
    if (fileRecord.storageKey) {
      const { getStorageFileBuffer } = await import("@/lib/storage");
      const buffer = await getStorageFileBuffer(fileRecord.storageKey);

      if (!buffer) {
        return new NextResponse("<h1>404 - El archivo físico no existe en el servidor</h1>", {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      const isGzipped = fileRecord.storageKey.endsWith(".gz");

      // Inject automatic vis.js physics stabilization disabler for HTML files to prevent 100% CPU lockups
      if (fileRecord.fileType === "html") {
        let textBuffer = buffer;
        if (isGzipped) {
          try {
            textBuffer = zlib.gunzipSync(buffer);
          } catch (e) {
            console.warn("Gunzip failed when injecting physics optimizer:", e);
          }
        }

        let htmlString = textBuffer.toString("utf-8");

        const physicsOptimizer = `
<script>
  window.addEventListener('load', function() {
    setTimeout(function() {
      if (window.network && typeof window.network.setOptions === 'function') {
        window.network.setOptions({ physics: { enabled: false } });
      }
    }, 2500);
  });
</script>
`;
        if (htmlString.includes("</body>")) {
          htmlString = htmlString.replace("</body>", `${physicsOptimizer}</body>`);
        } else {
          htmlString += physicsOptimizer;
        }

        return new NextResponse(htmlString, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }

      const responseHeaders: Record<string, string> = {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=86400",
      };

      if (isGzipped) {
        responseHeaders["Content-Encoding"] = "gzip";
      }

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: responseHeaders,
      });
    }

    // Inline content fallback
    let inlineContent = fileRecord.content || "";

    if (fileRecord.fileType === "png") {
      // Check if base64 data URI
      if (inlineContent.startsWith("data:image/png;base64,")) {
        const base64Data = inlineContent.replace(/^data:image\/png;base64,/, "");
        const imageBuffer = Buffer.from(base64Data, "base64");
        return new NextResponse(imageBuffer, {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
    } else if (fileRecord.fileType === "html" && inlineContent) {
      const physicsOptimizer = `
<script>
  window.addEventListener('load', function() {
    setTimeout(function() {
      if (window.network && typeof window.network.setOptions === 'function') {
        window.network.setOptions({ physics: { enabled: false } });
      }
    }, 2500);
  });
</script>
`;
      if (inlineContent.includes("</body>")) {
        inlineContent = inlineContent.replace("</body>", `${physicsOptimizer}</body>`);
      } else {
        inlineContent += physicsOptimizer;
      }
    }

    // Default HTML or text response
    return new NextResponse(inlineContent, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (error: any) {
    console.error("Error serving file content:", error);
    return new NextResponse("<h1>500 - Error al cargar el archivo</h1>", {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
