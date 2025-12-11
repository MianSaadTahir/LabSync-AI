// MCP Resources Registry

import { MCPResource } from '../types.js';

export const resources: MCPResource[] = [];

export function registerResource(resource: MCPResource) {
  resources.push(resource);
}

export function getResource(uri: string): MCPResource | undefined {
  return resources.find(r => r.uri === uri);
}

export function getAllResources(): MCPResource[] {
  return resources;
}





