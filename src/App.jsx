// App.jsx
import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const { operationLocation } = await res.json();

      while (true) {
        await new Promise((r) => setTimeout(r, 2000));
        const poll = await fetch(operationLocation, {
          headers: {
            "Ocp-Apim-Subscription-Key": import.meta.env.VITE_FORM_API_KEY,
          },
        });
        const data = await poll.json();
        if (data.status === "succeeded") {
          setResult(data.analyzeResult);
          break;
        }
        if (data.status === "failed") {
          throw new Error("Analysis failed");
        }
      }
    } catch (err) {
      console.error("Error:", err);
      setError("There was a problem analyzing the document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl shadow-xl rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Upload Document</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Choose a file to analyze</Label>
            <Input
              id="file"
              type="file"
              accept=".jpg,.png,.pdf"
              onChange={(e) => setFile(e.target.files[0])}
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading || !file}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Document"
            )}
          </Button>

          {error && (
            <p className="text-red-600 text-sm font-medium">{error}</p>
          )}

          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-1">Document Type:</h3>
              <p className="text-gray-800 mb-3">
                {result.documents?.[0]?.docType || "Unknown"}
              </p>

              <h3 className="text-lg font-semibold mb-1">Extracted Fields:</h3>
              <pre className="bg-gray-50 border rounded-md p-3 text-sm overflow-x-auto">
                {JSON.stringify(result.documents?.[0]?.fields, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default App;

