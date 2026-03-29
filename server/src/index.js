require('dotenv').config();
const express = require('express');
const cors = require('cors');
const auditRoutes = require('./routes/audit');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/audit', auditRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'PageLens API is running' });
});

app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  logger.info(`PageLens server running on port ${PORT}`);
});

module.exports = app;
