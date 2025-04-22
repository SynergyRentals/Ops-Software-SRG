import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Plus, UploadCloud } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProperties, useProperty } from "@/hooks/use-properties";
import { PropertyTable } from "@/components/properties/property-table";
import { PropertyForm } from "@/components/properties/property-form";
import { CsvImport } from "@/components/properties/csv-import";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Properties() {
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("list");
  const [editPropertyId, setEditPropertyId] = useState<number | null>(null);
  const { data: properties, isLoading } = useProperties();
  const { data: editProperty, isLoading: propertyLoading } = useProperty(editPropertyId || 0);

  // Parse URL params to determine which tab to show
  useEffect(() => {
    const searchParams = new URLSearchParams(location.split('?')[1] || '');
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    
    console.log("URL params:", { action, id, location });
    
    if (action === 'create') {
      setActiveTab('create');
      setEditPropertyId(null);
    } else if (action === 'import') {
      setActiveTab('import');
    } else if (action === 'edit' && id) {
      const propertyId = parseInt(id);
      console.log("Setting edit property ID:", propertyId);
      setEditPropertyId(propertyId);
      setActiveTab('edit');
    } else if (id && !action) {
      // Handle case where only ID is in URL (from dashboard)
      const propertyId = parseInt(id);
      console.log("Setting edit property ID from just id param:", propertyId);
      setEditPropertyId(propertyId);
      setActiveTab('edit');
    } else if (!action) {
      setActiveTab('list');
      setEditPropertyId(null);
    }
  }, [location]);

  const handleCreateProperty = () => {
    navigate('/properties?action=create');
  };

  const handleImportCsv = () => {
    setActiveTab('import');
    navigate('/properties?action=import');
  };

  const handlePropertyCreated = () => {
    navigate('/properties');
  };

  return (
    <MainLayout title="Properties">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Properties</h1>
          <p className="text-muted-foreground">Manage your short-term rental properties</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={handleImportCsv}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={handleCreateProperty}>
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(tab) => {
        if (tab === 'list') {
          navigate('/properties');
        } else if (tab === 'create') {
          navigate('/properties?action=create');
        } else if (tab === 'import') {
          navigate('/properties?action=import');
        }
      }} className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Properties List</TabsTrigger>
          <TabsTrigger value="create">Add Property</TabsTrigger>
          <TabsTrigger value="import">Import CSV</TabsTrigger>
          {editPropertyId && (
            <TabsTrigger value="edit">Edit Property</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="list">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <div className="border rounded-md">
                    <div className="h-8 border-b flex">
                      {Array(5).fill(0).map((_, i) => (
                        <Skeleton key={i} className="h-4 w-24 m-2" />
                      ))}
                    </div>
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="h-12 border-b flex">
                        {Array(5).fill(0).map((_, j) => (
                          <Skeleton key={j} className="h-4 w-24 m-4" />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <PropertyTable data={properties || []} />
          )}
        </TabsContent>
        
        <TabsContent value="create">
          <PropertyForm onSuccess={handlePropertyCreated} />
        </TabsContent>
        
        <TabsContent value="edit">
          {propertyLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : editProperty ? (
            <PropertyForm property={editProperty} onSuccess={handlePropertyCreated} />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Property not found</p>
                <div className="flex justify-center mt-4">
                  <Button onClick={() => navigate('/properties')}>
                    Back to Properties
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="import">
          <CsvImport onSuccess={handlePropertyCreated} />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
