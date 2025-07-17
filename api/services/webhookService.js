const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'flowbit-webhook-secret-2025';

const verifyWebhookSecret = (providedSecret) => {
  return providedSecret === WEBHOOK_SECRET;
};

const generateWebhookSecret = () => {
  return WEBHOOK_SECRET;
};

module.exports = {
  verifyWebhookSecret,
  generateWebhookSecret
};
