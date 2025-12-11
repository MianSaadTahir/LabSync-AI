// MCP Server Configuration

export const config = {
  port: process.env.MCP_SERVER_PORT ? parseInt(process.env.MCP_SERVER_PORT) : 3001,
  host: process.env.MCP_SERVER_HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
};





