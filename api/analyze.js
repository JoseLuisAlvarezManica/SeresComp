import fs from "fs";
import fetch from "node-fetch";
import formidable from "formidable";

export const config = {
  api: {
    bodyParser: false, // Required for file uploads
  },
};

export default async function handler(req, res) {
  const form = new formidable.IncomingForm({ uploadDir: "/tmp", keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Upload error" });

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const buffer = fs.readFileSync(file.filepath);

    const azureResponse = await fetch(`${process.env.FORM_ENDPOINT}/documentModels/${process.env.FORM_MODELID}:analyze?api-version=2023-07-31-preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Ocp-Apim-Subscription-Key": process.env.FORM_API_KEY,
      },
      body: buffer,
    });

    const operationLocation = azureResponse.headers.get("operation-location");
    res.status(200).json({ operationLocation });
  });
}
