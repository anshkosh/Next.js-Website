export type ImageAdjustment = { zoom: number; rotation: number; x: number; y: number };
export const initialAdjustment: ImageAdjustment = { zoom: 1, rotation: 0, x: 0, y: 0 };

export function cropGeometry(width: number, height: number, cropWidth: number, cropHeight: number, adjustment: ImageAdjustment) {
  const angle = adjustment.rotation * Math.PI / 180;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const rotatedWidth = cropWidth * Math.abs(cos) + cropHeight * Math.abs(sin);
  const rotatedHeight = cropWidth * Math.abs(sin) + cropHeight * Math.abs(cos);
  const scale = Math.max(rotatedWidth / width, rotatedHeight / height) * Math.max(1, adjustment.zoom);
  const xLimit = Math.max(0, (width * scale - rotatedWidth) / 2);
  const yLimit = Math.max(0, (height * scale - rotatedHeight) / 2);
  const x = Math.max(-1, Math.min(1, adjustment.x)) * xLimit;
  const y = Math.max(-1, Math.min(1, adjustment.y)) * yLimit;
  return { angle, scale, xLimit, yLimit, x: x * cos - y * sin, y: x * sin + y * cos };
}

export function drawPhoto(canvas: HTMLCanvasElement, image: HTMLImageElement, adjustment: ImageAdjustment) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser could not open the photo editor.");
  const geometry = cropGeometry(image.naturalWidth, image.naturalHeight, canvas.width, canvas.height, adjustment);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.translate(canvas.width / 2 + geometry.x, canvas.height / 2 + geometry.y);
  context.rotate(geometry.angle);
  context.scale(geometry.scale, geometry.scale);
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  context.restore();
}
