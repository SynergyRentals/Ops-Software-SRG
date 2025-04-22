import { Request, Response } from 'express';
import { storage } from '../storage';
import { InsertInventoryItem, InsertSupplyRequest, InsertSupplyRequestItem } from '@shared/schema';

// Get all inventory items with optional property filter
export async function getInventoryItems(req: Request, res: Response) {
  try {
    const propertyId = req.query.propertyId ? Number(req.query.propertyId) : undefined;
    const items = await storage.getInventoryItems(propertyId);
    
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({ message: 'Failed to fetch inventory items', error: error.message });
  }
}

// Get a specific inventory item by ID
export async function getInventoryItem(req: Request, res: Response) {
  try {
    const itemId = Number(req.params.id);
    const item = await storage.getInventoryItem(itemId);
    
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    res.status(200).json(item);
  } catch (error) {
    console.error(`Error fetching inventory item ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch inventory item', error: error.message });
  }
}

// Create a new inventory item
export async function createInventoryItem(req: Request, res: Response) {
  try {
    const { name, sku, currentStock, threshold, propertyId, category } = req.body;
    
    // Validate property exists if assigned to a property
    if (propertyId) {
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(400).json({ message: 'Invalid property ID' });
      }
    }
    
    const itemData: InsertInventoryItem = {
      name,
      sku,
      currentStock: currentStock || 0,
      threshold: threshold || 5,
      propertyId: propertyId || null,
      category: category || null
    };
    
    const item = await storage.createInventoryItem(itemData);
    
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating inventory item:', error);
    res.status(500).json({ message: 'Failed to create inventory item', error: error.message });
  }
}

// Update an inventory item
export async function updateInventoryItem(req: Request, res: Response) {
  try {
    const itemId = Number(req.params.id);
    const item = await storage.getInventoryItem(itemId);
    
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    const { name, sku, currentStock, threshold, propertyId, category } = req.body;
    
    // Validate property exists if changing property
    if (propertyId !== undefined && propertyId !== item.propertyId) {
      if (propertyId) {
        const property = await storage.getProperty(propertyId);
        if (!property) {
          return res.status(400).json({ message: 'Invalid property ID' });
        }
      }
    }
    
    const updateData: Partial<InsertInventoryItem> = {};
    
    if (name !== undefined) updateData.name = name;
    if (sku !== undefined) updateData.sku = sku;
    if (currentStock !== undefined) updateData.currentStock = currentStock;
    if (threshold !== undefined) updateData.threshold = threshold;
    if (propertyId !== undefined) updateData.propertyId = propertyId;
    if (category !== undefined) updateData.category = category;
    
    const updatedItem = await storage.updateInventoryItem(itemId, updateData);
    
    res.status(200).json(updatedItem);
  } catch (error) {
    console.error(`Error updating inventory item ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to update inventory item', error: error.message });
  }
}

// Delete an inventory item
export async function deleteInventoryItem(req: Request, res: Response) {
  try {
    const itemId = Number(req.params.id);
    const item = await storage.getInventoryItem(itemId);
    
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    
    await storage.deleteInventoryItem(itemId);
    
    res.status(200).json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error(`Error deleting inventory item ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to delete inventory item', error: error.message });
  }
}

// Get low stock inventory items
export async function getLowStockItems(req: Request, res: Response) {
  try {
    const items = await storage.getLowStockItems();
    
    res.status(200).json(items);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ message: 'Failed to fetch low stock items', error: error.message });
  }
}

// Handle supply request (QR-triggered)
export async function createSupplyRequest(req: Request, res: Response) {
  try {
    const { propertyId, requestedBy, items } = req.body;
    
    // Validate property exists
    const property = await storage.getProperty(propertyId);
    if (!property) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }
    
    // Validate user exists
    const user = await storage.getUser(requestedBy);
    if (!user) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Validate items exist
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Supply request must include at least one item' });
    }
    
    // Validate each item exists
    for (const item of items) {
      const inventoryItem = await storage.getInventoryItem(item.itemId);
      if (!inventoryItem) {
        return res.status(400).json({ message: `Invalid item ID: ${item.itemId}` });
      }
    }
    
    // Create supply request
    const requestData: InsertSupplyRequest = {
      propertyId,
      requestedBy,
      status: 'pending'
    };
    
    // Create request items
    const requestItems: InsertSupplyRequestItem[] = items.map(item => ({
      requestId: 0, // This will be set by createSupplyRequest
      itemId: item.itemId,
      quantity: item.quantity || 1
    }));
    
    const request = await storage.createSupplyRequest(requestData, requestItems);
    
    res.status(201).json({
      message: 'Supply request created successfully',
      request
    });
  } catch (error) {
    console.error('Error creating supply request:', error);
    res.status(500).json({ message: 'Failed to create supply request', error: error.message });
  }
}

// Automatic purchase when threshold is reached
export async function triggerAutoPurchase(req: Request, res: Response) {
  try {
    const lowStockItems = await storage.getLowStockItems();
    
    if (lowStockItems.length === 0) {
      return res.status(200).json({
        message: 'No items require purchasing at this time',
        itemsPurchased: 0
      });
    }
    
    // In a real implementation, this would connect to a purchasing system
    // For this example, we'll just update the stock levels
    
    const updatedItems = await Promise.all(
      lowStockItems.map(async item => {
        const restockAmount = item.threshold * 2; // Simple restock logic
        return await storage.updateInventoryItem(item.id, {
          currentStock: item.currentStock + restockAmount
        });
      })
    );
    
    res.status(200).json({
      message: 'Auto-purchase completed successfully',
      itemsPurchased: lowStockItems.length,
      updatedItems
    });
  } catch (error) {
    console.error('Error triggering auto-purchase:', error);
    res.status(500).json({ message: 'Failed to trigger auto-purchase', error: error.message });
  }
}
