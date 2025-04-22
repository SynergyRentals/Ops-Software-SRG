import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLowStockItems } from "@/hooks/use-inventory";
import { getInventoryStatusClass, getInventoryStatusText } from "@/lib/utils";
import { AlertTriangle, RefreshCcw, ShoppingCart } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAutoPurchase } from "@/hooks/use-inventory";
import { Skeleton } from "@/components/ui/skeleton";

export function InventoryOverview() {
  const { data: lowStockItems, isLoading } = useLowStockItems();
  const autoPurchase = useAutoPurchase();

  const handleAutoPurchase = () => {
    if (window.confirm("Are you sure you want to auto-purchase low stock items?")) {
      autoPurchase.mutate();
    }
  };

  if (isLoading) {
    return <InventoryOverviewSkeleton />;
  }

  const criticalItems = lowStockItems?.filter(
    item => item.currentStock < item.threshold / 2
  ) || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Inventory Overview</CardTitle>
        <Button 
          size="sm" 
          onClick={handleAutoPurchase}
          disabled={!lowStockItems?.length || autoPurchase.isPending}
        >
          {autoPurchase.isPending ? (
            <>
              <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add Items
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {criticalItems.length > 0 && (
            <div className="border-l-4 border-red-400 bg-red-50 dark:bg-red-950/20 p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Low Stock Alert</h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>{criticalItems.length} items below threshold require attention</p>
                  </div>
                  <div className="mt-3">
                    <div className="-mx-2 -my-1.5 flex">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={handleAutoPurchase}
                        className="bg-red-50 dark:bg-red-950/40 px-2 py-1.5 text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/50"
                      >
                        Order Supplies
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 rounded-lg">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Threshold</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!lowStockItems?.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      All inventory items are well-stocked
                    </TableCell>
                  </TableRow>
                ) : (
                  lowStockItems.slice(0, 4).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.currentStock}</TableCell>
                      <TableCell className="text-right">{item.threshold}</TableCell>
                      <TableCell className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getInventoryStatusClass(item.currentStock, item.threshold)}`}>
                          {getInventoryStatusText(item.currentStock, item.threshold)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      <div className="bg-muted/30 px-4 py-4 sm:px-6 rounded-b-lg">
        <div className="text-sm">
          <a href="/inventory" className="font-medium text-primary hover:text-primary/80">
            View full inventory
            <span aria-hidden="true"> &rarr;</span>
          </a>
        </div>
      </div>
    </Card>
  );
}

function InventoryOverviewSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-9 w-28" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          <div className="overflow-hidden shadow rounded-lg">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead><Skeleton className="h-4 w-20" /></TableHead>
                  <TableHead className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableHead>
                  <TableHead className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableHead>
                  <TableHead className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array(4).fill(0).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      <div className="bg-muted/30 px-4 py-4 sm:px-6 rounded-b-lg">
        <Skeleton className="h-4 w-36" />
      </div>
    </Card>
  );
}
