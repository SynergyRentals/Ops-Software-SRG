import { useState, useEffect } from "react";
import { useImportPropertiesFromCsv } from "@/hooks/use-properties";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CsvImportProps {
  onSuccess?: () => void;
}

export function CsvImport({ onSuccess }: CsvImportProps) {
  const [csvData, setCsvData] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const importCsv = useImportPropertiesFromCsv();

  const validateCsv = (data: string): boolean => {
    setIsValidating(true);
    setError("");
    
    try {
      // Check if CSV has content
      if (!data.trim()) {
        setError("CSV data is empty");
        setIsValidating(false);
        return false;
      }
      
      // Check if CSV has headers
      const lines = data.trim().split("\n");
      if (lines.length < 2) {
        setError("CSV must have at least a header row and one data row");
        setIsValidating(false);
        return false;
      }
      
      // Process headers - handle potential quoted CSV fields
      const headerLine = lines[0];
      const headers: string[] = [];
      let currentField = "";
      let inQuotes = false;
      
      for (let i = 0; i < headerLine.length; i++) {
        const char = headerLine[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          headers.push(currentField.trim().toLowerCase());
          currentField = "";
        } else {
          currentField += char;
        }
      }
      
      // Add the last field
      headers.push(currentField.trim().toLowerCase());
      
      // Check for required headers
      const requiredHeaders = ["nickname", "title", "type", "address"];
      
      for (const required of requiredHeaders) {
        if (!headers.includes(required)) {
          setError(`CSV is missing required header: ${required}`);
          setIsValidating(false);
          return false;
        }
      }
      
      // A more lenient check for rows - since complex CSV with quotes and commas can be hard to validate here
      // We'll do a basic check for non-empty rows
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) {
          continue; // Skip empty lines
        }
        
        // Simple check to ensure row has some content
        if (lines[i].split(",").every(field => !field.trim())) {
          setError(`Row ${i+1} appears to be empty`);
          setIsValidating(false);
          return false;
        }
      }
      
      setIsValidating(false);
      return true;
    } catch (err) {
      setError("Error validating CSV: " + (err as Error).message);
      setIsValidating(false);
      return false;
    }
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      setError("Please enter CSV data");
      return;
    }
    
    if (!validateCsv(csvData)) {
      return;
    }
    
    try {
      console.log("Importing CSV data:", csvData.substring(0, 100) + "...");
      const result = await importCsv.mutateAsync(csvData);
      console.log("Import result:", result);
      setError(""); // Clear any previous errors
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("CSV import error:", err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      
      // Try to extract more detailed error information if available
      let detailedError = errorMsg;
      try {
        if (errorMsg.includes('{')) {
          const errorJson = JSON.parse(errorMsg.substring(errorMsg.indexOf('{')));
          if (errorJson.error) {
            detailedError = errorJson.error;
          }
        }
      } catch {
        // If parsing fails, stick with the original error
      }
      
      setError("Error importing CSV: " + detailedError);
    }
  };

  // Clear success message when CSV data changes
  useEffect(() => {
    if (importCsv.isSuccess && csvData) {
      importCsv.reset();
    }
  }, [csvData]);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text');
    setCsvData(pastedText);
  };

  const sampleCsv = `nickname,title,type,address,icalUrl,tags,beds,baths
OceanView,Luxury Beachfront Villa,Beach House,123 Ocean Dr, Malibu CA 90265,https://example.com/calendar.ics,luxury beach family,3,2
MountainRetreat,Cozy Mountain Cabin,Cabin,456 Pine Trail, Aspen CO 81611,https://example.com/cabin.ics,nature hiking mountains,2,1`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Properties from CSV</CardTitle>
        <CardDescription>
          Paste your CSV data below to import multiple properties at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {importCsv.isSuccess && (
          <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/50">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-300">Import Successful</AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-400">
              Successfully imported {importCsv.data?.properties.length} properties
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium">
            CSV Data (Include header row)
          </label>
          <Textarea
            className="h-64 font-mono text-sm"
            placeholder={`Paste your CSV data here. Format:\n${sampleCsv}`}
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            onPaste={handlePaste}
          />
          <p className="text-xs text-muted-foreground">
            Required columns: nickname, title, type, address
            <br />
            Optional columns: icalUrl, tags, beds, baths
          </p>
        </div>
        
        <div className="bg-muted/50 p-4 rounded-md">
          <h4 className="text-sm font-medium mb-2">Sample CSV Format</h4>
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap">{sampleCsv}</pre>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button 
          variant="outline" 
          onClick={() => setCsvData(sampleCsv)}
        >
          Load Sample
        </Button>
        <Button 
          onClick={() => handleImport()} 
          disabled={importCsv.isPending || isValidating || !csvData.trim()}
        >
          {importCsv.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Import Properties
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
