"use client";

import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function BulkUploadMock() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="h-4 w-4" />
          CSV Bulk Upload
        </CardTitle>
        <CardDescription>
          Import multiple broker leads from a spreadsheet. Parsing will be enabled in a future release.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="outline" disabled>
          Choose CSV File (Coming Soon)
        </Button>
      </CardContent>
    </Card>
  );
}
