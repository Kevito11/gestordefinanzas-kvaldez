import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'apps', 'api', 'data');
const USERS_FILE = join(DATA_DIR, 'users.json');
const ACCOUNTS_FILE = join(DATA_DIR, 'accounts.json');
const BUDGETS_FILE = join(DATA_DIR, 'budgets.json');
const TRANSACTIONS_FILE = join(DATA_DIR, 'transactions.json');

// 1. Create Users
const users = [
    {
        id: "user_kvaldez_1",
        username: "kvaldez",
        password: "1122", // In a real app this would be hashed
        name: "Kevin Valdez"
    },
    {
        id: "user_jhernandez_2",
        username: "Jhernandez",
        password: "1122",
        name: "J. Hernandez"
    }
];

writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
console.log('Created users.json');

// 2. Migrate existing data to kvaldez
const migrateFile = (filePath: string) => {
    if (!existsSync(filePath)) {
        console.log(`Skipping ${filePath} (not found)`);
        return;
    }

    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    const migrated = data.map((item: any) => ({
        ...item,
        userId: "user_kvaldez_1"
    }));

    writeFileSync(filePath, JSON.stringify(migrated, null, 2));
    console.log(`Migrated ${filePath} with ${migrated.length} records`);
};

migrateFile(ACCOUNTS_FILE);
migrateFile(BUDGETS_FILE);
migrateFile(TRANSACTIONS_FILE);
