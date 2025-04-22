import { useLowStockItems, useAutoPurchase } from "@/hooks/use-inventory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShoppingCart, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getInventoryStatusClass } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function StockAlerts() {
  const { data: lowStockItems, isLoading } = useLowStockItems();
  const autoPurchase = useAutoPurchase();

  const handleAutoPurchase = () => {
    if (window.confirm("Are you sure you want to auto-purchase all items below threshold?")) {
      autoPurchase.mutate();
    }
  };

  if (isLoading) {
    return <StockAlertsSkeleton />;
  }

  const criticalItems = lowStockItems && Array.isArray(lowStockItems)
    ? lowStockItems.filter(item => item.currentStock < item.threshold / 2)
    : [];

  const lowItems = lowStockItems && Array.isArray(lowStockItems)
    ? lowStockItems.filter(item => item.currentStock >= item.threshold / 2 && item.currentStock < item.threshold)
    : [];

  if (!lowStockItems?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-300">All items well stocked</h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                  <p>There are no inventory items that require attention at this time.</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Stock Alerts</CardTitle>
        <Button 
          size="sm"
          disabled={autoPurchase.isPending || !lowStockItems.length}
          onClick={handleAutoPurchase}
        >
          {autoPurchase.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Order All
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {criticalItems.length > 0 && (
          <div className="border-l-4 border-red-400 bg-red-50 dark:bg-red-950/20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Critical Stock Alert</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                  <p>{criticalItems.length} items are critically low and need immediate attention</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {lowItems.length > 0 && (
          <div className="border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Low Stock Alert</h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                  <p>{lowItems.length} items are below threshold and should be reordered soon</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="divide-y divide-border">
          {lowStockItems.map(item => (
            <div key={item.id} className="py-3">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-foreground">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {item.currentStock} / {item.threshold}
                    </p>
                    <p className="text-xs text-muted-foreground">Current / Threshold</p>
                  </div>
                  <Badge 
                    variant="outline"
                    className={getInventoryStatusClass(item.currentStock, item.threshold)}
                  >
                    {item.currentStock < item.threshold / 2 ? 'Critical' : 'Low'}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StockAlertsSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-9 w-24" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="divide-y divide-border">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="py-3">
              <div className="flex justify-between items-center">
                <div>
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <Skeleton className="h-5 w-16 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
