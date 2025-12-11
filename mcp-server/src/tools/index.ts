// MCP Tools Registry

import { MCPTool } from '../types.js';

export const tools: MCPTool[] = [];

export function registerTool(tool: MCPTool) {
  tools.push(tool);
}

export function getTool(name: string): MCPTool | undefined {
  return tools.find(t => t.name === name);
}

export function getAllTools(): MCPTool[] {
  return tools;
}





