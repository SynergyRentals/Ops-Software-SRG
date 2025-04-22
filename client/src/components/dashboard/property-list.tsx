import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProperties } from "@/hooks/use-properties";
import { getPropertyTypeClass } from "@/lib/utils";
import { Plus, UploadCloud } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function PropertyList() {
  const [_, navigate] = useLocation();
  const { data: properties, isLoading } = useProperties();

  const handleCreateProperty = () => {
    navigate("/properties?action=create");
  };

  const handleImportCsv = () => {
    navigate("/properties?action=import");
  };

  if (isLoading) {
    return <PropertyListSkeleton />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Properties</CardTitle>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleImportCsv}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button 
            size="sm" 
            onClick={handleCreateProperty}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Property
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>iCal Status</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!properties?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No properties found
                  </TableCell>
                </TableRow>
              ) : (
                properties.slice(0, 3).map((property) => (
                  <TableRow key={property.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 rounded-md">
                          <AvatarImage 
                            src={property.imageUrl || `https://source.unsplash.com/100x100/?property,${property.type}?random=${property.id}`} 
                            alt={property.nickname} 
                          />
                          <AvatarFallback className="rounded-md">{property.nickname.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <div className="font-medium text-foreground">{property.nickname}</div>
                          <div className="text-sm text-muted-foreground">
                            {property.beds} beds · {property.baths} baths
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getPropertyTypeClass(property.type)}>
                        {property.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-foreground">{property.address.split(',')[0]}</div>
                      <div className="text-xs text-muted-foreground">
                        {property.address.split(',').slice(1).join(',')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={property.icalUrl ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"}>
                        {property.icalUrl ? "Connected" : "Not Connected"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <span className="text-primary font-medium">0</span>
                        <span className="mx-2 text-muted-foreground">active</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-muted"></span>
                        <span className="mx-2 text-muted-foreground">0 total</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/properties/${property.id}`)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <div className="bg-muted/30 px-4 py-3 border-t border-border sm:px-6 rounded-b-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium">1</span> to <span className="font-medium">{Math.min(properties?.length || 0, 3)}</span> of <span className="font-medium">{properties?.length || 0}</span> properties
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/properties")}
          >
            View All
          </Button>
        </div>
      </div>
    </Card>
  );
}

function PropertyListSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-6 w-28" />
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-28" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {Array(6).fill(0).map((_, index) => (
                  <TableHead key={index}>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(3).fill(0).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  <TableCell>
                    <div className="flex items-center">
                      <Skeleton className="h-10 w-10 rounded-md" />
                      <div className="ml-4">
                        <Skeleton className="h-4 w-28 mb-2" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <div className="bg-muted/30 px-4 py-3 border-t border-border sm:px-6 rounded-b-lg">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </Card>
  );
}
