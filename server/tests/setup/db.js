import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';

let memoryServer;

export async function connectTestDb() {
  let uri = process.env.TEST_MONGO_URI;
  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
  }
  await mongoose.connect(uri, { dbName: `crm_test_${randomUUID().slice(0, 8)}` });
}

export async function clearTestDb() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

export async function disconnectTestDb() {
  if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
