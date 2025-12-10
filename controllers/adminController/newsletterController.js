import Newsletter from "../../models/newsletterModel.js";
import { validationResult } from "express-validator";
import { signUnsubscribe, verifyUnsubscribe } from "../../utils/unsubscribeToken.js";
import { sendMail } from "../../utils/mailer.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import stream from "stream";
import { buildSubscriptionEmail, buildUnsubscribeEmail } from "../../utils/emailTemplates.js";

export const subscribe = async (req, res) => {
  // input validation already applied via express-validator on route
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ ok: false, errors: errors.array() });

  try {
    const rawEmail = (req.body.email || "").toString().trim();
    if (!rawEmail) return res.status(400).json({ ok: false, message: "Email is required" });

    const email = rawEmail.toLowerCase();

    let doc = await Newsletter.findOne({ email });

    // 1) Not found -> create
    if (!doc) {
      const token = signUnsubscribe(email);
      const newSub = await Newsletter.create({
        email,
        unsubscribeToken: token,
        status: "active",
      });

      // send welcome / confirm mail (non-blocking)
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

// improved getAllSubscribers (drop-in replacement)
export const getAllSubscribers = async (req, res) => {
  try {
    const {
      q,
      from,
      to,
      status,
      page = 1,
      limit = 25,
      sort = "createdAt:desc",
      export: exportType,
      count = "true",      // set count=false to avoid expensive countDocuments
      exportAll = "false", // set exportAll=true to export all matching docs
    } = req.query;

    const query = {};
    if (q) query.email = { $regex: q, $options: "i" };
    if (status) query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    // sorting
    const [sortField, sortDir] = (sort || "createdAt:desc").split(":");
    const sortObj = {};
    sortObj[sortField] = sortDir === "asc" ? 1 : -1;

    const pageNum = Math.max(1, Number(page));
    const perPage = Math.max(1, Math.min(1000, Number(limit)));
    const skip = (pageNum - 1) * perPage;

    // If exporting all matching docs requested, fetch entire result set (CAUTION: can be heavy)
    if (exportType && String(exportAll).toLowerCase() === "true") {
      // WARNING: exporting all matching docs may be expensive for large datasets.
      const docsAll = await Newsletter.find(query).sort(sortObj).lean();

      // Export Excel
      if (exportType === "excel") {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Subscribers");
        sheet.columns = [
          { header: "Email", key: "email", width: 40 },
          { header: "Status", key: "status", width: 15 },
          { header: "Subscribed At", key: "createdAt", width: 30 },
          { header: "Last Sent At", key: "lastSentAt", width: 30 },
        ];
        docsAll.forEach((d) =>
          sheet.addRow({
            email: d.email,
            status: d.status,
            createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : "",
            lastSentAt: d.lastSentAt ? new Date(d.lastSentAt).toISOString() : "",
          })
        );
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="subscribers_all_${Date.now()}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
        return;
      }

      // Export PDF for full set
      if (exportType === "pdf") {
        const doc = new PDFDocument({ margin: 30, size: "A4" });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="subscribers_all_${Date.now()}.pdf"`);
        doc.fontSize(18).text("Newsletter Subscribers", { align: "center" });
        doc.moveDown();
        docsAll.forEach((d) => {
          doc.fontSize(10).text(`Email: ${d.email}`);
          doc.text(`Status: ${d.status}`);
          doc.text(`Subscribed At: ${d.createdAt ? d.createdAt.toISOString() : ""}`);
          doc.moveDown();
        });
        doc.pipe(res);
        doc.end();
        return;
      }

      // Fallback JSON if somehow exportType not matched
      return res.json({ ok: true, data: docsAll, meta: { total: docsAll.length } });
    }

    // Lightweight mode: count=false => avoid COUNT; return hasNext/hasPrev
    if (String(count).toLowerCase() === "false" && !exportType) {
      const docs = await Newsletter.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(perPage + 1) // fetch one extra to detect next page
        .lean();

      const hasNext = docs.length > perPage;
      if (hasNext) docs.pop();

      return res.json({
        ok: true,
        data: docs,
        meta: {
          page: pageNum,
          limit: perPage,
          hasNext,
          hasPrev: pageNum > 1,
        },
      });
    }

    // Default mode: perform count and return pages
    const total = await Newsletter.countDocuments(query);
    const docs = await Newsletter.find(query).sort(sortObj).skip(skip).limit(perPage).lean();

    // Export current page (if exportType present)
    if (exportType === "excel") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Subscribers");
      sheet.columns = [
        { header: "Email", key: "email", width: 40 },
        { header: "Status", key: "status", width: 15 },
        { header: "Subscribed At", key: "createdAt", width: 30 },
        { header: "Last Sent At", key: "lastSentAt", width: 30 },
      ];
      docs.forEach((d) =>
        sheet.addRow({
          email: d.email,
          status: d.status,
          createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : "",
          lastSentAt: d.lastSentAt ? new Date(d.lastSentAt).toISOString() : "",
        })
      );
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="subscribers_${Date.now()}.xlsx"`);
      await workbook.xlsx.write(res);
      res.end();
      return;
    }

    if (exportType === "pdf") {
      const doc = new PDFDocument({ margin: 30, size: "A4" });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="subscribers_${Date.now()}.pdf"`);
      doc.fontSize(18).text("Newsletter Subscribers", { align: "center" });
      doc.moveDown();
      docs.forEach((d) => {
        doc.fontSize(10).text(`Email: ${d.email}`);
        doc.text(`Status: ${d.status}`);
        doc.text(`Subscribed At: ${d.createdAt ? d.createdAt.toISOString() : ""}`);
        doc.moveDown();
      });
      doc.pipe(res);
      doc.end();
      return;
    }

    // Normal JSON
    return res.json({
      ok: true,
      data: docs,
      meta: {
        total,
        page: pageNum,
        limit: perPage,
        pages: Math.max(1, Math.ceil(total / perPage)),
      },
    });
  } catch (err) {
    console.error("getAllSubscribers error:", err);
    return res.status(500).json({ ok: false, message: "Server error", error: err.message });
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

// Admin: list with search and date filters, pagination
export const list = async (req, res) => {
  // Query params: q (email search), from, to (ISO dates), status, page, limit, export=excel|pdf
  const { q, from, to, status, page = 1, limit = 25, export: exportType } = req.query;
  const query = {};

  if (q) {
    query.email = { $regex: q, $options: "i" };
  }
  if (status) query.status = status;
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Newsletter.countDocuments(query);
  const docs = await Newsletter.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean();

  // Export endpoints
  if (exportType === "excel") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("newsletters");
    sheet.columns = [
      { header: "Email", key: "email", width: 30 },
      { header: "Status", key: "status", width: 15 },
      { header: "Subscribed At", key: "createdAt", width: 25 },
      { header: "Last Sent At", key: "lastSentAt", width: 25 },
    ];
    docs.forEach((d) => {
      sheet.addRow({
        email: d.email,
        status: d.status,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : "",
        lastSentAt: d.lastSentAt ? new Date(d.lastSentAt).toISOString() : "",
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="newsletters_${Date.now()}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
    return;
  }

  if (exportType === "pdf") {
    const doc = new PDFDocument({ margin: 30, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="newsletters_${Date.now()}.pdf"`);

    doc.fontSize(18).text("Newsletter Subscribers", { align: "center" });
    doc.moveDown();

    docs.forEach((d) => {
      doc.fontSize(10).text(`Email: ${d.email}`);
      doc.text(`Status: ${d.status}`);
      doc.text(`Subscribed At: ${d.createdAt ? d.createdAt.toISOString() : ""}`);
      doc.moveDown();
    });

    doc.pipe(res);
    doc.end();
    return;
  }

  return res.json({
    ok: true,
    data: docs,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit) || 1),
    },
  });
};

// Admin: send bulk email to active subscribers
export const sendBulk = async (req, res) => {
  // Expected: { subject, htmlContent } or use templates
  const { subject, htmlContent } = req.body;
  if (!subject || !htmlContent) return res.status(400).json({ ok: false, message: "subject & htmlContent required" });

  // Fetch active subscribers
  const subs = await Newsletter.find({ status: "active" }).lean();

  // IMPORTANT: For production use a background job queue (Bull, BeeQueue) or external service — but for simplicity show the process here.
  // We will send in batches to avoid throttling and to reduce spam flags.
  const batchSize = 100; // tune according to SMTP provider limits
  const batches = [];
  for (let i = 0; i < subs.length; i += batchSize) {
    batches.push(subs.slice(i, i + batchSize));
  }

  // send sequentially batch by batch
  const results = { success: 0, failed: 0, errors: [] };

  for (const batch of batches) {
    // send batch in parallel but limited concurrency
    await Promise.all(
      batch.map(async (s) => {
        const unsubscribeToken = s.unsubscribeToken || signUnsubscribe(s.email);
        // build unsubscribe link
        const unsubscribeLink = `${process.env.WEBSITE_BASE_URL || "https://your-domain.com"}/unsubscribe?token=${unsubscribeToken}`;

        // append a small footer to help spam filters and provide manual unsubscribe
        const html = `${htmlContent}<hr/><p style="font-size:12px">If you no longer wish to receive these emails, <a href="${unsubscribeLink}">unsubscribe</a>.</p>`;

        try {
          await sendMail({ to: s.email, subject, html });
          await Newsletter.updateOne({ _id: s._id }, { $set: { lastSentAt: new Date(), unsubscribeToken } });
          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push({ email: s.email, error: err.message });
          // Mark as bounced if SMTP suggests so (could add logic)
        }
      })
    );

    // Optional: sleep between batches to avoid throttling (implement small sleep)
    await new Promise((r) => setTimeout(r, 1000)); // 1s between batches (tune)
  }

  return res.json({ ok: true, message: "Bulk send complete", results });
};

/**
 * Block a subscriber by email or id
 * Body: { email?: string, id?: string, reason?: string }
 * Protected: admin/superadmin
 */
export const blockEmail = async (req, res) => {
  try {
    const { email, id, reason } = req.body;
    if (!email && !id) {
      return res.status(400).json({ ok: false, message: "Provide email or id to block" });
    }

    const query = id ? { _id: id } : { email: String(email).toLowerCase().trim() };
    const doc = await Newsletter.findOne(query);
    if (!doc) return res.status(404).json({ ok: false, message: "Subscriber not found" });

    // if already blocked
    if (doc.blocked || doc.status === "blocked") {
      return res.status(200).json({ ok: true, message: "Already blocked", data: doc });
    }

    doc.blocked = true;
    doc.blockedAt = new Date();
    if (req.user && req.user._id) doc.blockedBy = req.user._id;
    if (reason) doc.blockReason = reason;
    doc.status = "blocked"; // good to set status too
    await doc.save();

    return res.status(200).json({ ok: true, message: "Subscriber blocked", data: doc });
  } catch (err) {
    console.error("blockEmail error:", err);
    return res.status(500).json({ ok: false, message: "Server error", error: err.message });
  }
};

/**
 * Unblock a subscriber by email or id
 * Body: { email?: string, id?: string }
 * Protected: admin/superadmin
 */
export const unblockEmail = async (req, res) => {
  try {
    const { email, id } = req.body;
    if (!email && !id) {
      return res.status(400).json({ ok: false, message: "Provide email or id to unblock" });
    }

    const query = id ? { _id: id } : { email: String(email).toLowerCase().trim() };
    const doc = await Newsletter.findOne(query);
    if (!doc) return res.status(404).json({ ok: false, message: "Subscriber not found" });

    if (!doc.blocked && doc.status !== "blocked") {
      return res.status(200).json({ ok: true, message: "Subscriber is not blocked", data: doc });
    }

    doc.blocked = false;
    doc.blockedAt = undefined;
    doc.blockedBy = undefined;
    doc.blockReason = undefined;
    // Optionally revert status to 'active' or 'unsubscribed' based on business logic
    doc.status = "active";
    await doc.save();

    return res.status(200).json({ ok: true, message: "Subscriber unblocked", data: doc });
  } catch (err) {
    console.error("unblockEmail error:", err);
    return res.status(500).json({ ok: false, message: "Server error", error: err.message });
  }
};

/**
 * GET blocked subscribers (with pagination, search)
 * Query params: q, page, limit
 * Protected: admin/superadmin
 */
export const getBlockedSubscribers = async (req, res) => {
  try {
    const { q, page = 1, limit = 25 } = req.query;
    const query = { blocked: true };

    if (q) query.email = { $regex: q, $options: "i" };

    const perPage = Math.max(1, Math.min(1000, Number(limit)));
    const pageNum = Math.max(1, Number(page));
    const skip = (pageNum - 1) * perPage;

    const total = await Newsletter.countDocuments(query);
    const docs = await Newsletter.find(query).sort({ blockedAt: -1 }).skip(skip).limit(perPage).lean();

    return res.json({
      ok: true,
      data: docs,
      meta: {
        total,
        page: pageNum,
        limit: perPage,
        pages: Math.max(1, Math.ceil(total / perPage)),
      },
    });
  } catch (err) {
    console.error("getBlockedSubscribers error:", err);
    return res.status(500).json({ ok: false, message: "Server error", error: err.message });
  }
};

// DELETE /newsletter/:id
export const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ ok: false, message: "Missing id" });

    const doc = await Newsletter.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ ok: false, message: "Subscriber not found" });

    return res.json({ ok: true, message: "Deleted", data: doc });
  } catch (err) {
    console.error("deleteSubscriber error:", err);
    return res.status(500).json({ ok: false, message: "Server error", error: err.message });
  }
};


export const updateSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!id) return res.status(400).json({ ok: false, message: 'Missing id' });
    if (!status) return res.status(400).json({ ok: false, message: 'Missing status' });

    const doc = await Newsletter.findById(id);
    if (!doc) return res.status(404).json({ ok: false, message: 'Subscriber not found' });

    doc.status = status;
    await doc.save();

    return res.json({ ok: true, message: 'Updated', data: doc });
  } catch (err) {
    console.error('updateSubscriber error:', err);
    return res.status(500).json({ ok: false, message: 'Server error', error: err.message });
  }
};

