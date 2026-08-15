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
    const searchParams = req.nextUrl.searchParams;
    const allowPhysics = searchParams.get("physics") === "true";

    // High-Performance Vis.js Interceptor for 100,000+ Edge Graphs (60 FPS smooth rendering)
    const physicsInterceptorScript = `
<script>
  (function() {
    var _vis = window.vis;
    Object.defineProperty(window, 'vis', {
      configurable: true,
      get: function() { return _vis; },
      set: function(v) {
        _vis = v;
        if (_vis && _vis.Network) {
          var OrigNetwork = _vis.Network;
          _vis.Network = function(container, data, options) {
            options = options || {};
            // 1. Disable expensive 2D physics simulation loops
            options.physics = { enabled: false };
            
            // 2. Convert expensive Bezier curves to straight lines (10x faster Canvas rendering)
            options.edges = options.edges || {};
            options.edges.smooth = false;
            
            // 3. Hide 100,000+ edge lines during drag/zoom for 60 FPS smooth movement
            options.interaction = options.interaction || {};
            options.interaction.hideEdgesOnDrag = true;
            options.interaction.hideEdgesOnZoom = true;
            options.interaction.hover = false;
            
            return new OrigNetwork(container, data, options);
          };
        }
      }
    });
  })();
</script>
`;

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

      // For HTML files, inject high-performance renderer interceptor
      if (fileRecord.fileType === "html" && !allowPhysics) {
        let textBuffer = buffer;
        if (isGzipped) {
          try {
            textBuffer = zlib.gunzipSync(buffer);
          } catch (e) {
            console.warn("Gunzip failed when injecting physics optimizer:", e);
          }
        }

        let htmlString = textBuffer.toString("utf-8");

        if (htmlString.includes("<head>")) {
          htmlString = htmlString.replace("<head>", `<head>${physicsInterceptorScript}`);
        } else if (htmlString.includes("<html>")) {
          htmlString = htmlString.replace("<html>", `<html><head>${physicsInterceptorScript}</head>`);
        } else {
          htmlString = physicsInterceptorScript + htmlString;
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
    } else if (fileRecord.fileType === "html" && inlineContent && !allowPhysics) {
      if (inlineContent.includes("<head>")) {
        inlineContent = inlineContent.replace("<head>", `<head>${physicsInterceptorScript}`);
      } else {
        inlineContent = physicsInterceptorScript + inlineContent;
      }
    }

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
