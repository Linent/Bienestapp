const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config');
const databaseConnect = require('./globals');

class Database {
    async connect() {
        try {
            mongoose.set("strictQuery", false);
            await mongoose.connect(MONGODB_URI);
            console.log('database connected');
        } catch (err) {
            console.log(MONGODB_URI);
            console.error('database not connected');
            // setTimeout(() => this.connect(), 1000);
        }
    }

    async verifyConntecion() {
        return databaseConnect;
    }
}

module.exports = new Database();
