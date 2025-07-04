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
    maxFileSize: 4 * 1024 * 1024 
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

      if (!process.env.FORM_ENDPOINT || !process.env.FORM_MODELID || !process.env.FORM_API_KEY) {
        return res.status(500).json({ error: 'Missing required environment variables' });
      }

      const baseEndpoint = process.env.FORM_ENDPOINT.replace(/\/$/, '');
      const azureEndpoint = `${baseEndpoint}/formrecognizer/documentModels/${process.env.FORM_MODELID}:analyze?api-version=2023-07-31`;
      
      console.log('Calling Azure endpoint:', azureEndpoint);
      console.log('Using model ID:', process.env.FORM_MODELID);

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

      for (let i = 0; i < 30; i++) {
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
            try {
              fs.unlinkSync(file.filepath);
            } catch (unlinkErr) {
              console.warn('Could not delete temp file:', unlinkErr.message);
            }
            
            const document = pollData.analyzeResult?.documents?.[0];
            const labels = {};
            const tables = [];
            
            if (document?.fields) {
              Object.entries(document.fields).forEach(([key, field]) => {
                let value = null;
                

                if (field.type === 'string') {
                  value = field.value || field.content || null;
                } else if (field.type === 'number') {
                  value = field.value;
                } else if (field.type === 'date') {
                  value = field.value;
                } else if (field.type === 'array') {
                  if (field.valueArray && field.valueArray.length > 0) {
                    value = field.valueArray.map(item => {
                      if (item.valueObject) {
                        const obj = {};
                        Object.entries(item.valueObject).forEach(([subKey, subField]) => {
                          obj[subKey] = subField.value || subField.content || null;
                        });
                        return obj;
                      }
                      return item.value || item.content || null;
                    });
                  }
                } else if (field.type === 'object') {
                  if (field.valueObject) {
                    const obj = {};
                    Object.entries(field.valueObject).forEach(([subKey, subField]) => {
                      obj[subKey] = subField.value || subField.content || null;
                    });
                    value = obj;
                  }
                } else {
                  value = field.value || field.content || null;
                }
                
                labels[key] = {
                  value: value,
                  confidence: field.confidence || null,
                  type: field.type || null
                };
              });
            }
            
            if (pollData.analyzeResult?.tables) {
              pollData.analyzeResult.tables.forEach(table => {
                const cleanTable = {
                  rows: table.rowCount,
                  columns: table.columnCount,
                  data: [],
                  caption: table.caption || null
                };
                
                for (let r = 0; r < table.rowCount; r++) {
                  cleanTable.data[r] = new Array(table.columnCount).fill('');
                }
                
                table.cells.forEach(cell => {
                  if (cell.rowIndex < table.rowCount && cell.columnIndex < table.columnCount) {
                    cleanTable.data[cell.rowIndex][cell.columnIndex] = cell.content || '';
                  }
                });
                
                tables.push(cleanTable);
              });
            }
            
            const cleanResponse = {
              labels,
              tables,
              modelId: pollData.analyzeResult?.modelId || null,
              confidence: document?.confidence || null,
              // Include raw response for debugging
              rawResponse: pollData.analyzeResult
            };
            
            console.log('Processed labels:', Object.keys(labels));
            console.log('Processed tables:', tables.length);
            
            return res.status(200).json(cleanResponse);
          } else if (pollData.status === 'failed') {
            return res.status(500).json({ error: 'Azure analysis failed', details: pollData });
          }
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