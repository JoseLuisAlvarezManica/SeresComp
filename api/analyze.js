import { IncomingForm } from 'formidable';
import fs from 'fs';
import { promisify } from 'util';

export const config = {
  api: {
    bodyParser: false,
  },
};

const readFile = promisify(fs.readFile);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm({ multiples: false, uploadDir: '/tmp', keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error parsing file', detail: err.message });
    }

    const file = files.file;
    if (!file?.filepath) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const buffer = await readFile(file.filepath);

      const azureRes = await fetch(
        `${process.env.FORM_ENDPOINT}/documentModels/${process.env.FORM_MODELID}:analyze?api-version=2023-07-31-preview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Ocp-Apim-Subscription-Key': process.env.FORM_API_KEY,
          },
          body: buffer,
        }
      );

      const location = azureRes.headers.get('operation-location');
      if (!location) {
        const errorText = await azureRes.text();
        return res.status(500).json({ error: 'Missing operation-location', body: errorText });
      }

      // Poll until analysis completes
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 2000));

        const pollRes = await fetch(location, {
          headers: { 'Ocp-Apim-Subscription-Key': process.env.FORM_API_KEY },
        });
        const pollData = await pollRes.json();

        if (pollData.status === 'succeeded') {
          return res.status(200).json(pollData);
        } else if (pollData.status === 'failed') {
          return res.status(500).json({ error: 'Azure analysis failed', details: pollData });
        }
      }

      return res.status(500).json({ error: 'Timed out waiting for result' });
    } catch (e) {
      return res.status(500).json({ error: e.message || 'Unexpected server error' });
    }
  });
}
