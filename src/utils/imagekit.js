import ImageKit from "imagekit";
import fs from "fs";

let imagekit;

const getImageKitInstance = () => {
  if (!imagekit) {
    imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
    });
  }
  return imagekit;
};

const uploadToImageKit = async (localFilePath) => {
  if (!localFilePath) return null;

  try {
    const fileBuffer = fs.readFileSync(localFilePath);
    const imagekit = getImageKitInstance();

    const result = await imagekit.upload({
      file: fileBuffer,
      fileName: localFilePath.split("/").pop(),
    });

    fs.unlinkSync(localFilePath);
    return result;
  } catch (err) {
    fs.unlinkSync(localFilePath);
    throw err;
  }
};

export { uploadToImageKit };
