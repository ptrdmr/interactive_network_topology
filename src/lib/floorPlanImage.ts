import { FLOOR_PLAN_HEIGHT, FLOOR_PLAN_WIDTH } from "@/constants/floorPlan";

/**
 * Draw the image into the fixed floor-plan coordinate space (letterboxed, JPEG).
 * Keeps storage size reasonable and matches device x/y coordinates.
 */
export function normalizeFloorPlanImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file"));
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = FLOOR_PLAN_WIDTH;
      canvas.height = FLOOR_PLAN_HEIGHT;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not prepare image"));
        return;
      }
      ctx.fillStyle = "#0a0f1a";
      ctx.fillRect(0, 0, FLOOR_PLAN_WIDTH, FLOOR_PLAN_HEIGHT);
      const scale = Math.min(
        FLOOR_PLAN_WIDTH / img.width,
        FLOOR_PLAN_HEIGHT / img.height
      );
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (FLOOR_PLAN_WIDTH - dw) / 2;
      const dy = (FLOOR_PLAN_HEIGHT - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}
