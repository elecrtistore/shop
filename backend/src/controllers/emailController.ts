import Subscriber from '../models/Subscriber';
import Product from '../models/Product';
import nodemailer from 'nodemailer';
import xss from 'xss';

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return null;
}

function sanitize(str: string): string {
  return xss(str, {
    whiteList: {},
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
  });
}

function buildTemplate(template: string, data: any): string {
  const productCard = (p: any) => `
    <div style="border:1px solid #e5e7eb;border-radius:16px;padding:16px;margin-bottom:16px;background:#fff">
      <img src="${sanitize(p.images?.[0] || '')}" alt="${sanitize(p.name)}" style="width:100%;height:180px;object-fit:contain;border-radius:12px;background:#f8fafc;margin-bottom:12px" />
      <h3 style="margin:0 0 4px;font-size:16px;font-weight:600;color:#111827">${sanitize(p.name)}</h3>
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280">${sanitize(p.brand || '')}</p>
      ${p.discount ? `<p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#111827">KSh ${Math.round(p.price * (1 - p.discount / 100)).toLocaleString()}</p><p style="margin:0;font-size:13px;color:#6b7280"><del>KSh ${p.price.toLocaleString()}</del> <span style="color:#059669;font-weight:600">${sanitize(String(p.discount))}% OFF</span></p>` : `<p style="margin:0;font-size:18px;font-weight:700;color:#111827">KSh ${p.price.toLocaleString()}</p>`}
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/products/${p._id}" style="display:inline-block;margin-top:12px;padding:10px 24px;background:#1E3A5F;color:#fff;border-radius:4px;text-decoration:none;font-size:13px;font-weight:600">View product</a>
    </div>
  `;

  const wrap = (body: string) => `
    <div style="font-family:'Inter',system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8fafc">
      <div style="background:#fff;border-radius:24px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
        ${body}
      </div>
      <p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:24px">ALEXTRONICS &mdash; Premium Electronics Marketplace</p>
      <p style="text-align:center;font-size:12px;color:#9ca3af">Unsubscribe anytime by replying to this email.</p>
    </div>
  `;

  const safeBody = sanitize(data.body || '');
  const safeSubject = sanitize(data.subject || 'News from ALEXTRONICS');

  const templates: Record<string, string> = {
    'new-arrival': wrap(`
      <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px">New Arrivals Just Landed</h1>
      <p style="font-size:14px;color:#6b7280;margin:0 0 24px">Check out the latest products added to our catalog.</p>
      ${(data.products || []).map(productCard).join('')}
    `),
    'discount': wrap(`
      <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px">Price Drop Alert!</h1>
      <p style="font-size:14px;color:#6b7280;margin:0 0 24px">Great news! Some of your favorite items now have discounts.</p>
      ${(data.products || []).map(productCard).join('')}
    `),
    'product-spotlight': wrap(`
      <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px">Product Spotlight</h1>
      <p style="font-size:14px;color:#6b7280;margin:0 0 24px">We're featuring a curated selection just for you.</p>
      ${(data.products || []).map(productCard).join('')}
    `),
    'custom': wrap(`
      <h1 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px">${safeSubject}</h1>
      <div style="font-size:14px;color:#6b7280;line-height:1.7">${safeBody}</div>
      ${(data.products || []).map(productCard).join('')}
    `),
  };

  return templates[template] || templates.custom;
}

export async function subscribe(req: any, res: any) {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });
    const existing = await Subscriber.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (!existing.active) {
        existing.active = true;
        if (name) existing.name = name;
        await existing.save();
      }
      return res.json({ message: 'Already subscribed', subscriber: existing });
    }
    const subscriber = await Subscriber.create({ email, name });
    res.status(201).json({ message: 'Subscribed successfully', subscriber });
  } catch (err: any) {
    if (err.code === 11000) return res.json({ message: 'Already subscribed' });
    res.status(500).json({ message: 'Failed to subscribe' });
  }
}

export async function getSubscribers(req: any, res: any) {
  try {
    const subscribers = await Subscriber.find({ active: true }).sort({ createdAt: -1 });
    res.json(subscribers);
  } catch {
    res.status(500).json({ message: 'Failed to fetch subscribers' });
  }
}

export async function deleteSubscriber(req: any, res: any) {
  try {
    await Subscriber.findByIdAndDelete(req.params.id);
    res.json({ message: 'Subscriber removed' });
  } catch {
    res.status(500).json({ message: 'Failed to remove subscriber' });
  }
}

export async function sendEmail(req: any, res: any) {
  try {
    const { template, subject, body, productIds } = req.body;
    const subscriberFilter = req.body.subscriberIds?.length
      ? { _id: { $in: req.body.subscriberIds }, active: true }
      : { active: true };
    const subscribers = await Subscriber.find(subscriberFilter);
    if (!subscribers.length) return res.status(400).json({ message: 'No active subscribers' });

    let products: any[] = [];
    if (productIds?.length) {
      products = await Product.find({ _id: { $in: productIds } });
    }

    const transporter = getTransporter();
    if (!transporter) {
      console.log(`Email would send to ${subscribers.length} subscribers (SMTP not configured)`);
      return res.json({ message: `Email queued for ${subscribers.length} subscribers (SMTP not configured, logged only)`, sent: subscribers.length });
    }

    const from = process.env.EMAIL_FROM || 'noreply@electristore.com';
    const html = buildTemplate(template || 'custom', { subject, body, products });
    const text = `Email from ALEXTRONICS\n\n${body || ''}`;

    let sent = 0;
    const errors: string[] = [];
    for (const sub of subscribers) {
      try {
        await transporter.sendMail({ from, to: sub.email, subject: subject || 'News from ALEXTRONICS', text, html });
        sent++;
      } catch (e: any) {
        errors.push(`${sub.email}: ${e.message}`);
      }
    }

    res.json({ message: `Sent to ${sent} of ${subscribers.length} subscribers`, sent, total: subscribers.length, errors: errors.length ? errors : undefined });
  } catch (err: any) {
    res.status(500).json({ message: 'Failed to send email' });
  }
}
