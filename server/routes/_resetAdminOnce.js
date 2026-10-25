/**
 * TEMPORARY ONE-TIME ADMIN PASSWORD RESET ROUTE
 * ─────────────────────────────────────────────
 * SECURITY: Protected by RESET_TOKEN environment variable.
 *           Self-disables after one successful reset.
 *           Never logs connection strings, passwords, or hashes.
 * REMOVAL:  Delete this file + remove its app.use() line in server.js, then git push.
 */
'use strict';

const express = require('express');
const bcrypt  = require('bcryptjs');
const router  = express.Router();
const User    = require('../models/User');

// One-time guard — flips to true after first successful reset
let resetAlreadyUsed = false;

/**
 * GET /api/_reset-admin?token=<RESET_TOKEN>
 *
 * Render env vars required (add before deploy, delete after use):
 *   RESET_TOKEN  – any random string ≥ 16 chars (you choose)
 *   RESET_NEWPW  – the new password to set (min 6 chars)
 *   RESET_EMAIL  – (optional) defaults to admin@primemart.com
 */
router.get('/', async (req, res) => {
  // 1. Already used?
  if (resetAlreadyUsed) {
    return res.status(410).json({ ok: false, message: 'Reset endpoint already used and is now disabled.' });
  }

  // 2. RESET_TOKEN must be set on Render
  const configuredToken = (process.env.RESET_TOKEN || '').trim();
  if (configuredToken.length < 16) {
    return res.status(503).json({ ok: false, message: 'Reset not configured (RESET_TOKEN env var missing or too short).' });
  }

  // 3. Timing-safe token comparison
  const providedToken = (req.query.token || '').trim();
  let tokenMatch = false;
  try {
    const { timingSafeEqual } = require('crypto');
    tokenMatch =
      providedToken.length === configuredToken.length &&
      timingSafeEqual(Buffer.from(providedToken), Buffer.from(configuredToken));
  } catch (_) {
    tokenMatch = false;
  }
  if (!tokenMatch) {
    return res.status(401).json({ ok: false, message: 'Invalid reset token.' });
  }

  // 4. New password comes from env var only (never from query string)
  const newPassword = (process.env.RESET_NEWPW || '').trim();
  if (newPassword.length < 6) {
    return res.status(400).json({ ok: false, message: 'RESET_NEWPW env var must be at least 6 characters.' });
  }

  // 5. Target email
  const targetEmail = (process.env.RESET_EMAIL || 'admin@primemart.com').trim().toLowerCase();

  try {
    // 6. Verify the user exists before changing anything
    const existing = await User.findOne({ email: targetEmail }).select('_id email');
    if (!existing) {
      return res.status(404).json({
        ok: false,
        message: `No account found for [${targetEmail}]. No changes were made.`
      });
    }

    // 7. Hash with bcryptjs genSalt(10) — identical to User model pre-save hook
    const salt    = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    // 8. Update ONLY the password field
    const result = await User.updateOne(
      { _id: existing._id },
      { $set: { password: newHash } }
    );

    if (result.modifiedCount !== 1) {
      return res.status(500).json({ ok: false, message: 'DB update ran but 0 documents modified. Try again.' });
    }

    // 9. Self-disable after success
    resetAlreadyUsed = true;

    // 10. Log only last 6 chars of email — never hash, token, or password
    console.log(`[reset] Password updated for account ending ...${targetEmail.slice(-6)}`);

    return res.status(200).json({
      ok: true,
      message: `Password updated for [${targetEmail}]. Endpoint is now disabled. DELETE this route file and re-deploy immediately.`
    });

  } catch (err) {
    console.error('[reset] Error:', err.message);
    return res.status(500).json({ ok: false, message: 'Reset failed. Check Render logs.' });
  }
});

module.exports = router;
