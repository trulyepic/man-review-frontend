import ColorThief from "colorthief";

export const getDominantColorFromImage = (
  imgEl: HTMLImageElement
): Promise<string> => {
  const colorThief = new ColorThief();

  return new Promise((resolve, reject) => {
    const process = () => {
      try {
        const [r, g, b] = colorThief.getColor(imgEl);
        resolve(`rgb(${r}, ${g}, ${b})`);
      } catch (err) {
        reject(err);
      }
    };

    if (imgEl.complete && imgEl.naturalHeight !== 0) {
      process();
    } else {
      imgEl.crossOrigin = "anonymous";
      imgEl.addEventListener("load", process);
      imgEl.addEventListener("error", reject);
    }
  });
};
