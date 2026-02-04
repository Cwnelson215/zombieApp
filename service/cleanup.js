#!/usr/bin/env node
import { deleteEmptyGames, getCleanupStats } from "./database.js";

async function runCleanup() {
    console.log('=== ZombieApp Game Cleanup ===\n');

    const stats = await getCleanupStats();
    console.log(`Total games: ${stats.totalGames}`);
    console.log(`Empty games: ${stats.emptyGames}\n`);

    console.log('Deleting empty games...');
    const result = await deleteEmptyGames();
    console.log(`Deleted ${result.deletedCount} games\n`);

    console.log('Done!');
    process.exit(0);
}

runCleanup().catch(err => {
    console.error('Cleanup failed:', err);
    process.exit(1);
});
