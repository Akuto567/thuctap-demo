export const getBrightness = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    const needsAnonymous = /^(https?:)?\/\//i.test(url) || url.startsWith("data:");

    if (needsAnonymous) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(128);
          return;
        }

        const w = 50, h = 50;
        canvas.width = w;
        canvas.height = h;

        ctx.drawImage(img, 0, 0, w, h);

        const data = ctx.getImageData(0, 0, w, h).data;

        let r = 0, g = 0, b = 0;

        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }

        const pixels = data.length / 4;

        r /= pixels;
        g /= pixels;
        b /= pixels;

        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        resolve(brightness);
      } catch {
        resolve(128);
      }
    };

    img.onerror = () => resolve(128); // default brightness
    img.src = url;
  });
};

export const formatCssUrl = (path) => {
  if (!path) return "";

  // Ensure we don't have double slashes after file:///
  // and ensure any backslashes are forward slashes for CSS
  // 1. Convert Windows backslashes \ to forward slashes /
  let cleanPath = path.replace(/\\/g, "/");

  // 2. Encode special characters (including quotes, spaces, and parens)
  // encodeURI handles the URL structure, but we use replace to
  // specifically catch any remaining double quotes that might break CSS.
  cleanPath = encodeURI(cleanPath).replace(/"/g, "%22");

  return `url("${cleanPath}")`;
};
