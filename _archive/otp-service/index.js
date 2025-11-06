import express from 'express';
import twilio from 'twilio';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Validar credenciais Twilio obrigatórias
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  console.error('❌ TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables are required');
  process.exit(1);
}

// Validar formato do Account SID
if (!process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
  console.error('❌ TWILIO_ACCOUNT_SID must start with "AC"');
  process.exit(1);
}

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ===============================================================================
// SECURE OTP STORAGE SYSTEM WITH CANONICAL KEYS AND RATE LIMITING
// ===============================================================================

// Primary storage: canonicalKey (+55...) -> { code, expiresAt, attempts, createdAt }
const verificationCodes = new Map();

// Alias mapping: alternativeFormat -> canonicalKey
const phoneAliases = new Map();

// Rate limiting storage: canonicalKey -> { sendCount, lastSend, verifyAttempts, lockoutUntil }
const rateLimits = new Map();

// Rate limiting constants (configuração mais permissiva)
const RATE_LIMITS = {
  SMS_SENDS_PER_WINDOW: 15,    // Aumentado para 15 tentativas
  SMS_WINDOW_MINUTES: 10,      // Aumentado para 10 minutos
  VERIFY_ATTEMPTS_PER_CODE: 20, // Aumentado para 20 tentativas por código
  LOCKOUT_MINUTES: 3           // Reduzido para 3 minutos
};

// ===============================================================================
// SECURITY HELPER FUNCTIONS
// ===============================================================================

/**
 * Improved phone normalization handling edge cases
 * @param {string} phone - Raw phone input
 * @returns {string} - Canonical normalized format (+55...)
 */
function normalizePhone(phone) {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle common edge cases
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2); // Remove 00 prefix
  }
  
  // Remove leading zeros (but preserve significant digits)
  cleaned = cleaned.replace(/^0+/, '');
  
  // Add Brazil country code if missing
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  // Return canonical format
  return '+' + cleaned;
}

/**
 * Generate all possible phone format variations for alias mapping
 * @param {string} originalPhone - Original input phone
 * @returns {string[]} - Array of possible formats
 */
function generatePhoneAliases(originalPhone) {
  const normalized = normalizePhone(originalPhone);
  const digits = normalized.replace(/^\+55/, '');
  
  return [
    originalPhone,
    digits,
    `55${digits}`,
    normalized,
    `+5531${digits.substring(2)}` // Common area code variation
  ].filter((phone, index, arr) => arr.indexOf(phone) === index); // Remove duplicates
}

/**
 * Secure OTP generation using crypto.randomInt()
 * @returns {string} - 6-digit secure OTP code
 */
function generateSecureOTP() {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

/**
 * Constant-time string comparison to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} - True if strings match
 */
function constantTimeCompare(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Secure logging that masks PII in production
 * @param {string} message - Log message
 * @param {boolean} containsPII - Whether message contains sensitive data
 */
function secureLog(message, containsPII = false) {
  const timestamp = new Date().toISOString();
  
  if (containsPII && process.env.NODE_ENV === 'production') {
    // In production, mask sensitive data
    const maskedMessage = message
      .replace(/\+?55\d{10,11}/g, '+55***MASKED***')
      .replace(/\b\d{6}\b/g, '***CODE***')
      .replace(/\b\d{4}-\d{4}-\d{4}-\d{4}\b/g, '****-****-****-****');
    console.log(`[${timestamp}] OTP-SERVICE: ${maskedMessage}`);
  } else {
    console.log(`[${timestamp}] OTP-SERVICE: ${message}`);
  }
}

// Legacy log function for non-sensitive messages
const log = (message) => secureLog(message, false);

/**
 * Check and update rate limits for SMS sending
 * @param {string} canonicalPhone - Normalized phone number
 * @returns {object} - { allowed: boolean, remaining: number, resetTime: Date }
 */
function checkSMSRateLimit(canonicalPhone) {
  const now = new Date();
  const windowStart = new Date(now.getTime() - (RATE_LIMITS.SMS_WINDOW_MINUTES * 60 * 1000));
  
  let rateLimit = rateLimits.get(canonicalPhone) || {
    sendCount: 0,
    lastSend: new Date(0),
    verifyAttempts: 0,
    lockoutUntil: null
  };
  
  // Check if in lockout
  if (rateLimit.lockoutUntil && now < rateLimit.lockoutUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: rateLimit.lockoutUntil,
      reason: 'lockout'
    };
  }
  
  // Reset counter if window expired
  if (rateLimit.lastSend < windowStart) {
    rateLimit.sendCount = 0;
  }
  
  // Check rate limit
  if (rateLimit.sendCount >= RATE_LIMITS.SMS_SENDS_PER_WINDOW) {
    // Trigger lockout
    rateLimit.lockoutUntil = new Date(now.getTime() + (RATE_LIMITS.LOCKOUT_MINUTES * 60 * 1000));
    rateLimits.set(canonicalPhone, rateLimit);
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: rateLimit.lockoutUntil,
      reason: 'rate_limit_exceeded'
    };
  }
  
  // Update rate limit
  rateLimit.sendCount++;
  rateLimit.lastSend = now;
  rateLimits.set(canonicalPhone, rateLimit);
  
  return {
    allowed: true,
    remaining: RATE_LIMITS.SMS_SENDS_PER_WINDOW - rateLimit.sendCount,
    resetTime: new Date(rateLimit.lastSend.getTime() + (RATE_LIMITS.SMS_WINDOW_MINUTES * 60 * 1000))
  };
}

/**
 * Check and update rate limits for code verification
 * @param {string} canonicalPhone - Normalized phone number
 * @returns {object} - { allowed: boolean, remaining: number }
 */
function checkVerifyRateLimit(canonicalPhone) {
  const stored = verificationCodes.get(canonicalPhone);
  if (!stored) {
    return { allowed: false, remaining: 0, reason: 'no_code' };
  }
  
  if (stored.attempts >= RATE_LIMITS.VERIFY_ATTEMPTS_PER_CODE) {
    return { allowed: false, remaining: 0, reason: 'attempts_exceeded' };
  }
  
  return {
    allowed: true,
    remaining: RATE_LIMITS.VERIFY_ATTEMPTS_PER_CODE - stored.attempts - 1
  };
}

/**
 * Purge all codes and aliases for a phone number (fixes concurrent codes vulnerability)
 * @param {string} canonicalPhone - Normalized phone number to purge
 */
function purgeAllCodesForPhone(canonicalPhone) {
  // Remove from main storage
  verificationCodes.delete(canonicalPhone);
  
  // Remove all aliases pointing to this canonical phone
  for (const [alias, target] of phoneAliases.entries()) {
    if (target === canonicalPhone) {
      phoneAliases.delete(alias);
    }
  }
  
  secureLog(`🧹 Purged all codes and aliases for phone`, true);
}

/**
 * Store OTP code with canonical key and alias mapping
 * @param {string} originalPhone - Original phone input
 * @param {string} code - Generated OTP code
 */
function storeSecureOTP(originalPhone, code) {
  const canonicalPhone = normalizePhone(originalPhone);
  const aliases = generatePhoneAliases(originalPhone);
  
  // CRITICAL: Purge any existing codes for this phone first
  purgeAllCodesForPhone(canonicalPhone);
  
  // Store canonical record
  const expiresAt = new Date(Date.now() + (15 * 60 * 1000)); // 15 minutes
  verificationCodes.set(canonicalPhone, {
    code,
    expiresAt,
    attempts: 0,
    createdAt: new Date()
  });
  
  // Map all aliases to canonical key
  aliases.forEach(alias => {
    if (alias !== canonicalPhone) {
      phoneAliases.set(alias, canonicalPhone);
    }
  });
  
  // Set cleanup timer
  setTimeout(() => {
    purgeAllCodesForPhone(canonicalPhone);
  }, 15 * 60 * 1000);
  
  secureLog(`🔐 Stored secure OTP for phone with ${aliases.length} aliases`, true);
}

/**
 * Retrieve and verify OTP code
 * @param {string} inputPhone - Phone number from verification request
 * @param {string} inputCode - Code to verify
 * @returns {object} - { success: boolean, canonicalPhone?: string, error?: string }
 */
function verifySecureOTP(inputPhone, inputCode) {
  // Find canonical phone through alias mapping
  let canonicalPhone = normalizePhone(inputPhone);
  
  secureLog(`🔍 [VERIFY] Input phone: ${inputPhone} -> Canonical: ${canonicalPhone}`, true);
  
  // Check if input is an alias
  if (phoneAliases.has(inputPhone)) {
    canonicalPhone = phoneAliases.get(inputPhone);
    secureLog(`🔗 [VERIFY] Found alias mapping: ${inputPhone} -> ${canonicalPhone}`, true);
  }
  
  // Check rate limiting
  const rateLimitResult = checkVerifyRateLimit(canonicalPhone);
  if (!rateLimitResult.allowed) {
    secureLog(`🚫 [VERIFY] Rate limit blocked: ${rateLimitResult.reason}`, true);
    return {
      success: false,
      error: `Verification ${rateLimitResult.reason === 'no_code' ? 'code not found or expired' : 'attempts exceeded'}`
    };
  }
  
  const stored = verificationCodes.get(canonicalPhone);
  if (!stored) {
    secureLog(`❌ [VERIFY] No code found for: ${canonicalPhone}`, true);
    secureLog(`📋 [VERIFY] Available codes: ${Array.from(verificationCodes.keys()).join(', ')}`, true);
    return { success: false, error: 'Code not found or expired' };
  }
  
  // Check expiration with detailed logging
  const now = new Date();
  const timeRemaining = stored.expiresAt.getTime() - now.getTime();
  secureLog(`⏰ [VERIFY] Code expires at: ${stored.expiresAt.toISOString()}, Time remaining: ${Math.round(timeRemaining/1000)}s`, true);
  
  if (now > stored.expiresAt) {
    secureLog(`⏳ [VERIFY] Code expired ${Math.round((now.getTime() - stored.expiresAt.getTime())/1000)}s ago`, true);
    purgeAllCodesForPhone(canonicalPhone);
    return { success: false, error: 'Code expired' };
  }
  
  // Increment attempt counter
  stored.attempts++;
  verificationCodes.set(canonicalPhone, stored);
  
  secureLog(`🔢 [VERIFY] Comparing codes - Expected: ${stored.code}, Received: ${inputCode}, Attempt: ${stored.attempts}/${RATE_LIMITS.VERIFY_ATTEMPTS_PER_CODE}`, true);
  
  // Constant-time comparison to prevent timing attacks
  if (!constantTimeCompare(stored.code, inputCode)) {
    secureLog(`❌ [VERIFY] Invalid code attempt ${stored.attempts}/${RATE_LIMITS.VERIFY_ATTEMPTS_PER_CODE}`, true);
    return { success: false, error: 'Invalid verification code' };
  }
  
  secureLog(`✅ [VERIFY] Code verified successfully!`, true);
  
  // Success - purge all codes and aliases
  purgeAllCodesForPhone(canonicalPhone);
  
  return { success: true, canonicalPhone };
}

// Cleanup function for expired codes and rate limits
function cleanupExpiredData() {
  const now = new Date();
  let cleanedCodes = 0;
  let cleanedRateLimits = 0;
  
  // Clean expired verification codes
  for (const [phone, data] of verificationCodes.entries()) {
    if (now > data.expiresAt) {
      purgeAllCodesForPhone(phone);
      cleanedCodes++;
    }
  }
  
  // Clean expired rate limits
  for (const [phone, data] of rateLimits.entries()) {
    const windowExpired = data.lastSend && (now.getTime() - data.lastSend.getTime()) > (RATE_LIMITS.SMS_WINDOW_MINUTES * 60 * 1000);
    const lockoutExpired = data.lockoutUntil && now > data.lockoutUntil;
    
    if (windowExpired && lockoutExpired) {
      rateLimits.delete(phone);
      cleanedRateLimits++;
    }
  }
  
  if (cleanedCodes > 0 || cleanedRateLimits > 0) {
    log(`🧹 Cleanup: Removed ${cleanedCodes} expired codes, ${cleanedRateLimits} expired rate limits`);
  }
}

// Run cleanup every minute
setInterval(cleanupExpiredData, 60000);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'otp-service', 
    timestamp: new Date().toISOString(),
    active_codes: verificationCodes.size,
    active_aliases: phoneAliases.size,
    rate_limits: rateLimits.size
  });
});

// Endpoint para enviar código OTP via SMS
app.post('/send-otp', async (req, res) => {
  try {
    const { phone, message, type = 'login' } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Generate secure 6-digit verification code using crypto.randomInt()
    const codigo = generateSecureOTP();

    // Normalize phone and check rate limits
    const canonicalPhone = normalizePhone(phone);
    const rateLimitResult = checkSMSRateLimit(canonicalPhone);
    
    if (!rateLimitResult.allowed) {
      const errorMessage = rateLimitResult.reason === 'lockout' 
        ? `Account locked until ${rateLimitResult.resetTime.toISOString()}. Too many SMS requests.`
        : `Rate limit exceeded. Try again after ${rateLimitResult.resetTime.toISOString()}.`;
      
      secureLog(`🚫 SMS rate limit hit for phone`, true);
      return res.status(429).json({ 
        error: errorMessage,
        retryAfter: rateLimitResult.resetTime.toISOString()
      });
    }
    
    // Handle test numbers with secure storage
    const testPhones = [
      "+5531999887766", "+5531999990001", "+5531999990002", "+5531999990003"
    ];
    
    const isTestPhone = testPhones.some(testPhone => 
      canonicalPhone.includes(testPhone.replace(/\D/g, '')) || 
      phone.includes("999887766") || phone.includes("999990001") || 
      phone.includes("999990002") || phone.includes("999990003")
    );
    
    if (isTestPhone) {
      const testCode = phone.includes("999990001") || phone.includes("999990002") || phone.includes("999990003") ? "123456" : codigo;
      
      // Use secure storage system for test phones too
      storeSecureOTP(phone, testCode);
      
      secureLog(`📱 TEST PHONE - Code generated for phone`, true);
      
      // Security: Only show code in development environment
      const response = { 
        success: true, 
        message: "Código de teste gerado",
        remaining_sends: rateLimitResult.remaining
      };
      
      if (process.env.NODE_ENV !== 'production') {
        response.codigo = testCode; // Show code only in development
      }
      
      return res.json(response);
    }

    // Store code using secure canonical storage system
    storeSecureOTP(phone, codigo);

    try {
      // Normalize phone number to Brazilian format
      let normalizedPhone = phone.replace(/\D/g, '');
      
      // Add country code if missing
      if (!normalizedPhone.startsWith('55')) {
        normalizedPhone = '55' + normalizedPhone;
      }
      
      // Format for Twilio (+55...)
      const twilioPhone = '+' + normalizedPhone;
      
      // Define message based on type
      let smsMessage = message || `Seu código de acesso ao Clube do Grito é: ${codigo}`;
      
      secureLog(`📱 SENDING SMS - Type: ${type}`, true);
      
      // Send SMS via Twilio
      await twilioClient.messages.create({
        body: smsMessage,
        from: process.env.TWILIO_PHONE_NUMBER || '+12345678901',
        to: twilioPhone
      });
      
      secureLog(`✅ SMS SENT successfully`, true);
      res.json({ 
        success: true, 
        message: "Código enviado via SMS",
        remaining_sends: rateLimitResult.remaining
      });
    } catch (twilioError) {
      secureLog(`❌ Twilio error: ${twilioError.message}`, false);
      
      // Fallback: still allow login with the generated code
      const response = { 
        success: true, 
        message: "Código gerado (SMS indisponível)"
      };
      
      // Security: Only show code in development environment
      if (process.env.NODE_ENV !== 'production') {
        response.codigo = codigo; // For development - shows the code when SMS fails
      }
      
      res.json(response);
    }
  } catch (error) {
    log(`❌ Error sending OTP: ${error.message}`);
    res.status(500).json({ error: "Erro ao enviar código OTP" });
  }
});

// Endpoint para verificar código OTP - SECURE VERSION
app.post('/verify-otp', async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: "Phone and code are required" });
    }

    // Use secure verification system
    const verificationResult = verifySecureOTP(phone, code);
    
    if (!verificationResult.success) {
      // Check if this is a rate limiting issue
      if (verificationResult.error.includes('attempts exceeded')) {
        secureLog(`🚫 Verification attempts exceeded for phone`, true);
        return res.status(429).json({ 
          error: "Too many verification attempts. Please request a new code."
        });
      }
      
      secureLog(`❌ OTP verification failed: ${verificationResult.error}`, true);
      return res.status(400).json({ error: verificationResult.error });
    }
    
    secureLog(`✅ OTP VERIFIED successfully`, true);
    res.json({ 
      success: true, 
      message: "Código verificado com sucesso",
      canonicalPhone: verificationResult.canonicalPhone
    });
  } catch (error) {
    secureLog(`❌ Error verifying OTP: ${error.message}`, false);
    res.status(500).json({ error: "Erro ao verificar código OTP" });
  }
});

// Endpoint para limpar códigos expirados (cleanup)
app.post('/cleanup', (req, res) => {
  const beforeSize = verificationCodes.size;
  // Em um ambiente real, isso seria feito com TTL no Redis
  // Por simplicidade, apenas reportamos o status atual
  log(`📊 Cleanup called. Current codes in memory: ${beforeSize}`);
  res.json({ 
    success: true, 
    message: "Cleanup completed", 
    codes_before: beforeSize,
    codes_after: verificationCodes.size
  });
});

// Endpoint temporário para limpar rate limit (apenas para Pedro Vinicius)
app.post('/api/clear-rate-limit', (req, res) => {
  const { phone } = req.body;
  
  if (!phone || phone !== '31981156288') {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  const canonicalPhone = normalizePhone(phone);
  
  // Limpar rate limit
  rateLimits.delete(canonicalPhone);
  
  // Limpar códigos existentes para evitar conflitos
  purgeAllCodesForPhone(canonicalPhone);
  
  log(`🧹 Rate limit cleared for Pedro Vinicius: ${canonicalPhone}`);
  
  res.json({ success: true, message: 'Rate limit cleared for Pedro Vinicius' });
});

// Endpoint para obter estatísticas
app.get('/stats', (req, res) => {
  res.json({
    service: 'otp-service',
    active_codes: verificationCodes.size,
    uptime: process.uptime(),
    memory_usage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  log(`❌ Unhandled error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  log(`🚀 OTP Service running on port ${PORT}`);
  log(`📱 Twilio Account: ${process.env.TWILIO_ACCOUNT_SID}`);
  log(`📞 Twilio Phone: ${process.env.TWILIO_PHONE_NUMBER || 'Not configured'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('📴 Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('📴 Received SIGINT, shutting down gracefully');
  process.exit(0);
});