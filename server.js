/**
 * Express.js Web Server Application
 * 
 * Main application file implementing multi-endpoint routing with middleware pipeline processing.
 * Features Express.js framework integration, automatic port fallback, and comprehensive error handling.
 * 
 * Requirements:
 * - Feature F-001: Basic Node.js HTTP Server Implementation with 'Hello World!' response
 * - Feature F-002: Express.js Framework Integration with NPM package management
 * - Feature F-003: Multi-Endpoint Route Management with '/good-evening' endpoint
 * - Response time performance under 100ms for 95% of requests
 * - Port fallback mechanism from 3000 through 3001-3010
 * - Backward compatibility preservation for existing root endpoint behavior
 */

// Import required modules
const express = require('express');
const http = require('http');

// Create Express application instance
const app = express();

// Configuration constants
const DEFAULT_PORT = 3000;
const MAX_PORT = 3010;
const RETRY_DELAY = 1000; // 1 second base delay

/**
 * Request logging middleware for development visibility
 * Logs request method, URL, and timestamp for debugging purposes
 */
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next();
});

/**
 * Express.json() middleware for request body parsing capabilities
 * Enables automatic JSON request body parsing for future POST/PUT endpoints
 */
app.use(express.json());

/**
 * Root endpoint handler - Feature F-001 compliance
 * Returns "Hello World!" response maintaining backward compatibility
 * 
 * @route GET /
 * @returns {string} "Hello World!" - Plain text response
 */
app.get('/', (req, res) => {
    res.send('Hello World!');
});

/**
 * Good evening endpoint handler - Feature F-003 implementation
 * Returns "Good evening" response for multi-endpoint architecture demonstration
 * 
 * @route GET /good-evening
 * @returns {string} "Good evening" - Plain text response
 */
app.get('/good-evening', (req, res) => {
    res.send('Good evening');
});

/**
 * Port binding with automatic fallback mechanism
 * Attempts to bind to ports from 3000 to 3010 with exponential backoff
 * 
 * @param {number} port - Port number to attempt binding
 * @param {number} retryCount - Current retry attempt count
 */
function startServer(port = DEFAULT_PORT, retryCount = 0) {
    const server = app.listen(port, () => {
        console.log(`Express.js server running on port ${port}`);
        console.log(`Available endpoints:`);
        console.log(`  GET / - Returns "Hello World!"`);
        console.log(`  GET /good-evening - Returns "Good evening"`);
    });

    // Error handling for port binding failures
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.log(`Port ${port} is in use, attempting next port...`);
            
            // Check if we've exceeded the maximum port range
            if (port >= MAX_PORT) {
                console.error(`All ports from ${DEFAULT_PORT} to ${MAX_PORT} are in use.`);
                console.log('Attempting fallback to native HTTP server...');
                startHttpFallback();
                return;
            }
            
            // Exponential backoff delay before retry
            const delay = RETRY_DELAY * Math.pow(2, retryCount);
            setTimeout(() => {
                startServer(port + 1, retryCount + 1);
            }, delay);
        } else {
            console.error('Server error:', error);
            console.log('Attempting fallback to native HTTP server...');
            startHttpFallback();
        }
    });
}

/**
 * Native HTTP server fallback implementation
 * Provides Express-to-HTTP fallback behavior for resilient operation
 * Maintains identical functionality when Express.js framework fails
 */
function startHttpFallback() {
    console.log('Initializing native HTTP server fallback...');
    
    const server = http.createServer((req, res) => {
        // Request logging for fallback server
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${req.method} ${req.url} (HTTP Fallback)`);
        
        // Route handling with identical responses
        if (req.method === 'GET' && req.url === '/') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Hello World!');
        } else if (req.method === 'GET' && req.url === '/good-evening') {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Good evening');
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    });
    
    // Attempt to start HTTP fallback server with port fallback
    startHttpServerWithFallback(server, DEFAULT_PORT);
}

/**
 * HTTP server startup with port fallback mechanism
 * 
 * @param {http.Server} server - HTTP server instance
 * @param {number} port - Port number to attempt binding
 */
function startHttpServerWithFallback(server, port) {
    server.listen(port, () => {
        console.log(`HTTP fallback server running on port ${port}`);
        console.log(`Available endpoints:`);
        console.log(`  GET / - Returns "Hello World!"`);
        console.log(`  GET /good-evening - Returns "Good evening"`);
    });
    
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE' && port < MAX_PORT) {
            console.log(`Port ${port} is in use, trying port ${port + 1}...`);
            startHttpServerWithFallback(server, port + 1);
        } else {
            console.error('Fatal error: Unable to start server on any available port');
            process.exit(1);
        }
    });
}

// Initialize server startup
console.log('Starting Express.js web server...');
startServer();