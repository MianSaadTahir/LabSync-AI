
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/labsync_ai';

async function check() {
    console.log('🔌 Connecting to MongoDB...');
    try {
        await mongoose.connect(MONGO_URI);
    } catch (e: any) {
        console.error("Connection Error:", e);
        process.exit(1);
    }

    const Budget = mongoose.connection.collection('budgets');

    console.log('🔍 Checking for budgets...');

    // Look for the processed budget (Drone project)
    // Retry loop for 60 seconds (since background job is 30s interval)
    for (let i = 0; i < 6; i++) {
        const latestBudget = await Budget.findOne({}, { sort: { designed_at: -1 } });
        const lb = latestBudget as any;

        if (lb && lb.project_name && (lb.project_name.toLowerCase().includes('drone') || (lb.people_costs && Object.keys(lb.people_costs).some(k => k.includes('drone'))))) {
            console.log('\n✅ Budget Found!');
            console.log('Project:', lb.project_name);
            console.log('Total:', lb.total_budget);

            console.log('\n👥 People Costs (Keys):');
            const peopleKeys = Object.keys(lb.people_costs || {});
            console.log(peopleKeys);

            if (peopleKeys.some(k => k.includes('drone') || k.includes('pilot'))) {
                console.log('\n🚀 SUCCESS: Dynamic Role "drone/pilot" found!');
                process.exit(0);
            } else {
                console.log('\n⚠️ Budget found but roles look generic?');
            }
        } else {
            console.log(`Waiting... (${i * 10}s)`);
        }
        await new Promise(r => setTimeout(r, 10000));
    }

    console.error('❌ Timeout: Budget not processed or found.');
    process.exit(1);
}

check();
