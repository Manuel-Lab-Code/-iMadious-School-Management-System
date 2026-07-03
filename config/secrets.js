// /* ═══════════════════════════════════════════════════════════
//    config/secrets.js
   
//    Environment variable validation and secure access
//    Ensures all required secrets are present before app starts
//    ═══════════════════════════════════════════════════════════ */

// /**
//  * List of required environment variables
//  * @type {string[]}
//  */
// const REQUIRED_VARS = [
//     'MONGO_URI',
//     'JWT_SECRET',
//     'ADMIN_USER',
//     'ADMIN_PASS_HASH',
//     'EMAIL_USER',
//     'EMAIL_PASS'
// ];

// /**
//  * Optional environment variables with defaults
//  * @type {Object<string, any>}
//  */
// const OPTIONAL_VARS = {
//     PORT: 5000,
//     NODE_ENV: 'development',
//     ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:5000'
// };

// /**
//  * Validate all environment variables at startup
//  * Throws fatal error if any required var is missing
//  * @throws {Error} If validation fails
//  */
// function validateSecrets() {
//     const missing = [];

//     for (const varName of REQUIRED_VARS) {
//         if (!process.env[varName] || process.env[varName].trim() === '') {
//             missing.push(varName);
//         }
//     }

//     if (missing.length > 0) {
//         console.error('\n🚨 FATAL: Missing required environment variables:\n');
//         missing.forEach(v => console.error(`   ❌ ${v}`));
//         console.error('\n📋 See .env.example for required configuration.\n');
//         process.exit(1);
//     }

//     // Validate JWT_SECRET strength
//     if (process.env.JWT_SECRET.length < 32) {
//         console.error('\n🚨 FATAL: JWT_SECRET must be at least 32 characters long.\n');
//         process.exit(1);
//     }

//     // Validate NODE_ENV
//     const validEnvs = ['development', 'test', 'production'];
//     if (!validEnvs.includes(process.env.NODE_ENV)) {
//         console.warn(`⚠️  NODE_ENV '${process.env.NODE_ENV}' is not standard. Using 'development'.`);
//         process.env.NODE_ENV = 'development';
//     }

//     console.log('✅ Environment variables validated successfully');
// }

// /**
//  * Get environment variable with type safety
//  * @param {string} varName - Variable name
//  * @param {any} defaultValue - Default if not set
//  * @returns {any} - Variable value or default
//  */
// function getSecret(varName, defaultValue) {
//     return process.env[varName] ?? defaultValue;
// }

// module.exports = {
//     validateSecrets,
//     getSecret,
//     REQUIRED_VARS,
//     OPTIONAL_VARS
// };


// REPLACED WITH
/* ═══════════════════════════════════════════════════════════
   config/secrets.js
   
   Environment variable validation and secure access
   Ensures all required secrets are present before app starts
   ═══════════════════════════════════════════════════════════ */

/**
 * List of required environment variables
 * @type {string[]}
 */
const REQUIRED_VARS = [
    'MONGO_URI',
    'JWT_SECRET',
    'ADMIN_USER',
    'ADMIN_PASS_HASH',
    'EMAIL_USER',
    'BREVO_API_KEY'
];

/**
 * Optional environment variables with defaults
 * @type {Object<string, any>}
 */
// const OPTIONAL_VARS = {
//     PORT: 5000,
//     NODE_ENV: 'development',
//     ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:5000'
// }; Replaced with bellow
const OPTIONAL_VARS = {
    PORT: 5000,
    NODE_ENV: 'development',
    ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:5000',
    ANTHROPIC_API_KEY: '',
    ANTHROPIC_MODEL: 'claude-sonnet-5'
};
/**
 * Validate all environment variables at startup
 * Throws fatal error if any required var is missing
 * @throws {Error} If validation fails
 */
function validateSecrets() {
    const missing = [];

    for (const varName of REQUIRED_VARS) {
        if (!process.env[varName] || process.env[varName].trim() === '') {
            missing.push(varName);
        }
    }

    if (missing.length > 0) {
        console.error('\n🚨 FATAL: Missing required environment variables:\n');
        missing.forEach(v => console.error(`   ❌ ${v}`));
        console.error('\n📋 See .env.example for required configuration.\n');
        process.exit(1);
    }

    // Validate JWT_SECRET strength
    if (process.env.JWT_SECRET.length < 32) {
        console.error('\n🚨 FATAL: JWT_SECRET must be at least 32 characters long.\n');
        process.exit(1);
    }

    // Validate NODE_ENV
    const validEnvs = ['development', 'test', 'production'];
    if (!validEnvs.includes(process.env.NODE_ENV)) {
        console.warn(`⚠️  NODE_ENV '${process.env.NODE_ENV}' is not standard. Using 'development'.`);
        process.env.NODE_ENV = 'development';
    }

    console.log('✅ Environment variables validated successfully');
}

/**
 * Get environment variable with type safety
 * @param {string} varName - Variable name
 * @param {any} defaultValue - Default if not set
 * @returns {any} - Variable value or default
 */
function getSecret(varName, defaultValue) {
    return process.env[varName] ?? defaultValue;
}

module.exports = {
    validateSecrets,
    getSecret,
    REQUIRED_VARS,
    OPTIONAL_VARS
};
