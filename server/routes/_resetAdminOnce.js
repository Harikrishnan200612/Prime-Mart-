/**
 * TEMPORARY ONE-TIME ADMIN PASSWORD RESET ROUTE
 * ─────────────────────────────────────────────
 * PURPOSE : Reset the production administrator password when login is broken.
 * SECURITY: Protected by RESET_TOKEN environment variable (set only on Render).
 *           Disables itself after one successful reset.
 *           Never logs connection strings, passwords, or hashes.
 *
 * REMOVAL : Delete this file and remove the app.use() line from server.js,
 *           then git push to trigger a new Render deploy. The route will be gone.
 */

'use strict';

const express  = require('express');
const bcrypt   = require('bcryptjs');
const router   = express.Router();

// Load the exact same User model the application uses.
const User = require('../models/User');

// One-time guard: once a reset succeeds, the handler refuses all further calls.
let resetAlreadyUsed = false;

/**
 * GET /api/_reset-admin?token=<RESET_TOKEN>
 *
 * Required Render env vars (set BEFORE deploying, delete AFTER use):
 *   RESET_TOKEN  – any long random string you invent (min 16 chars)
 *   RESET_NEWPW  – the new administrator password to set (min 6 chars)
 *   RESET_EMAIL  – (optional) defaults to admin@primemart.com
 */
router.get('/', async (req, res) => {
  // 1. Already used?
  if (resetAlreadyUsed) {
    return res.status(410).json({ ok: false, message: 'Reset endpoint already used and is now disabled.' });
  }

  // 2. RESET_TOKEN must be configured on Render
  const configuredToken = process.env.RESET_TOKEN;
  if (!configuredToken || configuredToken.trim().length < 16) {
    return res.status(503).json({ ok: false, message: 'Reset not configured (RESET_TOKEN env var missing or too short).' });
  }

  // 3. Timing-safe token comparison
  const providedToken = (req.query.token || '').trim();
  const { timingSafeEqual } = require('crypto');
  let tokenMatch = false;
  try {
    tokenMatch =
      providedToken.length === configuredToken.trim().length &&
      timingSafeEqual(Buffer.from(providedToken), Buffer.from(configuredToken.trim()));
  } catch (_) {
    tokenMatch = false;
  }
  if (!tokenMatch) {
    return res.status(401).json({ ok: false, message: 'Invalid reset token.' });
  }

  // 4. Resolve new password from env var (never from query string for safety)
  const newPassword = (process.env.RESET_NEWPW || '').trim();
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ ok: false, message: 'RESET_NEWPW env var must be at least 6 characters.' });
  }

  // 5. Target email
  const targetEmail = (process.env.RESET_EMAIL || 'admin@primemart.com').trim().toLowerCase();

  try {
    // 6. Verify user exists first (read-only)
    const existing = await User.findOne({ email: targetEmail }).select('_id email');
    if (!existing) {
      return res.status(404).json({
        ok: false,
        message: `No account found for [${targetEmail}]. No changes were made.`
      });
    }

    // 7. Hash with bcryptjs + genSalt(10) — identical to User model pre-save hook
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // 8. Update ONLY the password field
    const result = await User.updateOne(
      { _id: existing._id },
      { $set: { password: newHash } }
    );

    if (result.modifiedCount !== 1) {
      return res.status(500).json({ ok: false, message: 'DB update ran but 0 documents modified. Try again.' });
    }

    // 9. Self-disable after one success
    resetAlreadyUsed = true;

    // 10. Log only the last 6 chars of email — never hash, token, or password
    console.log(`[reset] Password updated for account ending in ...${targetEmail.slice(-6)}`);

    return res.status(200).json({
      ok: true,
      message: `Password updated for [${targetEmail}]. Endpoint is now disabled. DELETE this route and re-deploy NOW.`
    });

  } catch (err) {
    console.error('[reset] Error:', err.message);
    return res.status(500).json({ ok: false, message: 'Reset failed. Check Render logs.' });
  }
});

module.exports = router;
