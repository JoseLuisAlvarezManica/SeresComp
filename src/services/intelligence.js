
const DocumentIntelligence = require("@azure-rest/ai-document-intelligence").default,
{ getLongRunningPoller, isUnexpected } = require("@azure-rest/ai-document-intelligence");


async function main() {

    const key = import.meta.env.FORM_API_KEY;
    const endpoint = import.meta.env.FORM_ENDPOINT;
    const modelId = import.meta.env.FORM_MODELID;
    const formURL = "YOUR_FORM_URL"
    
    const client = DocumentIntelligence(endpoint, {key:key});
    const initialResponse = await client
        .path("/documentModels/{modelId}:analyze", modelId)
        .post({
            contentType: "application/json",
            body: {
                urlSource: formURL
            },
        });
    
        if (isUnexpected(initialResponse)) {
        throw initialResponse.body.error;
    }

    const poller = getLongRunningPoller(client, initialResponse);
    const analyzeResult = (await poller.pollUntilDone()).body.analyzeResult;


    const documents = analyzeResult?.documents;
    const document = documents && documents[0];

  if (!document) {
    throw new Error("Expected at least one document in the result.");
  }

  console.log(
    "Extracted document:",
    document.docType,
    `(confidence: ${document.confidence || "<undefined>"})`
  );
  console.log("Fields:", document.fields);
}

main().catch((error) => {
  console.error("An error occurred:", error);
  process.exit(1);
});