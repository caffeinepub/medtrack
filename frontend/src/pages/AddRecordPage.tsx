import { MedicalRecordForm } from '../components/MedicalRecordForm';
import { UploadRecordForm } from '../components/UploadRecordForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PlusCircle, Upload } from 'lucide-react';

export function AddRecordPage() {
  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <PlusCircle className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Add Medical Record</h1>
            <p className="text-sm text-muted-foreground">Log a new health measurement or ailment</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="manual">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="manual" className="flex-1 gap-2">
            <PlusCircle className="w-4 h-4" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex-1 gap-2">
            <Upload className="w-4 h-4" />
            Upload Record
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual">
          <Card className="shadow-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Record Details</CardTitle>
              <CardDescription>
                Select a category and fill in the relevant metrics. Fields marked with{' '}
                <span className="text-destructive">*</span> are required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MedicalRecordForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
          <Card className="shadow-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Upload & Extract</CardTitle>
              <CardDescription>
                Upload a PDF or image of your lab report. Dates and test values will be detected
                automatically — review and edit before saving.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadRecordForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
