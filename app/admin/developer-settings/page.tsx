"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Download, Trash2, Loader2, HardDrive } from "lucide-react";
import { toast } from "sonner";

export default function DeveloperSettingsPage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [deleteUnused, setDeleteUnused] = useState(false);

  const handleDownloadAudios = async () => {
    try {
      setIsDownloading(true);
      toast.info("Processing audio files...", {
        description: "This may take a moment. Please wait.",
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(
        `${apiUrl}/api/developer/download-audios?deleteUnused=${deleteUnused}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to download audio files");
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : "test-audios.zip";

      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Audio files downloaded successfully!", {
        description: deleteUnused 
          ? "Unused audio files have been deleted from the server."
          : "All used audio files have been packaged and downloaded.",
      });
    } catch (error) {
      console.error("Error downloading audios:", error);
      toast.error("Failed to download audio files", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Developer Settings</h1>
        <p className="text-muted-foreground mt-2">
          Advanced settings for system maintenance and data management
        </p>
      </div>

      <div className="grid gap-6">
        {/* Audio Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Audio File Management
            </CardTitle>
            <CardDescription>
              Download all audio files used in tests or clean up unused audio files from the server
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="delete-unused"
                checked={deleteUnused}
                onCheckedChange={(checked) => setDeleteUnused(checked as boolean)}
                disabled={isDownloading}
              />
              <label
                htmlFor="delete-unused"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Delete unused audio files after download
              </label>
            </div>

            {deleteUnused && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                <p className="text-sm text-destructive font-medium flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Warning: This action will permanently delete unused audio files
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Audio files that are not referenced in any test will be removed from the server.
                  Make sure you have a backup if needed.
                </p>
              </div>
            )}

            <Button
              onClick={handleDownloadAudios}
              disabled={isDownloading}
              className="w-full sm:w-auto"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Used Audio Files
                </>
              )}
            </Button>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-semibold mb-2">How it works:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Scans all tests in the database for audio file references</li>
                <li>Collects all unique audio files that are currently in use</li>
                <li>Creates a ZIP archive with all used audio files</li>
                <li>Optionally removes audio files that are not referenced anywhere</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* More sections can be added here in the future */}
      </div>
    </div>
  );
}

