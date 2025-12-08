"use strict";
// Base Agent Class
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgent = void 0;
class BaseAgent {
    name;
    description;
    constructor(name, description) {
        this.name = name;
        this.description = description;
    }
    getName() {
        return this.name;
    }
    getDescription() {
        return this.description;
    }
    validateInput(input, schema) {
        // Basic validation - can be enhanced with JSON Schema validation
        return input !== null && input !== undefined;
    }
    handleError(error, context) {
        console.error(`[${this.name}] Error:`, error.message, context);
        throw error;
    }
}
exports.BaseAgent = BaseAgent;
//# sourceMappingURL=BaseAgent.js.map