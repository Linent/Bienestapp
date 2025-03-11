import { connect, set } from 'mongoose';
import { MONGODB_URI } from './config';
import databaseConnect from "./globals";

class Database {
    async connect() {
        try {
            set("strictQuery", false);
            await connect(MONGODB_URI)
            console.log('database connected');
        } catch (err) {
            console.log(MONGODB_URI);
            console.error('database not connected');
            // setTimeout(() => Database.connect(), 1000);
        }
    }
    async verifyConntecion() {
        return databaseConnect;
    }
}

export default Database;