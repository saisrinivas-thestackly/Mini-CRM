process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-hs256-signing';
process.env.CLIENT_URL = 'https://crm.example.com';
process.env.MONGO_URI = 'mongodb://unused-in-tests';
