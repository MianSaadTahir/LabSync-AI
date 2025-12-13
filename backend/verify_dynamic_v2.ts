
import mongoose from 'mongoose';

// Ensure fetch is available (Node 18+)
const fetch = global.fetch;

if (!fetch) {
    console.error("Global fetch not found. Use Node 18+");
    process.exit(1);
}

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/labsync_ai';
const WEBHOOK_URL = 'http://localhost:4000/api/webhook/telegram';

async function verify() {
    console.log('🔌 Connecting to MongoDB...');
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected.');
    } catch (e: any) {
        console.error("Mongo Connection Error:", e);
        process.exit(1);
    }

    const Budget = mongoose.connection.collection('budgets');

    // 1. Simulate Telegram Message
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
        // Retry once more
        console.log("Budget not found yet, waiting 10s more...");
        await new Promise(r => setTimeout(r, 10000));
        const latestBudget2 = await Budget.findOne({}, { sort: { designed_at: -1 } });
        if (!latestBudget2) {
            console.error('❌ No budget found in database!');
            process.exit(1);
        }
    }

    // Use latestBudget found
    const budgetToCheck = (await Budget.findOne({}, { sort: { designed_at: -1 } })) as any;

    console.log('\n📊 Latest Budget Formatted:');
    console.log('Project:', budgetToCheck.project_name);
    console.log('Total:', budgetToCheck.total_budget);

    console.log('\n👥 People Costs (Keys):');
    const peopleKeys = Object.keys(budgetToCheck.people_costs || {});
    console.log(peopleKeys);

    const hasDynamicRoles = peopleKeys.some(k => k.toLowerCase().includes('drone') || k.toLowerCase().includes('ai') || k.toLowerCase().includes('engineer'));

    if (hasDynamicRoles) {
        console.log('\n✅ SUCCESS: Dynamic roles detected!');
    } else {
        console.log('\n⚠️ WARNING: specific roles not found. Check if generic roles were used.');
    }

    await mongoose.disconnect();
    process.exit(0);
}

verify().catch(console.error);
