export const createCanvasContextFromVideo = (
  video: HTMLVideoElement
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } => {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get 2d context from canvas');
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
};
