// Base Agent Class

export abstract class BaseAgent {
  protected name: string;
  protected description: string;

  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
  }

  abstract process(input: any): Promise<any>;

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  protected validateInput(input: any, schema: any): boolean {
    // Basic validation - can be enhanced with JSON Schema validation
    return input !== null && input !== undefined;
  }

  protected handleError(error: Error, context?: any): never {
    console.error(`[${this.name}] Error:`, error.message, context);
    throw error;
  }
}





