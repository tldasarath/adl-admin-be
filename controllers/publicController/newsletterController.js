import Newsletter from "../../models/newsletterModel.js";
import { validationResult } from "express-validator";
import { signUnsubscribe, verifyUnsubscribe } from "../../utils/unsubscribeToken.js";
import { sendMail } from "../../utils/mailer.js";
import { buildSubscriptionEmail, buildUnsubscribeEmail } from "../../utils/emailTemplates.js";

export const subscribe = async (req, res) => {
 
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ ok: false, errors: errors.array() });

  try {
    const rawEmail = (req.body.email || "").toString().trim();
    if (!rawEmail) return res.status(400).json({ ok: false, message: "Email is required" });

    const email = rawEmail.toLowerCase();

    let doc = await Newsletter.findOne({ email });

    if (!doc) {
      const token = signUnsubscribe(email);
      const newSub = await Newsletter.create({
        email,
        unsubscribeToken: token,
        status: "active",
      });

     
      const unsubscribeLink = `${process.env.WEBSITE_BASE_URL || "https://adlbusinesssolutions.com/"}/unsubscribe?token=${encodeURIComponent(token)}`;
const { html, text } = buildSubscriptionEmail({ email, unsubscribeLink });

      sendMail({ to: email, subject: "Subscription confirmed", html,text  }).catch((err) => {
        console.warn("Welcome mail failed:", err?.message || err);
      });

      return res.status(201).json({ ok: true, message: "Subscribed", data: newSub });
    }

    if (doc.status === "active") {
      return res.status(200).json({ ok: true, message: "Already subscribed", data: doc });
    }

    // 3) Found and unsubscribed -> re-activate
    if (doc.status === "unsubscribed") {
      const newToken = signUnsubscribe(email);
      doc.status = "active";
      doc.unsubscribeToken = newToken;
      doc.updatedAt = Date.now();
      await doc.save();

      // send welcome-back email
      const unsubscribeLink = `${process.env.WEBSITE_BASE_URL || "https://adlbusinesssolutions.com/"}/unsubscribe?token=${encodeURIComponent(newToken)}`;
const { html, text } = buildSubscriptionEmail({ email, unsubscribeLink });
      sendMail({ to: email, subject: "Subscription reactivated", html }).catch((err) => {
        console.warn("Welcome-back mail failed:", err?.message || err);
      });

      return res.status(200).json({ ok: true, message: "Subscription reactivated", data: doc });
    }

    // 4) Found but bounced/complained -> block auto re-subscribe
    if (doc.status === "bounced" || doc.status === "complained") {
      return res.status(409).json({
        ok: false,
        message:
          "This email cannot be re-subscribed automatically because it previously bounced or was reported. Please contact support.",
      });
    }

    return res.status(200).json({ ok: true, message: "Already subscribed", data: doc });
  } catch (err) {
 
    if (String(err).toLowerCase().includes("duplicate key")) {
      return res.status(200).json({ ok: true, message: "Already subscribed" });
    }
    console.error("subscribe error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};


export const unsubscribe = async (req, res) => {
  try {
    const token = req.query.token || req.body.token;
    if (!token) return res.status(400).json({ ok: false, message: "Missing token" });

    const payload = verifyUnsubscribe(token);
    if (!payload?.email) return res.status(400).json({ ok: false, message: "Invalid token" });

    const email = String(payload.email).toLowerCase().trim();
    const doc = await Newsletter.findOne({ email });

    // Return success even if missing to avoid enumeration
    if (!doc) {
      console.warn("Unsubscribe: no subscriber found for", email);
      return res.json({ ok: true, message: "If that email was subscribed, it has been unsubscribed." });
    }

    // If already unsubscribed, log attempt and return success
    if (doc.status === "unsubscribed" || doc.status === "blocked") {
      doc.events = doc.events || [];
      doc.events.push({ type: "unsubscribe_attempt", at: new Date(), meta: { ip: req.ip } });
      doc.save().catch(() => {});
      return res.json({ ok: true, message: "You were already unsubscribed." });
    }

    // Mark unsubscribed
    doc.status = "unsubscribed";
    doc.unsubscribedAt = new Date();
    doc.unsubscribeIp = req.ip;
    doc.unsubscribeUserAgent = req.headers["user-agent"] || "";
    doc.events = doc.events || [];
    doc.events.push({ type: "unsubscribed", at: new Date(), meta: { ip: req.ip } });

    await doc.save();

    // Try to build/send confirmation email but DO NOT let failures block the response
    try {
      const unsubscribeLink = `${process.env.WEBSITE_BASE_URL || "https://yourdomain.com"}/unsubscribe?token=${encodeURIComponent(doc.unsubscribeToken || token)}`;
      const { html, text } = buildUnsubscribeEmail({ email, unsubscribeLink });
      sendMail({ to: email, subject: "You have been unsubscribed", html, text }).catch((err) => {
        console.warn("Unsubscribe confirmation email failed:", err?.message || err);
      });
    } catch (emailErr) {
      console.warn("Failed to build/send unsubscribe email:", emailErr);
    }

    return res.json({ ok: true, message: "Unsubscribed" });
  } catch (err) {
    console.error("unsubscribe controller error:", err);
    return res.status(500).json({ ok: false, message: "Server error" });
  }
};


