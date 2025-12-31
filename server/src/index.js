import app from './app.js';

const PORT = process.env.BACKEND_PORT || 4000;

app.listen(PORT, () => {
  console.log(`server listening on ${PORT}`);
});
