const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const contactRoutes = require('./routes/contactRoutes');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const faqRoutes = require('./routes/faqRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const careerRoutes = require('./routes/careerRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

delete process.env.MONGO_URI;
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });
console.log('Loaded .env from:', envPath);

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/careers', careerRoutes);
app.use('/api/upload', uploadRoutes); // File uploads for admin

app.use(notFound);
app.use(errorHandler);

// Find an available port automatically
const findAvailablePort = (startPort) => {
  return new Promise((resolve, reject) => {
    const net = require('net');
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    
    server.on('error', () => {
      findAvailablePort(startPort + 1).then(resolve);
    });
  });
};

const startServer = async () => {
  const PORT = await findAvailablePort(parseInt(process.env.PORT) || 4000);
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Admin dashboard: Open frontend/admin.html in your browser and use API base http://localhost:${PORT}/api`);
  });
};

startServer();
