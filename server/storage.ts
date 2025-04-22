import { 
  users, 
  User, 
  InsertUser, 
  properties, 
  Property, 
  InsertProperty, 
  maintenanceTasks, 
  MaintenanceTask, 
  InsertMaintenanceTask, 
  inventoryItems, 
  InventoryItem, 
  InsertInventoryItem, 
  supplyRequests, 
  SupplyRequest, 
  InsertSupplyRequest, 
  supplyRequestItems, 
  SupplyRequestItem, 
  InsertSupplyRequestItem, 
  webhookEvents,
  WebhookEvent,
  InsertWebhookEvent,
  PropertyCsvData
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User Methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Property Methods
  getProperty(id: number): Promise<Property | undefined>;
  getProperties(): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: number, property: Partial<InsertProperty>): Promise<Property | undefined>;
  deleteProperty(id: number): Promise<boolean>;
  importPropertiesFromCsv(properties: PropertyCsvData[]): Promise<Property[]>;
  
  // Maintenance Methods
  getMaintenanceTask(id: number): Promise<MaintenanceTask | undefined>;
  getMaintenanceTasks(filters?: { propertyId?: number, status?: string, urgency?: string }): Promise<MaintenanceTask[]>;
  createMaintenanceTask(task: InsertMaintenanceTask): Promise<MaintenanceTask>;
  updateMaintenanceTask(id: number, task: Partial<InsertMaintenanceTask>): Promise<MaintenanceTask | undefined>;
  deleteMaintenanceTask(id: number): Promise<boolean>;
  
  // Inventory Methods
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  getInventoryItems(propertyId?: number): Promise<InventoryItem[]>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  getLowStockItems(): Promise<InventoryItem[]>;
  
  // Supply Request Methods
  getSupplyRequest(id: number): Promise<SupplyRequest | undefined>;
  getSupplyRequests(propertyId?: number): Promise<SupplyRequest[]>;
  createSupplyRequest(request: InsertSupplyRequest, items: InsertSupplyRequestItem[]): Promise<SupplyRequest>;
  updateSupplyRequest(id: number, request: Partial<InsertSupplyRequest>): Promise<SupplyRequest | undefined>;
  deleteSupplyRequest(id: number): Promise<boolean>;
  
  // Webhook Methods
  createWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent>;
  getWebhookEvents(processed?: boolean): Promise<WebhookEvent[]>;
  updateWebhookEvent(id: number, event: Partial<InsertWebhookEvent>): Promise<WebhookEvent | undefined>;
  
  // Dashboard Methods
  getDashboardStats(): Promise<{
    propertiesCount: number;
    pendingTasks: number;
    completedTasks: number;
    inventoryAlerts: number;
  }>;

  // Session Store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private maintenanceTasks: Map<number, MaintenanceTask>;
  private inventoryItems: Map<number, InventoryItem>;
  private supplyRequests: Map<number, SupplyRequest>;
  private supplyRequestItems: Map<number, SupplyRequestItem[]>;
  private webhookEvents: Map<number, WebhookEvent>;
  
  currentUserId: number;
  currentPropertyId: number;
  currentTaskId: number;
  currentItemId: number;
  currentRequestId: number;
  currentWebhookId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.maintenanceTasks = new Map();
    this.inventoryItems = new Map();
    this.supplyRequests = new Map();
    this.supplyRequestItems = new Map();
    this.webhookEvents = new Map();
    
    this.currentUserId = 1;
    this.currentPropertyId = 1;
    this.currentTaskId = 1;
    this.currentItemId = 1;
    this.currentRequestId = 1;
    this.currentWebhookId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Seed some initial data
    this.seedInitialData();
  }

  private seedInitialData() {
    // Create admin user
    this.createUser({
      username: "admin",
      password: "$2b$10$xRtXMKGIp/55YQVQPv5zSOdalBr5TB1WpP9gV/MCnpYZC4rYGYMN2", // "password"
      email: "admin@example.com",
      role: "admin",
      name: "Administrator"
    });
    
    // Create sample properties
    this.createProperty({
      nickname: "Oceanview Villa",
      title: "Luxury Beachfront Villa",
      type: "Beach House",
      address: "123 Oceanfront Dr, Malibu, CA 90265",
      icalUrl: "https://example.com/calendar/oceanview.ics",
      tags: ["luxury", "beach", "family"],
      beds: 3,
      baths: 2,
      imageUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    });
    
    this.createProperty({
      nickname: "Mountain Retreat",
      title: "Cozy Mountain Cabin",
      type: "Cabin",
      address: "456 Pine Trail, Lake Tahoe, CA 96150",
      icalUrl: "https://example.com/calendar/mountain.ics",
      tags: ["mountains", "cozy", "nature"],
      beds: 2,
      baths: 1,
      imageUrl: "https://images.unsplash.com/photo-1501685532562-aa6846b14a0e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    });
    
    this.createProperty({
      nickname: "City Loft",
      title: "Modern Downtown Loft",
      type: "Apartment",
      address: "789 Market St #500, San Francisco, CA 94103",
      icalUrl: "https://example.com/calendar/cityloft.ics",
      tags: ["urban", "modern", "central"],
      beds: 1,
      baths: 1,
      imageUrl: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
    });
    
    // Create some maintenance tasks
    this.createMaintenanceTask({
      title: "HVAC Unit Failure",
      description: "Air conditioning stopped working, needs immediate repair",
      propertyId: 1,
      urgency: "high",
      status: "pending",
      dueDate: new Date(),
      source: "manual"
    });
    
    this.createMaintenanceTask({
      title: "Light Fixtures Replacement",
      description: "Replace living room light fixtures",
      propertyId: 2,
      urgency: "medium",
      status: "pending",
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      source: "manual"
    });
    
    this.createMaintenanceTask({
      title: "General Cleaning",
      description: "Scheduled deep cleaning",
      propertyId: 3,
      urgency: "low",
      status: "pending",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // next week
      source: "manual"
    });
    
    // Create inventory items
    this.createInventoryItem({
      name: "Toilet Paper",
      sku: "TP001",
      currentStock: 4,
      threshold: 10,
      category: "Bathroom"
    });
    
    this.createInventoryItem({
      name: "Hand Soap",
      sku: "HS001",
      currentStock: 7,
      threshold: 8,
      category: "Bathroom"
    });
    
    this.createInventoryItem({
      name: "Dish Soap",
      sku: "DS001",
      currentStock: 12,
      threshold: 5,
      category: "Kitchen"
    });
    
    this.createInventoryItem({
      name: "Coffee Filters",
      sku: "CF001",
      currentStock: 3,
      threshold: 6,
      category: "Kitchen"
    });
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Property Methods
  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async getProperties(): Promise<Property[]> {
    return Array.from(this.properties.values());
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = this.currentPropertyId++;
    const now = new Date();
    const property: Property = { 
      ...insertProperty, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.properties.set(id, property);
    return property;
  }

  async updateProperty(id: number, propertyData: Partial<InsertProperty>): Promise<Property | undefined> {
    const property = this.properties.get(id);
    if (!property) return undefined;
    
    const updatedProperty = { 
      ...property, 
      ...propertyData, 
      updatedAt: new Date() 
    };
    this.properties.set(id, updatedProperty);
    return updatedProperty;
  }

  async deleteProperty(id: number): Promise<boolean> {
    return this.properties.delete(id);
  }

  async importPropertiesFromCsv(propertiesData: PropertyCsvData[]): Promise<Property[]> {
    const importedProperties: Property[] = [];
    
    for (const data of propertiesData) {
      const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()) : [];
      
      const property = await this.createProperty({
        nickname: data.nickname,
        title: data.title,
        type: data.type,
        address: data.address,
        icalUrl: data.icalUrl || null,
        tags: tagsArray,
        beds: data.beds || null,
        baths: data.baths || null,
        imageUrl: null
      });
      
      importedProperties.push(property);
    }
    
    return importedProperties;
  }

  // Maintenance Methods
  async getMaintenanceTask(id: number): Promise<MaintenanceTask | undefined> {
    return this.maintenanceTasks.get(id);
  }

  async getMaintenanceTasks(filters?: { propertyId?: number, status?: string, urgency?: string }): Promise<MaintenanceTask[]> {
    let tasks = Array.from(this.maintenanceTasks.values());
    
    if (filters) {
      if (filters.propertyId) {
        tasks = tasks.filter(task => task.propertyId === filters.propertyId);
      }
      
      if (filters.status) {
        tasks = tasks.filter(task => task.status === filters.status);
      }
      
      if (filters.urgency) {
        tasks = tasks.filter(task => task.urgency === filters.urgency);
      }
    }
    
    return tasks;
  }

  async createMaintenanceTask(insertTask: InsertMaintenanceTask): Promise<MaintenanceTask> {
    const id = this.currentTaskId++;
    const now = new Date();
    const task: MaintenanceTask = { 
      ...insertTask, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.maintenanceTasks.set(id, task);
    return task;
  }

  async updateMaintenanceTask(id: number, taskData: Partial<InsertMaintenanceTask>): Promise<MaintenanceTask | undefined> {
    const task = this.maintenanceTasks.get(id);
    if (!task) return undefined;
    
    const updatedTask = { 
      ...task, 
      ...taskData, 
      updatedAt: new Date() 
    };
    this.maintenanceTasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteMaintenanceTask(id: number): Promise<boolean> {
    return this.maintenanceTasks.delete(id);
  }

  // Inventory Methods
  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }

  async getInventoryItems(propertyId?: number): Promise<InventoryItem[]> {
    let items = Array.from(this.inventoryItems.values());
    
    if (propertyId) {
      items = items.filter(item => item.propertyId === propertyId);
    }
    
    return items;
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const id = this.currentItemId++;
    const now = new Date();
    const item: InventoryItem = { 
      ...insertItem, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.inventoryItems.set(id, item);
    return item;
  }

  async updateInventoryItem(id: number, itemData: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const item = this.inventoryItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { 
      ...item, 
      ...itemData, 
      updatedAt: new Date() 
    };
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    return this.inventoryItems.delete(id);
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values())
      .filter(item => item.currentStock < item.threshold);
  }

  // Supply Request Methods
  async getSupplyRequest(id: number): Promise<SupplyRequest | undefined> {
    return this.supplyRequests.get(id);
  }

  async getSupplyRequests(propertyId?: number): Promise<SupplyRequest[]> {
    let requests = Array.from(this.supplyRequests.values());
    
    if (propertyId) {
      requests = requests.filter(request => request.propertyId === propertyId);
    }
    
    return requests;
  }

  async createSupplyRequest(insertRequest: InsertSupplyRequest, items: InsertSupplyRequestItem[]): Promise<SupplyRequest> {
    const id = this.currentRequestId++;
    const now = new Date();
    const request: SupplyRequest = { 
      ...insertRequest, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.supplyRequests.set(id, request);
    
    // Store the request items
    this.supplyRequestItems.set(id, items.map(item => ({
      ...item,
      requestId: id
    })));
    
    return request;
  }

  async updateSupplyRequest(id: number, requestData: Partial<InsertSupplyRequest>): Promise<SupplyRequest | undefined> {
    const request = this.supplyRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest = { 
      ...request, 
      ...requestData, 
      updatedAt: new Date() 
    };
    this.supplyRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async deleteSupplyRequest(id: number): Promise<boolean> {
    this.supplyRequestItems.delete(id);
    return this.supplyRequests.delete(id);
  }

  // Webhook Methods
  async createWebhookEvent(insertEvent: InsertWebhookEvent): Promise<WebhookEvent> {
    const id = this.currentWebhookId++;
    const now = new Date();
    const event: WebhookEvent = { 
      ...insertEvent, 
      id, 
      receivedAt: now 
    };
    this.webhookEvents.set(id, event);
    return event;
  }

  async getWebhookEvents(processed?: boolean): Promise<WebhookEvent[]> {
    let events = Array.from(this.webhookEvents.values());
    
    if (processed !== undefined) {
      events = events.filter(event => event.processed === processed);
    }
    
    return events;
  }

  async updateWebhookEvent(id: number, eventData: Partial<InsertWebhookEvent>): Promise<WebhookEvent | undefined> {
    const event = this.webhookEvents.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { 
      ...event, 
      ...eventData 
    };
    this.webhookEvents.set(id, updatedEvent);
    return updatedEvent;
  }

  // Dashboard Methods
  async getDashboardStats(): Promise<{ propertiesCount: number; pendingTasks: number; completedTasks: number; inventoryAlerts: number; }> {
    const propertiesCount = this.properties.size;
    
    const pendingTasks = Array.from(this.maintenanceTasks.values())
      .filter(task => task.status === 'pending').length;
    
    const completedTasks = Array.from(this.maintenanceTasks.values())
      .filter(task => task.status === 'completed').length;
    
    const inventoryAlerts = Array.from(this.inventoryItems.values())
      .filter(item => item.currentStock < item.threshold).length;
    
    return {
      propertiesCount,
      pendingTasks,
      completedTasks,
      inventoryAlerts
    };
  }
}

export const storage = new MemStorage();
