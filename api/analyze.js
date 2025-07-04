
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

  const form = new IncomingForm({ multiples: false });
  form.uploadDir = '/tmp';
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error parsing the file' });
    }

    const file = files.file;
    const buffer = await readFile(file.filepath);

    try {
      const response = await fetch(`${process.env.FORM_ENDPOINT}/documentModels/${process.env.FORM_MODELID}:analyze?api-version=2024-02-29`, {
        method: 'POST',
        headers: {
          'Content-Type': 'image/jpeg', // or the right MIME type
          'Ocp-Apim-Subscription-Key': process.env.FORM_API_KEY,
        },
        body: buffer,
      });

      if (!response.ok) {
        const text = await response.text();
        return res.status(500).json({ error: `Upload failed: ${text}` });
      }

      const operationLocation = response.headers.get('operation-location');
      if (!operationLocation) {
        return res.status(500).json({ error: 'Missing operation-location in Azure response' });
      }

      // poll the operationLocation until done
      let result;
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const poll = await fetch(operationLocation, {
          headers: {
            'Ocp-Apim-Subscription-Key': process.env.FORM_API_KEY,
          },
        });
        result = await poll.json();
        if (result.status === 'succeeded') break;
      }

      if (result.status !== 'succeeded') {
        return res.status(500).json({ error: 'Azure Form Recognizer did not finish in time' });
      }

      return res.status(200).json(result);
    } catch (e) {
      return res.status(500).json({ error: `Unexpected error: ${e.message}` });
    }
  });
}
