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
    maxFileSize: 50 * 1024 * 1024
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parsing error:', err);
      return res.status(500).json({ error: 'Error parsing file', detail: err.message });
    }

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!file?.filepath) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      const buffer = await readFile(file.filepath);
      console.log('File read successfully, size:', buffer.length);

      // Check environment variables
      const endpoint = process.env.FORM_ENDPOINT;
      const modelId = process.env.FORM_MODELID;
      const apiKey = process.env.FORM_API_KEY;

      console.log('Environment check:');
      console.log('- FORM_ENDPOINT:', endpoint ? 'SET' : 'MISSING');
      console.log('- FORM_MODELID:', modelId ? 'SET' : 'MISSING');
      console.log('- FORM_API_KEY:', apiKey ? 'SET (length: ' + apiKey.length + ')' : 'MISSING');

      if (!endpoint || !modelId || !apiKey) {
        return res.status(500).json({ 
          error: 'Missing required environment variables',
          details: {
            endpoint: !!endpoint,
            modelId: !!modelId,
            apiKey: !!apiKey
          }
        });
      }

      // Try different endpoint patterns
      const baseEndpoint = endpoint.replace(/\/$/, '');
      const endpointVariations = [
        `${baseEndpoint}/formrecognizer/documentModels/${modelId}:analyze?api-version=2023-07-31`,
        `${baseEndpoint}/documentModels/${modelId}:analyze?api-version=2023-07-31`,
        `${baseEndpoint}/formrecognizer/documentModels/${modelId}:analyze?api-version=2022-08-31`,
        `${baseEndpoint}/documentModels/${modelId}:analyze?api-version=2022-08-31`
      ];

      console.log('Trying endpoint variations:');
      
      for (let i = 0; i < endpointVariations.length; i++) {
        const testEndpoint = endpointVariations[i];
        console.log(`Attempt ${i + 1}: ${testEndpoint}`);

        try {
          const azureRes = await fetch(testEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/octet-stream',
              'Ocp-Apim-Subscription-Key': apiKey,
            },
            body: buffer,
          });

          console.log(`Response status: ${azureRes.status}`);

          if (azureRes.status === 202) {
            // Success! Get the operation location
            const location = azureRes.headers.get('operation-location');
            if (!location) {
              return res.status(500).json({ error: 'Missing operation-location header' });
            }

            console.log('Success! Polling location:', location);

            // Poll for results
            for (let j = 0; j < 30; j++) {
              await new Promise(r => setTimeout(r, 2000));

              const pollRes = await fetch(location, {
                headers: { 'Ocp-Apim-Subscription-Key': apiKey },
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
              console.log('Poll attempt', j + 1, 'Status:', pollData.status);

              if (pollData.status === 'succeeded') {
                // Clean up temp file
                try {
                  fs.unlinkSync(file.filepath);
                } catch (unlinkErr) {
                  console.warn('Could not delete temp file:', unlinkErr.message);
                }
                
                return res.status(200).json({
                  success: true,
                  workingEndpoint: testEndpoint,
                  result: pollData
                });
              } else if (pollData.status === 'failed') {
                return res.status(500).json({ 
                  error: 'Azure analysis failed', 
                  details: pollData 
                });
              }
            }

            return res.status(500).json({ error: 'Timed out waiting for result' });
          
          } else if (azureRes.status === 404) {
            const errorText = await azureRes.text();
            console.log(`404 error with endpoint ${i + 1}:`, errorText);
            
            // Continue to next endpoint variation
            continue;
          } else {
            const errorText = await azureRes.text();
            console.error(`Error with endpoint ${i + 1}:`, errorText);
            
            // For non-404 errors, return immediately
            return res.status(azureRes.status).json({ 
              error: 'Azure API error', 
              status: azureRes.status,
              body: errorText,
              endpoint: testEndpoint
            });
          }
        } catch (fetchError) {
          console.error(`Fetch error with endpoint ${i + 1}:`, fetchError.message);
          continue;
        }
      }

      // If we get here, all endpoints failed
      return res.status(404).json({ 
        error: 'All endpoint variations failed with 404',
        tried: endpointVariations,
        suggestion: 'Please check your model ID and endpoint configuration'
      });

    } catch (e) {
      console.error('Unexpected error:', e);
      return res.status(500).json({ error: e.message || 'Unexpected server error' });
    }
  });
}