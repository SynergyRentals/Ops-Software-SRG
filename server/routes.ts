import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { isAuthenticated, hasRole, isAdmin, validateWebhookSecret } from "./middlewares/authMiddleware";
import { handleSuiteOpWebhook } from "./webhooks/webhookHandlers";
import { handleHostAIWebhook } from "./webhooks/hostai";
import { initWebSocketServer } from "./services/websocketService";

// Controllers
import * as propertyController from "./controllers/propertyController";
import * as maintenanceController from "./controllers/maintenanceController";
import * as inventoryController from "./controllers/inventoryController";
import * as scheduleController from "./controllers/scheduleController";
import * as dashboardController from "./controllers/dashboardController";
import * as taskController from "./controllers/taskController";
import * as taskActions from "./controllers/taskActions";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static HTML pages
  app.get('/property-viewer', (req, res) => {
    res.sendFile('property_viewer.html', { root: './' });
  });
  
  // Serve the WebSocket client test page
  app.get('/ws-client', (req, res) => {
    res.sendFile('tests/ws-client.html', { root: './' });
  });
  // Setup authentication
  await setupAuth(app);
  
  // User routes
  app.get("/api/users", isAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const users = await storage.getUsers();
      
      // Remove passwords from response
      const safeUsers = users.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });
      
      res.json(safeUsers);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching users", error: error.message });
    }
  });
  
  // Dashboard routes
  app.get("/api/dashboard/overview", isAuthenticated, dashboardController.getOverview);
  app.get("/api/dashboard/progress-widgets", isAuthenticated, dashboardController.getProgressWidgets);
  
  // Property routes
  app.get("/api/property", isAuthenticated, propertyController.getProperties);
  app.get("/api/property/:id", isAuthenticated, propertyController.getProperty);
  app.post("/api/property", isAuthenticated, hasRole(["admin", "team"]), propertyController.createProperty);
  app.patch("/api/property/:id", isAuthenticated, hasRole(["admin", "team"]), propertyController.updateProperty);
  app.delete("/api/property/:id", isAuthenticated, hasRole(["admin"]), propertyController.deleteProperty);
  app.post("/api/property/import-csv", isAuthenticated, hasRole(["admin"]), propertyController.importPropertiesFromCsv);
  app.get("/api/property/:id/ical-sync", isAuthenticated, propertyController.syncPropertyIcal);
  app.get("/api/property/:id/ical-events", isAuthenticated, propertyController.getPropertyIcalEvents);
  
  // Maintenance routes
  app.get("/api/maintenance", isAuthenticated, maintenanceController.getMaintenanceTasks);
  app.get("/api/maintenance/:id", isAuthenticated, maintenanceController.getMaintenanceTask);
  app.post("/api/maintenance", isAuthenticated, maintenanceController.createMaintenanceTask);
  app.patch("/api/maintenance/:id", isAuthenticated, maintenanceController.updateMaintenanceTask);
  app.delete("/api/maintenance/:id", isAuthenticated, hasRole(["admin", "team"]), maintenanceController.deleteMaintenanceTask);
  
  // Inventory routes
  app.get("/api/inventory", isAuthenticated, inventoryController.getInventoryItems);
  app.get("/api/inventory/:id", isAuthenticated, inventoryController.getInventoryItem);
  app.post("/api/inventory", isAuthenticated, hasRole(["admin", "team"]), inventoryController.createInventoryItem);
  app.patch("/api/inventory/:id", isAuthenticated, hasRole(["admin", "team"]), inventoryController.updateInventoryItem);
  app.delete("/api/inventory/:id", isAuthenticated, hasRole(["admin"]), inventoryController.deleteInventoryItem);
  app.get("/api/inventory/alerts/low-stock", isAuthenticated, inventoryController.getLowStockItems);
  app.post("/api/inventory/supply-request", isAuthenticated, inventoryController.createSupplyRequest);
  app.post("/api/inventory/auto-purchase", isAuthenticated, hasRole(["admin", "team"]), inventoryController.triggerAutoPurchase);
  
  // Schedule routes
  app.post("/api/schedule", isAuthenticated, scheduleController.getAiScheduleSuggestions);
  app.post("/api/schedule/task", isAuthenticated, scheduleController.createScheduledTask);
  app.get("/api/tasks/:id/suggestions", isAuthenticated, scheduleController.getTaskScheduleSuggestions);
  
  // Task routes
  app.get("/api/tasks", isAuthenticated, taskController.getTasks);
  app.post("/api/tasks", isAuthenticated, taskController.createTask);
  app.get("/api/tasks/:id", isAuthenticated, taskController.getTask);
  app.patch("/api/tasks/:id", isAuthenticated, taskController.updateTask);
  
  // Task action routes
  app.patch("/api/tasks/:id/watch", isAuthenticated, taskActions.watchTask);
  app.patch("/api/tasks/:id/close", isAuthenticated, taskActions.closeTask);
  
  // Webhook routes
  // SuiteOp webhook route with x-webhook-secret header
  app.post("/api/webhooks/suiteop", validateWebhookSecret("suiteop"), handleSuiteOpWebhook);
  
  // HostAI webhook route - no auth required since HostAI doesn't support headers
  app.post("/api/webhooks/hostai", handleHostAIWebhook);
  
  // Add the path that matches the HostAI documentation/requirements
  app.post("/webhooks/hostai", handleHostAIWebhook);
  
  // Alternative simpler webhook endpoint for HostAI - no auth required for backward compatibility
  app.post("/webhook", handleHostAIWebhook);
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize WebSocket server
  initWebSocketServer(httpServer);
  
  return httpServer;
}
