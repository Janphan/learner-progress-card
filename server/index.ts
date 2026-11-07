import express, { Request, Response } from 'express'
import { Server } from 'http'

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error(`Invalid PORT: ${process.env.PORT}`)
}

app.use(express.json());

//Health check route
app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Example application route
app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Express production-ready template' });
});

// Start the server
const server: Server = app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
});

// Graceful Shutdown Configuration
const gracefulShutdown = (signal: string) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

    // Stops the server from accepting new connections
    server.close((err) => {
        if (err) {
            console.error('Error during server close:', err);
            process.exit(1);
        }

        console.log('Http server closed.');
        // Add database close connections here if applicable (e.g., await prisma.$disconnect())
        console.log('Cleanup finished. Exiting safely.');
        process.exit(0);
    });

    // Force close after 10 seconds if connections are hanging
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};
// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Cloud providers / Docker
process.on('SIGINT', () => gracefulShutdown('SIGINT'));   // Ctrl+C in terminal