const { Pool } = require('pg');
const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

const dotenv = require('dotenv');
dotenv.config();

let pool;
let dbConfig = null; 

// Initialize Secrets Manager client (uses AWS SDK default region from Lambda environment)
const secretsManager = new SecretsManagerClient({ 
    region: process.env.AWS_REGION || 'us-east-1' 
});

// Fetch database configuration from Secrets Manager
async function getDBConfig() {
    // if (dbConfig) {
    //     return dbConfig; // Return cached config
    // }

    // For local development (SAM Local or direct execution), use environment variables
    if (process.env.DATABASE_URL || process.env.AWS_SAM_LOCAL === 'true' || !process.env.DB_SECRET_ARN) {
        console.log('Using local database configuration from environment variables');
        dbConfig = {
            host: process.env.DATABASE_URL || 'host.docker.internal',
            port: parseInt(process.env.DATABASE_PORT || '5432'),
            database: process.env.DATABASE_NAME || 'userdetailsdb',
            user: process.env.DATABASE_USER || 'postgres',
            password: process.env.DATABASE_PASSWORD || ''
        };
        return dbConfig;
    }
    
    // For AWS environment, fetch from Secrets Manager
    try {
        const command = new GetSecretValueCommand({
            SecretId: process.env.DB_SECRET_ARN
        });

        const response = await secretsManager.send(command);
        
        // Parse the JSON secret string
        const secret = JSON.parse(response.SecretString);

        dbConfig = {
            host: secret.host,
            port: parseInt(secret.port),
            database: secret.dbname,
            user: secret.username,
            password: secret.password || '' // password is optional in the secret
        };

        console.log('Database configuration loaded from Secrets Manager');
        return dbConfig;
    } catch (error) {
        console.error('Error fetching Secrets Manager secret:', error);
        throw error;
    }
}

// Initialize pool with configuration
async function initPool() {
    if (pool) {
        return pool;
    }

    const config = await getDBConfig();
    
    pool = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        // Use SSL for AWS RDS (skip only for local development)
        ...(config.host !== 'localhost' && 
            config.host !== 'host.docker.internal' && {
            ssl: {
                rejectUnauthorized: false  // Accept self-signed certificates
            }
        }),
        // Connection pool settings
        max: 2, 
        idleTimeoutMillis: 30000, 
        connectionTimeoutMillis: 10000, 
    });

    return pool;
}

async function query(sql, params = []) {
    let client;
    try {
        const pool = await initPool(); // Ensure pool is initialized
        client = await pool.connect();
        const result = await client.query(sql, params);
        const data = {
            count : result.rows.length,
            data : result.rows
        }
        return data;
        
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    } finally {
        if (client) {
            client.release();
        }
    }
}

module.exports = { query , getDBConfig};