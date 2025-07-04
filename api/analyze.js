//(Vercel Serverless Function)
import formidable from "formidable";
import fs from "fs";
import fetch from "node-fetch";

export const config = {
  api: {
    bodyParser: false, 
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const form = new formidable.IncomingForm({ uploadDir: "/tmp", keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "Error parsing form data" });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file || !file.filepath) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const buffer = fs.readFileSync(file.filepath);

      const azureRes = await fetch(
        `${process.env.FORM_ENDPOINT}/documentModels/${process.env.FORM_MODELID}:analyze?api-version=2023-07-31-preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Ocp-Apim-Subscription-Key": process.env.FORM_API_KEY,
          },
          body: buffer,
        }
      );

      const operationLocation = azureRes.headers.get("operation-location");

      if (!operationLocation) {
        return res.status(500).json({ error: "No operation-location returned from Azure" });
      }

      return res.status(200).json({ operationLocation });
    } catch (e) {
      return res.status(500).json({ error: "Failed to analyze document", detail: e.message });
    }
  });
}
