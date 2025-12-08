import { BaseAgent } from '../base/BaseAgent';
import { MeetingDetails } from '../../../shared/src/types';
export declare class MeetingExtractionAgent extends BaseAgent {
    private genAI;
    private model;
    constructor(apiKey: string);
    process(messageText: string): Promise<MeetingDetails>;
    private buildExtractionPrompt;
    private parseExtractionResult;
    private fallbackExtraction;
    private validateAndNormalize;
    private parseDate;
}
//# sourceMappingURL=MeetingExtractionAgent.d.ts.map