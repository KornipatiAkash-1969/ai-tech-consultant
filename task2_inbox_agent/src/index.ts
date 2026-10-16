import { createServer } from './server';

const PORT = process.env.PORT || 8002;
const app = createServer();

app.listen(PORT, () => {
  console.log(`[Task 2 - Inbox Agent] Running on http://localhost:${PORT}`);
});
