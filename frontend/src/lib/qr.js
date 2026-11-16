// Reads a QR code from a photo. Used on the web (and as a fallback on phones
// when the person prefers choosing a photo instead of the live camera).
import { Platform } from "react-native";
import jsQR from "jsqr";

/** Web: open the file picker / camera and decode the QR in the chosen image. */
export function pickAndDecodeQrWeb() {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== "web") return reject(new Error("web only"));
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*"; input.setAttribute("capture", "environment");
    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return resolve(null);
      try { resolve(await decodeFile(file)); } catch (e) { reject(e); }
    };
    input.click();
  });
}

function decodeFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        for (const max of [1100, 700, 1600]) {
          const sc = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
          const w = Math.round(img.naturalWidth * sc), h = Math.round(img.naturalHeight * sc);
          const c = document.createElement("canvas"); c.width = w; c.height = h;
          const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(img, 0, 0, w, h);
          const r = jsQR(x.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "attemptBoth" });
          if (r && r.data) { URL.revokeObjectURL(url); return resolve(r.data); }
        }
        URL.revokeObjectURL(url); resolve(null);
      } catch (e) { reject(e); }
    };
    img.onerror = reject;
    img.src = url;
  });
}
