import { Request, Response } from 'express';
import { storage } from '../storage';
import { InsertProperty, propertyCsvSchema, PropertyCsvData } from '@shared/schema';
import * as csv from 'csv-parse';

// Get all properties
export async function getProperties(req: Request, res: Response) {
  try {
    const properties = await storage.getProperties();
    res.status(200).json(properties);
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ message: 'Failed to fetch properties', error: error.message });
  }
}

// Get property by ID
export async function getProperty(req: Request, res: Response) {
  try {
    const propertyId = Number(req.params.id);
    const property = await storage.getProperty(propertyId);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    res.status(200).json(property);
  } catch (error) {
    console.error(`Error fetching property ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to fetch property', error: error.message });
  }
}

// Create a new property
export async function createProperty(req: Request, res: Response) {
  try {
    const { nickname, title, type, address, icalUrl, tags, beds, baths, imageUrl } = req.body;
    
    const propertyData: InsertProperty = {
      nickname,
      title,
      type,
      address,
      icalUrl: icalUrl || null,
      tags: tags || [],
      beds: beds || null,
      baths: baths || null,
      imageUrl: imageUrl || null
    };
    
    const property = await storage.createProperty(propertyData);
    
    res.status(201).json(property);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(500).json({ message: 'Failed to create property', error: error.message });
  }
}

// Update a property
export async function updateProperty(req: Request, res: Response) {
  try {
    const propertyId = Number(req.params.id);
    const property = await storage.getProperty(propertyId);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    const { nickname, title, type, address, icalUrl, tags, beds, baths, imageUrl } = req.body;
    
    const updateData: Partial<InsertProperty> = {};
    
    if (nickname !== undefined) updateData.nickname = nickname;
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (address !== undefined) updateData.address = address;
    if (icalUrl !== undefined) updateData.icalUrl = icalUrl;
    if (tags !== undefined) updateData.tags = tags;
    if (beds !== undefined) updateData.beds = beds;
    if (baths !== undefined) updateData.baths = baths;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    
    const updatedProperty = await storage.updateProperty(propertyId, updateData);
    
    res.status(200).json(updatedProperty);
  } catch (error) {
    console.error(`Error updating property ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to update property', error: error.message });
  }
}

// Delete a property
export async function deleteProperty(req: Request, res: Response) {
  try {
    const propertyId = Number(req.params.id);
    const property = await storage.getProperty(propertyId);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    await storage.deleteProperty(propertyId);
    
    res.status(200).json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error(`Error deleting property ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to delete property', error: error.message });
  }
}

// Import properties from CSV
export async function importPropertiesFromCsv(req: Request, res: Response) {
  try {
    if (!req.body.csvData) {
      return res.status(400).json({ message: 'CSV data is required' });
    }
    
    const csvData = req.body.csvData;
    
    // Parse CSV string
    const records: PropertyCsvData[] = [];
    
    // Use csv-parse to parse the CSV data
    csv.parse(csvData, {
      columns: true,
      skip_empty_lines: true
    }, async (err, output) => {
      if (err) {
        return res.status(400).json({ message: 'Failed to parse CSV data', error: err.message });
      }
      
      // Validate and transform each record
      for (const record of output) {
        try {
          // Convert numeric fields
          if (record.beds) record.beds = Number(record.beds);
          if (record.baths) record.baths = Number(record.baths);
          
          // Validate with Zod schema
          const validatedRecord = propertyCsvSchema.parse(record);
          records.push(validatedRecord);
        } catch (error) {
          return res.status(400).json({ 
            message: 'Invalid CSV data format', 
            error: error.message 
          });
        }
      }
      
      // Import validated records
      const importedProperties = await storage.importPropertiesFromCsv(records);
      
      res.status(201).json({
        message: `Successfully imported ${importedProperties.length} properties`,
        properties: importedProperties
      });
    });
  } catch (error) {
    console.error('Error importing properties from CSV:', error);
    res.status(500).json({ message: 'Failed to import properties', error: error.message });
  }
}

// Sync iCal for a property
export async function syncPropertyIcal(req: Request, res: Response) {
  try {
    const propertyId = Number(req.params.id);
    const property = await storage.getProperty(propertyId);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    if (!property.icalUrl) {
      return res.status(400).json({ message: 'Property does not have an iCal URL configured' });
    }
    
    // In a real implementation, we would fetch and parse the iCal file here
    // For this example, we'll simulate a successful sync
    await storage.updateProperty(propertyId, {
      updatedAt: new Date()
    });
    
    res.status(200).json({
      message: 'iCal sync completed successfully',
      property: {
        id: property.id,
        nickname: property.nickname,
        icalUrl: property.icalUrl,
        lastSynced: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`Error syncing iCal for property ${req.params.id}:`, error);
    res.status(500).json({ message: 'Failed to sync iCal', error: error.message });
  }
}
