import { createApp } from './app.js';
import { env } from './env.js';

const app = createApp();

app.listen(env.port, () => {
  console.log(`\n🟢 Hanne Store API đang chạy tại http://localhost:${env.port}`);
  console.log(`   Health check: http://localhost:${env.port}/api/health\n`);
});
