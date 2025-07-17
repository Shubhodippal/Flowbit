const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['Admin', 'User'],
    default: 'User'
  },
  customerId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  refreshTokens: [{
    token: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days in seconds
    }
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT tokens
userSchema.methods.generateTokens = function() {
  const jwt = require('jsonwebtoken');
  const crypto = require('crypto');
  
  // Add a random nonce to ensure tokens are always unique
  const nonce = crypto.randomBytes(8).toString('hex');
  
  // Access token (short-lived)
  const accessToken = jwt.sign(
    { 
      userId: this._id, 
      customerId: this.customerId, 
      role: this.role,
      type: 'access',
      nonce: nonce
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // 15 minutes
  );

  // Refresh token (long-lived)
  const refreshToken = jwt.sign(
    {
      userId: this._id,
      type: 'refresh',
      nonce: nonce + '_refresh'
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' } // 7 days
  );

  return { accessToken, refreshToken };
};

// Add refresh token to user
userSchema.methods.addRefreshToken = async function(refreshToken) {
  // Remove old tokens (keep only last 5 for multiple device support)
  if (this.refreshTokens.length >= 5) {
    this.refreshTokens = this.refreshTokens.slice(-4);
  }
  
  this.refreshTokens.push({ token: refreshToken });
  await this.save();
};

// Remove refresh token
userSchema.methods.removeRefreshToken = async function(refreshToken) {
  this.refreshTokens = this.refreshTokens.filter(tokenObj => tokenObj.token !== refreshToken);
  await this.save();
};

// Check if refresh token is valid
userSchema.methods.hasValidRefreshToken = function(refreshToken) {
  return this.refreshTokens.some(tokenObj => tokenObj.token === refreshToken);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
