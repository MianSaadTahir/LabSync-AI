
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BudgetDesignAgent } from './budgetDesign/BudgetDesignAgent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../backend/.env');
let API_KEY = "";

try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/GEMINI_API_KEY=(.*)/);
    if (match) {
        API_KEY = match[1].trim();
    } else {
        console.error("Could not find GEMINI_API_KEY in .env");
    }
} catch (e) {
    console.error("Could not read .env file at", envPath, e);
}


async function test() {
    console.log("Testing BudgetDesignAgent...");
    const agent = new BudgetDesignAgent(API_KEY);

    const meetingData = {
        project_name: "Mars Rover AI",
        client_details: { name: "NASA" },
        meeting_date: new Date(),
        participants: [],
        estimated_budget: 1000000,
        timeline: "1 year",
        requirements: "We need 1 Aerospace Engineer, 1 Rover Driver, and 3 Python Embedded Devs."
    };

    try {
        const result = await agent.process(meetingData);
        console.log("Result People Costs Keys:", Object.keys(result.people_costs));
        console.log(JSON.stringify(result.people_costs, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
