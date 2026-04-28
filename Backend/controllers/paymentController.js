const axios = require('axios');
const crypto = require('node:crypto');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
const PLAN_AMOUNT = 100000; // ₦1000 in kobo

exports.initializePayment = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const reference = `CINEMAX_${user._id}_${Date.now()}`;

    const response = await axios.post('https://api.paystack.co/transaction/initialize', {
      email: user.email,
      amount: PLAN_AMOUNT,
      reference,
      currency: 'NGN',
      metadata: { userId: user._id.toString(), plan: 'standard', userName: user.name },
      callback_url: `${process.env.CLIENT_URL}/payment/callback`
    }, { headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` } });

    await Transaction.create({
      user: user._id, reference, amount: PLAN_AMOUNT / 100,
      currency: 'NGN', plan: 'standard', status: 'pending'
    });

    res.json({ success: true, authorizationUrl: response.data.data.authorization_url, reference });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;
    const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });

    const data = response.data.data;
    const transaction = await Transaction.findOne({ reference });
    if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

    if (data.status === 'success') {
      transaction.status = 'success';
      transaction.paidAt = new Date();
      transaction.metadata = data;
      await transaction.save();

      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);

      await User.findByIdAndUpdate(transaction.user, {
        'subscription.plan': 'standard',
        'subscription.status': 'active',
        'subscription.startDate': new Date(),
        'subscription.expiryDate': expiryDate
      });

      res.json({ success: true, message: 'Subscription activated', transaction });
    } else {
      transaction.status = 'failed';
      await transaction.save();
      res.status(400).json({ success: false, message: 'Payment not successful' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.webhook = async (req, res) => {
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET).update(req.body).digest('hex');
  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  const event = JSON.parse(req.body);
  if (event.event === 'charge.success') {
    const { reference, metadata } = event.data;
    const transaction = await Transaction.findOne({ reference });
    if (transaction && transaction.status !== 'success') {
      transaction.status = 'success';
      transaction.paidAt = new Date();
      await transaction.save();
      const expiry = new Date(); expiry.setMonth(expiry.getMonth() + 1);
      await User.findByIdAndUpdate(metadata.userId, {
        'subscription.plan': 'standard', 'subscription.status': 'active',
        'subscription.startDate': new Date(), 'subscription.expiryDate': expiry
      });
    }
  }
  res.sendStatus(200);
};

exports.getTransactionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id }).sort('-createdAt').limit(20);
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};