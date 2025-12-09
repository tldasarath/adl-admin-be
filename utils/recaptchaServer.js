

const SECRET = process.env.RECAPTCHA_SECRET_KEY;

/**
 * verifyRecaptchaToken(token, expectedAction)
 * returns { ok: boolean, score?: number, action?:string, raw?: object, message?:string }
 */
export async function verifyRecaptchaToken(token, expectedAction = "newsletter_subscribe") {
  if (!SECRET) {
    console.warn("RECAPTCHA_SECRET_KEY not set - skipping verification (dev).");
    // For development convenience only: return ok; in production ALWAYS set secret
    return { ok: true, score: 1.0, raw: { devFallback: true } };
  }

  if (!token) return { ok: false, message: "Missing recaptcha token" };

  try {
    const params = new URLSearchParams();
    params.append("secret", SECRET);
    params.append("response", token);

    const r = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      body: params,
    });
    const data = await r.json();

    // data contains: success, score, action, challenge_ts, hostname, ...
    if (!data.success) {
      return { ok: false, message: "recaptcha verification failed", raw: data };
    }

    if (expectedAction && data.action && data.action !== expectedAction) {
      // action mismatch — suspicious
      return { ok: false, message: "recaptcha action mismatch", raw: data };
    }

    return { ok: true, score: data.score ?? 0, action: data.action, raw: data };
  } catch (err) {
    console.error("verifyRecaptchaToken error:", err);
    return { ok: false, message: "recaptcha verification error", error: err };
  }
}
