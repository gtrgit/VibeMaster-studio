"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./database");
async function main() {
    try {
        const db = (0, database_1.getDatabase)();
        const world = await db.world.findFirst({
            include: {
                npcs: {
                    select: {
                        name: true,
                        needFood: true,
                        needSafety: true,
                        needWealth: true,
                        emotionHappiness: true,
                        emotionFear: true,
                        emotionSadness: true
                    }
                }
            }
        });
        if (world) {
            console.log(JSON.stringify({
                currentDay: world.currentDay,
                currentHour: world.currentHour,
                npcs: world.npcs
            }));
        }
        else {
            // No world found, return empty data
            console.log(JSON.stringify({
                currentDay: 1,
                currentHour: 8,
                npcs: []
            }));
        }
        await db.$disconnect();
    }
    catch (error) {
        // If there's an error, output empty data so Tauri doesn't crash
        console.error('Error getting world state:', error);
        console.log(JSON.stringify({
            currentDay: 1,
            currentHour: 8,
            npcs: []
        }));
        process.exit(0); // Exit successfully even on error
    }
}
main();
//# sourceMappingURL=get-world-state.js.map