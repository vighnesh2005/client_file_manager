import env from './config/env.js';
import connectDB from './config/db.js';
import app from './app.js';

const start = async () => {
  if (!env.MONGODB_URI) {
    console.error('MONGODB_URI is not set in .env file');
    process.exit(1);
  }
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

start();
