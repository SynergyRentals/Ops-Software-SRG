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
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and, lt, asc, desc, isNull, inArray } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

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

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Will fix typing issue

  constructor() {
    // Initialize session store with PostgreSQL
    import('connect-pg-simple').then(connectPgModule => {
      const connectPg = connectPgModule.default;
      import('express-session').then(sessionModule => {
        const session = sessionModule.default;
        const PostgresStore = connectPg(session);
        
        this.sessionStore = new PostgresStore({
          pool: pool,
          createTableIfMissing: true
        });
      });
    });
    
    // Initialize with a temporary memory store while imports are loading
    const MemoryStore = new Map();
    this.sessionStore = {
      get: (sid, cb) => cb(null, MemoryStore.get(sid)),
      set: (sid, sess, cb) => { MemoryStore.set(sid, sess); cb(); },
      destroy: (sid, cb) => { MemoryStore.delete(sid); cb(); }
    };
  }

  // User Methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return !!result;
  }

  // Property Methods
  async getProperty(id: number): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property || undefined;
  }

  async getProperties(): Promise<Property[]> {
    return await db.select().from(properties);
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const [property] = await db.insert(properties).values(insertProperty).returning();
    return property;
  }

  async updateProperty(id: number, propertyData: Partial<InsertProperty>): Promise<Property | undefined> {
    const [property] = await db
      .update(properties)
      .set({
        ...propertyData,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, id))
      .returning();
    
    return property || undefined;
  }

  async deleteProperty(id: number): Promise<boolean> {
    const result = await db.delete(properties).where(eq(properties.id, id));
    return !!result;
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
    const [task] = await db
      .select()
      .from(maintenanceTasks)
      .where(eq(maintenanceTasks.id, id));
    
    return task || undefined;
  }

  async getMaintenanceTasks(filters?: { propertyId?: number, status?: string, urgency?: string }): Promise<MaintenanceTask[]> {
    let query = db.select().from(maintenanceTasks);
    
    if (filters) {
      const conditions = [];
      
      if (filters.propertyId) {
        conditions.push(eq(maintenanceTasks.propertyId, filters.propertyId));
      }
      
      if (filters.status) {
        conditions.push(eq(maintenanceTasks.status, filters.status as any));
      }
      
      if (filters.urgency) {
        conditions.push(eq(maintenanceTasks.urgency, filters.urgency as any));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query;
  }

  async createMaintenanceTask(insertTask: InsertMaintenanceTask): Promise<MaintenanceTask> {
    const [task] = await db
      .insert(maintenanceTasks)
      .values(insertTask)
      .returning();
    
    return task;
  }

  async updateMaintenanceTask(id: number, taskData: Partial<InsertMaintenanceTask>): Promise<MaintenanceTask | undefined> {
    const [task] = await db
      .update(maintenanceTasks)
      .set({
        ...taskData,
        updatedAt: new Date(),
      })
      .where(eq(maintenanceTasks.id, id))
      .returning();
    
    return task || undefined;
  }

  async deleteMaintenanceTask(id: number): Promise<boolean> {
    const result = await db.delete(maintenanceTasks).where(eq(maintenanceTasks.id, id));
    return !!result;
  }

  // Inventory Methods
  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    const [item] = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.id, id));
    
    return item || undefined;
  }

  async getInventoryItems(propertyId?: number): Promise<InventoryItem[]> {
    let query = db.select().from(inventoryItems);
    
    if (propertyId) {
      query = query.where(eq(inventoryItems.propertyId, propertyId));
    }
    
    return await query;
  }

  async createInventoryItem(insertItem: InsertInventoryItem): Promise<InventoryItem> {
    const [item] = await db
      .insert(inventoryItems)
      .values(insertItem)
      .returning();
    
    return item;
  }

  async updateInventoryItem(id: number, itemData: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const [item] = await db
      .update(inventoryItems)
      .set({
        ...itemData,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItems.id, id))
      .returning();
    
    return item || undefined;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    const result = await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
    return !!result;
  }

  async getLowStockItems(): Promise<InventoryItem[]> {
    return await db
      .select()
      .from(inventoryItems)
      .where(lt(inventoryItems.currentStock, inventoryItems.threshold));
  }

  // Supply Request Methods
  async getSupplyRequest(id: number): Promise<SupplyRequest | undefined> {
    const [request] = await db
      .select()
      .from(supplyRequests)
      .where(eq(supplyRequests.id, id));
    
    return request || undefined;
  }

  async getSupplyRequests(propertyId?: number): Promise<SupplyRequest[]> {
    let query = db.select().from(supplyRequests);
    
    if (propertyId) {
      query = query.where(eq(supplyRequests.propertyId, propertyId));
    }
    
    return await query;
  }

  async createSupplyRequest(insertRequest: InsertSupplyRequest, items: InsertSupplyRequestItem[]): Promise<SupplyRequest> {
    // Use a transaction to ensure both the request and items are saved
    return await db.transaction(async (tx) => {
      const [request] = await tx
        .insert(supplyRequests)
        .values(insertRequest)
        .returning();
      
      // Add requestId to items
      const itemsWithRequestId = items.map(item => ({
        ...item,
        requestId: request.id
      }));
      
      // Insert items
      await tx
        .insert(supplyRequestItems)
        .values(itemsWithRequestId);
      
      return request;
    });
  }

  async updateSupplyRequest(id: number, requestData: Partial<InsertSupplyRequest>): Promise<SupplyRequest | undefined> {
    const [request] = await db
      .update(supplyRequests)
      .set({
        ...requestData,
        updatedAt: new Date(),
      })
      .where(eq(supplyRequests.id, id))
      .returning();
    
    return request || undefined;
  }

  async deleteSupplyRequest(id: number): Promise<boolean> {
    // Use a transaction to delete both the request and its items
    return await db.transaction(async (tx) => {
      await tx
        .delete(supplyRequestItems)
        .where(eq(supplyRequestItems.requestId, id));
      
      const result = await tx
        .delete(supplyRequests)
        .where(eq(supplyRequests.id, id));
      
      return !!result;
    });
  }

  // Webhook Methods
  async createWebhookEvent(insertEvent: InsertWebhookEvent): Promise<WebhookEvent> {
    const [event] = await db
      .insert(webhookEvents)
      .values(insertEvent)
      .returning();
    
    return event;
  }

  async getWebhookEvents(processed?: boolean): Promise<WebhookEvent[]> {
    let query = db.select().from(webhookEvents);
    
    if (processed !== undefined) {
      query = query.where(eq(webhookEvents.processed, processed));
    }
    
    return await query;
  }

  async updateWebhookEvent(id: number, eventData: Partial<InsertWebhookEvent>): Promise<WebhookEvent | undefined> {
    const [event] = await db
      .update(webhookEvents)
      .set(eventData)
      .where(eq(webhookEvents.id, id))
      .returning();
    
    return event || undefined;
  }

  // Dashboard Methods
  async getDashboardStats(): Promise<{ propertiesCount: number; pendingTasks: number; completedTasks: number; inventoryAlerts: number; }> {
    // Use raw queries for counting
    const { rows: [propertiesResult] } = await pool.query('SELECT COUNT(*) as count FROM properties');
    const propertiesCount = Number(propertiesResult?.count || 0);
    
    const { rows: [pendingTasksResult] } = await pool.query('SELECT COUNT(*) as count FROM maintenance_tasks WHERE status = $1', ['pending']);
    const pendingTasks = Number(pendingTasksResult?.count || 0);
    
    const { rows: [completedTasksResult] } = await pool.query('SELECT COUNT(*) as count FROM maintenance_tasks WHERE status = $1', ['completed']);
    const completedTasks = Number(completedTasksResult?.count || 0);
    
    const { rows: [inventoryAlertsResult] } = await pool.query('SELECT COUNT(*) as count FROM inventory_items WHERE current_stock < threshold');
    const inventoryAlerts = Number(inventoryAlertsResult?.count || 0);
    
    return {
      propertiesCount,
      pendingTasks,
      completedTasks,
      inventoryAlerts
    };
  }

  // Seed the database with initial data if it's empty
  async seedInitialData() {
    // Check if we have any users
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM users');
    const userCount = Number(rows[0]?.count || 0);
    
    if (userCount === 0) {
      // Create admin user
      await this.createUser({
        username: "admin",
        password: "$2b$10$xRtXMKGIp/55YQVQPv5zSOdalBr5TB1WpP9gV/MCnpYZC4rYGYMN2", // "password"
        email: "admin@example.com",
        role: "admin",
        name: "Administrator"
      });
      
      // Create sample properties
      const property1 = await this.createProperty({
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
      
      const property2 = await this.createProperty({
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
      
      const property3 = await this.createProperty({
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
      await this.createMaintenanceTask({
        title: "HVAC Unit Failure",
        description: "Air conditioning stopped working, needs immediate repair",
        propertyId: property1.id,
        urgency: "high",
        status: "pending",
        dueDate: new Date(),
        source: "manual"
      });
      
      await this.createMaintenanceTask({
        title: "Light Fixtures Replacement",
        description: "Replace living room light fixtures",
        propertyId: property2.id,
        urgency: "medium",
        status: "pending",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        source: "manual"
      });
      
      await this.createMaintenanceTask({
        title: "General Cleaning",
        description: "Scheduled deep cleaning",
        propertyId: property3.id,
        urgency: "low",
        status: "pending",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // next week
        source: "manual"
      });
      
      // Create inventory items
      await this.createInventoryItem({
        name: "Toilet Paper",
        sku: "TP001",
        currentStock: 4,
        threshold: 10,
        category: "Bathroom"
      });
      
      await this.createInventoryItem({
        name: "Hand Soap",
        sku: "HS001",
        currentStock: 7,
        threshold: 8,
        category: "Bathroom"
      });
      
      await this.createInventoryItem({
        name: "Dish Soap",
        sku: "DS001",
        currentStock: 12,
        threshold: 5,
        category: "Kitchen"
      });
      
      await this.createInventoryItem({
        name: "Coffee Filters",
        sku: "CF001",
        currentStock: 3,
        threshold: 6,
        category: "Kitchen"
      });
    }
  }
}

// Create and export an instance of DatabaseStorage
export const storage = new DatabaseStorage();
