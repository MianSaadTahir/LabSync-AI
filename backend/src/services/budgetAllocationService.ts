import Budget, { IBudget } from '../models/Budget';
import BudgetAllocation from '../models/BudgetAllocation';
import Message from '../models/Message';
import Meeting from '../models/Meeting';
import { emitToUpdates, SocketEvents } from './socketService';

/**
 * Budget Allocation Service - Module 3
 * Automatically allocates budget to team members and categories
 */
export class BudgetAllocationService {
    constructor() {
        console.log('[BudgetAllocationService] Initialized - Auto-allocation enabled');
    }

    /**
     * Automatically allocate budget based on designed budget data
     */
    async allocateAndSave(budgetId: string): Promise<any[]> {
        try {
            // Find the budget
            const budget = await Budget.findById(budgetId).populate('meetingId');
            if (!budget) {
                throw new Error(`Budget with id ${budgetId} not found`);
            }

            // Find the associated message
            const meeting = await Meeting.findById(budget.meetingId);
            const message = meeting?.messageId ? await Message.findById(meeting.messageId) : null;

            // Check if already allocated
            const existingAllocations = await BudgetAllocation.find({ budgetId: budget._id });
            if (existingAllocations.length > 0) {
                console.log(`[BudgetAllocationService] Budget ${budgetId} already allocated`);
                return existingAllocations;
            }

            console.log(`[BudgetAllocationService] Allocating budget for ${budget.project_name}`);

            // Create allocations based on people costs and resource costs
            // Create allocations based on people costs and resource costs
            const allocations: any[] = [];

            // Allocate to team members (dynamic keys)
            // Note: with Mongoose Maps, we might need to access .get() or iterate if it's a Map object
            // or treats it as a plain object if using lean(). We'll assume standard Document access which returns a Map or POJO depending on setup.
            // Using logic that handles both Map and Object for safety.
            const peopleCosts = budget.people_costs;
            if (peopleCosts) {
                // Helper to get entries regardless of Map or Object
                const entries = peopleCosts instanceof Map
                    ? Array.from(peopleCosts.entries())
                    : Object.entries(peopleCosts);

                for (const [role, cost] of entries) {
                    // Type assertion for cost item
                    const costItem = cost as any;
                    if (costItem.total > 0) {
                        // Format role name (e.g., 'ux_researcher' -> 'UX Researcher')
                        const formattedRole = role
                            .split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');

                        allocations.push({
                            budgetId: budget._id,
                            allocated_to: formattedRole,
                            category: 'People',
                            allocated_amount: costItem.total,
                            actual_spent: 0,
                            allocated_by: 'BudgetAllocationService',
                            notes: `${costItem.count} ${formattedRole}(s) x ${costItem.hours}hrs @ $${costItem.rate}/hr`,
                        });
                    }
                }
            }

            // Allocate resources (dynamic keys)
            const resourceCosts = budget.resource_costs;
            if (resourceCosts) {
                const entries = resourceCosts instanceof Map
                    ? Array.from(resourceCosts.entries())
                    : Object.entries(resourceCosts);

                for (const [resource, amount] of entries) {
                    if (typeof amount === 'number' && amount > 0) {
                        // Format resource name
                        const formattedResource = resource
                            .split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');

                        allocations.push({
                            budgetId: budget._id,
                            allocated_to: formattedResource,
                            category: 'Resources',
                            allocated_amount: amount,
                            allocated_by: 'BudgetAllocationService',
                            notes: `${formattedResource} Cost`,
                        });
                    }
                }
            }

            // Save all allocations
            const savedAllocations = await BudgetAllocation.insertMany(allocations);
            console.log(`[BudgetAllocationService] ✅ Created ${savedAllocations.length} allocations for budget ${budgetId}`);

            // Update message status to allocated
            if (message) {
                message.module3_status = 'allocated';
                await message.save();

                // Emit WebSocket events
                emitToUpdates(SocketEvents.MESSAGE_STATUS_UPDATED, {
                    messageId: message._id.toString(),
                    module3_status: 'allocated',
                    message: message.toObject(),
                });
            }

            // Emit allocation event
            emitToUpdates('allocation:created', {
                allocations: savedAllocations,
                budgetId: budget._id.toString(),
                projectName: budget.project_name,
                totalAllocated: allocations.reduce((sum, a) => sum + a.allocated_amount, 0),
            });

            return savedAllocations;
        } catch (error) {
            // Update message status to failed
            try {
                const budget = await Budget.findById(budgetId).populate('meetingId');
                if (budget) {
                    const meeting = await Meeting.findById(budget.meetingId);
                    if (meeting?.messageId) {
                        const message = await Message.findById(meeting.messageId);
                        if (message) {
                            message.module3_status = 'failed';
                            await message.save();
                        }
                    }
                }
            } catch (updateError) {
                console.error('[BudgetAllocationService] Error updating status:', updateError);
            }
            throw error;
        }
    }
}

// Singleton instance
let allocationService: BudgetAllocationService | null = null;

export function getBudgetAllocationService(): BudgetAllocationService {
    if (!allocationService) {
        allocationService = new BudgetAllocationService();
    }
    return allocationService;
}
