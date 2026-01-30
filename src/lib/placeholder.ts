// lib/placeholders.ts
export const getInitials = (name: string): string => {
  const words = name.trim().split(" ");
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (
    words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase()
  );
};

export const generatePlaceholderProfile = (name: string, size = 200): string => {
  const initials = getInitials(name);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Background color based on name hash
  const hash = Array.from(name).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue = hash % 360;
  ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
  ctx.fillRect(0, 0, size, size);

  // Draw initials
  ctx.font = `${size / 2}px sans-serif`;
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, size / 2, size / 2);

  return canvas.toDataURL("image/png");
};

export const generatePlaceholderCover = (width = 800, height = 200): string => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Random pastel color
  const hue = Math.floor(Math.random() * 360);
  const color1 = `hsl(${hue}, 70%, 70%)`;
  const color2 = `hsl(${(hue + 30) % 360}, 70%, 80%)`;

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL("image/png");
};
