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

  const form = new IncomingForm({ 
    multiples: false, 
    uploadDir: '/tmp', 
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024 // 50MB limit
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parsing error:', err);
      return res.status(500).json({ error: 'Error parsing file', detail: err.message });
    }

    // Handle both single file and array of files
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!file?.filepath) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const buffer = await readFile(file.filepath);
      console.log('File read successfully, size:', buffer.length);

      // Check if environment variables are set
      if (!process.env.FORM_ENDPOINT || !process.env.FORM_MODELID || !process.env.FORM_API_KEY) {
        return res.status(500).json({ error: 'Missing required environment variables' });
      }

      const azureEndpoint = `${process.env.FORM_ENDPOINT}/documentModels/${process.env.FORM_MODELID}:analyze?api-version=2023-07-31`;
      
      console.log('Calling Azure endpoint:', azureEndpoint);

      const azureRes = await fetch(azureEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Ocp-Apim-Subscription-Key': process.env.FORM_API_KEY,
        },
        body: buffer,
      });

      console.log('Azure response status:', azureRes.status);

      if (!azureRes.ok) {
        const errorText = await azureRes.text();
        console.error('Azure API error:', errorText);
        return res.status(azureRes.status).json({ 
          error: 'Azure API error', 
          status: azureRes.status,
          body: errorText 
        });
      }

      const location = azureRes.headers.get('operation-location');
      if (!location) {
        const errorText = await azureRes.text();
        console.error('Missing operation-location header');
        return res.status(500).json({ error: 'Missing operation-location header', body: errorText });
      }

      console.log('Polling location:', location);

      // Poll until analysis completes with better error handling
      for (let i = 0; i < 30; i++) { // Increased attempts
        await new Promise(r => setTimeout(r, 2000));

        try {
          const pollRes = await fetch(location, {
            headers: { 'Ocp-Apim-Subscription-Key': process.env.FORM_API_KEY },
          });

          if (!pollRes.ok) {
            const errorText = await pollRes.text();
            console.error('Polling error:', errorText);
            return res.status(pollRes.status).json({ 
              error: 'Polling failed', 
              status: pollRes.status,
              body: errorText 
            });
          }

          const pollData = await pollRes.json();
          console.log('Poll attempt', i + 1, 'Status:', pollData.status);

          if (pollData.status === 'succeeded') {
            // Clean up temporary file
            try {
              fs.unlinkSync(file.filepath);
            } catch (unlinkErr) {
              console.warn('Could not delete temp file:', unlinkErr.message);
            }
            
            return res.status(200).json(pollData);
          } else if (pollData.status === 'failed') {
            return res.status(500).json({ error: 'Azure analysis failed', details: pollData });
          }
          // Continue polling if status is 'running' or 'notStarted'
        } catch (pollError) {
          console.error('Polling request failed:', pollError);
          return res.status(500).json({ error: 'Polling request failed', details: pollError.message });
        }
      }

      return res.status(500).json({ error: 'Timed out waiting for result after 60 seconds' });
    } catch (e) {
      console.error('Unexpected error:', e);
      return res.status(500).json({ error: e.message || 'Unexpected server error' });
    }
  });
}