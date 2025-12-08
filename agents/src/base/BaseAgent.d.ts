export declare abstract class BaseAgent {
    protected name: string;
    protected description: string;
    constructor(name: string, description: string);
    abstract process(input: any): Promise<any>;
    getName(): string;
    getDescription(): string;
    protected validateInput(input: any, schema: any): boolean;
    protected handleError(error: Error, context?: any): never;
}
//# sourceMappingURL=BaseAgent.d.ts.map