const express = require('express');
const cors = require('cors');
const platformVerificationController = require('./controllers/platformVerificationController');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Platform verification routes
app.post('/api/platforms/verify', platformVerificationController.verifyProfile);
app.post('/api/platforms/init-verify', platformVerificationController.initVerification);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        message: 'An unexpected error occurred.' 
    });
});

app.listen(PORT, () => {
    console.log(`✅ CodeDesk Server is running on http://localhost:${PORT}`);
});
