import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, ShoppingCart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInventoryItems, useAutoPurchase } from "@/hooks/use-inventory";
import { InventoryTable } from "@/components/inventory/inventory-table";
import { StockAlerts } from "@/components/inventory/stock-alerts";
import { AddItemDialog } from "@/components/inventory/add-item-dialog";
import { InventoryItem } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Inventory() {
  const [activeTab, setActiveTab] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | undefined>(undefined);
  const { data: inventoryItems, isLoading } = useInventoryItems();
  const autoPurchase = useAutoPurchase();

  const handleAddItem = () => {
    setEditItem(undefined);
    setShowAddDialog(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditItem(item);
    setShowAddDialog(true);
  };

  const handleAutoPurchase = () => {
    if (window.confirm("Are you sure you want to automatically purchase all items below threshold?")) {
      autoPurchase.mutate();
    }
  };

  return (
    <MainLayout title="Inventory">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Inventory Management</h1>
          <p className="text-muted-foreground">Track supplies and manage inventory across properties</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleAutoPurchase}
            disabled={autoPurchase.isPending}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Auto-Purchase
          </Button>
          <Button onClick={handleAddItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center">
            Low Stock
            {inventoryItems?.some(item => item.currentStock < item.threshold) && (
              <span className="ml-2 flex h-2 w-2 rounded-full bg-red-600"></span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
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
            <InventoryTable 
              data={inventoryItems || []}
              onEdit={handleEditItem}
            />
          )}
        </TabsContent>
        
        <TabsContent value="alerts">
          <StockAlerts />
        </TabsContent>
      </Tabs>

      {/* Add/Edit Item Dialog */}
      <AddItemDialog 
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        editItem={editItem}
      />
    </MainLayout>
  );
}
