# MCP (Message Client Projects) System

Simple lightweight router that converts extracted message data into client project records.

## Overview

The MCP system provides a clean way to route extracted information from Telegram messages into a dedicated `client_projects` collection for further processing.

## API Endpoint

### POST `/api/mcp/route`

Stores extracted message data as a client project.

**Request Body:**
```json
{
  "messageId": "507f1f77bcf86cd799439011",
  "extracted": {
    "domain": "Web Development",
    "budget": "$10,000",
    "timeline": "3 months"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "messageId": "507f1f77bcf86cd799439011",
    "raw_text": "Original message text",
    "domain": "Web Development",
    "budget": "$10,000",
    "timeline": "3 months",
    "createdAt": "2025-01-30T...",
    "updatedAt": "2025-01-30T..."
  }
}
```

## Database Schema

**Collection:** `client_projects`

```javascript
{
  messageId: String,      // MongoDB _id of source message
  raw_text: String,       // Original message text
  domain: String,         // Extracted domain (optional)
  budget: String,         // Extracted budget (optional)
  timeline: String,       // Extracted timeline (optional)
  createdAt: Date,
  updatedAt: Date
}
```

## Usage Flow

1. Message arrives via Telegram webhook → stored in `messages` collection
2. Extract data using `/api/agent/extract/:messageId` → updates `message.extracted`
3. Route to projects using `/api/mcp/route` → creates `client_projects` entry

## Example

```bash
# Step 1: Extract from message
POST /api/agent/extract/507f1f77bcf86cd799439011

# Step 2: Route to project
POST /api/mcp/route
{
  "messageId": "507f1f77bcf86cd799439011",
  "extracted": {
    "domain": "E-commerce",
    "budget": "$15,000",
    "timeline": "6 weeks"
  }
}
```

## Notes

- All fields in `extracted` are optional
- `raw_text` is automatically copied from the source message
- Simple, no complex business logic - just storage

