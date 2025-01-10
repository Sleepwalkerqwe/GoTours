const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
// const { StringDecoder } = require('string_decoder');
// const { URL } = require('url');
// const { isLowercase } = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User must have a name'],
  },
  email: {
    type: String,
    required: [true, 'User must have an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  password: {
    type: String,
    required: [true, 'User must have a password'],
    validator: [validator.isEmail, 'Please provide a password'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm password'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'A password should be equal each other',
    },
  },
  passwordChangedAt: Date,
});
userSchema.pre('save', async function (next) {
  // Only run this function if password was modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost 10
  this.password = await bcrypt.hash(this.password, 10);

  // Delete password confirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};
const User = mongoose.model('User', userSchema);

module.exports = User;
