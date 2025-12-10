import { verifyRecaptchaToken } from "../utils/recaptchaServer.js";


export default function verifyRecaptcha(options = {}) {
  const { action = "newsletter_subscribe", minScore = 0.5, requireToken = true } = options;

  return async (req, res, next) => {
    try {
      const token = req.body?.recaptchaToken || req.query?.recaptchaToken || null;

      if (!token) {
        if (requireToken) {
          return res.status(400).json({ ok: false, message: "Missing recaptcha token" });
        } else {
          // allow through if not required (useful in dev)
          req.recaptcha = { ok: false, devFallback: true };
          return next();
        }
      }

      const result = await verifyRecaptchaToken(token, action);
      if (!result.ok) return res.status(403).json({ ok: false, message: result.message || "recaptcha failed", info: result.raw });

      const score = Number(result.score || 0);
      if (score < minScore) {
        // too low -> probably bot
        return res.status(403).json({ ok: false, message: "reCAPTCHA score too low", score, info: result.raw });
      }

      // Good — attach recaptcha info for logging/audit and continue
      req.recaptcha = { ok: true, score, raw: result.raw };
      return next();
    } catch (err) {
      console.error("verifyRecaptcha middleware error:", err);
      return res.status(500).json({ ok: false, message: "recaptcha verification error" });
    }
  };
}
