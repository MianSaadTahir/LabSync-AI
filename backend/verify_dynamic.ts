import mongoose from 'mongoose';
import fetch from 'node-fetch'; // Check if node-fetch is needed or if global fetch is available. Node 18+ has global fetch.
// If node-fetch is not installed in backend, we might need to rely on global fetch.
// backend likely has node-fetch or similar if it's doing requests, or we assume Node 18 environment.
// To be safe, I'll try to use global fetch first, and fallback if needed, but Import syntax requires it to exist.
// Let's rely on global fetch and remove the import if possible, or keep it if we know it's there. 
// Actually, 'backend' package.json might not have node-fetch. 
// I will use `const fetch = global.fetch || await import('node-fetch')` logic or just assume global fetch.
// But typescript might complain. 
// Let's just use standard `fetch` and hope tsx handles it (Node 18+).

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/labsync_ai';
const WEBHOOK_URL = 'http://localhost:4000/api/webhook/telegram';

async function verify() {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected.');

    const Budget = mongoose.connection.collection('budgets');

    // 1. Simulate Telegram Message
    // Using a very specific request to trigger dynamic roles
    const prompt = "I need a budget for a Drone Surveillance System. We need 1 Senior Drone Pilot, 2 AI Engineers for computer vision, and a Project Manager. Budget is $150,000. Timeline 3 months.";

    console.log(`\n📨 Sending Mock Telegram Message: "${prompt}"`);

    const mockUpdate = {
        message: {
            chat: { id: 123456789 },
            text: prompt,
            date: Math.floor(Date.now() / 1000),
            message_id: Math.floor(Math.random() * 10000)
        }
    };

    try {
        const res = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mockUpdate)
        });

        if (res.status !== 200) {
            console.error('❌ Webhook failed:', await res.text());
            process.exit(1);
        }
        console.log('✅ Webhook received. Waiting for processing (20s)...');
    } catch (err: any) {
        console.error('❌ Could not contact server:', err.message);
        process.exit(1);
    }

    // 2. Wait for processing
    await new Promise(r => setTimeout(r, 20000));

    // 3. Check Database
    const latestBudget = await Budget.findOne({}, { sort: { designed_at: -1 } });

    if (!latestBudget) {
        console.error('❌ No budget found in database!');
        process.exit(1);
    }

    console.log('\n📊 Latest Budget Formatted:');
    console.log('Project:', latestBudget.project_name);
    console.log('Total:', latestBudget.total_budget);

    console.log('\n👥 People Costs (Keys):');
    const peopleCosts = latestBudget.people_costs as any;
    const peopleKeys = Object.keys(peopleCosts || {});
    console.log(peopleKeys);

    console.log('\n🛠 Resource Costs (Keys):');
    const resourceCosts = latestBudget.resource_costs as any;
    const resourceKeys = Object.keys(resourceCosts || {});
    console.log(resourceKeys);

    const hasDynamicRoles = peopleKeys.some(k => k.toLowerCase().includes('drone') || k.toLowerCase().includes('ai') || k.toLowerCase().includes('engineer'));

    if (hasDynamicRoles) {
        console.log('\n✅ SUCCESS: Dynamic roles detected!');
    } else {
        console.log('\n⚠️ WARNING: specific roles not found. Check if generic roles were used.');
        // Check if it's just the old defaults
        const isDefault = peopleKeys.includes('lead') && peopleKeys.includes('manager') && peopleKeys.includes('developer');
        if (isDefault && !peopleKeys.includes('drone_pilot')) {
            console.error('❌ FAILURE: It seems to have fallen back to default/hardcoded roles.');
        }
    }

    await mongoose.disconnect();
    process.exit(0);
}

verify().catch(console.error);
