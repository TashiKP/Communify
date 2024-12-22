const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create the user schema
const userSchema = new Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password_hash: {
    type: String,
    required: true,
  },
  phone_number: {
    type: String,
    required: true,
  },
  user_type: {
    type: String,
    required: true,
  },
  preferred_language: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
});

// Create and export the model
const User = mongoose.model('User', userSchema, 'USERS');
module.exports = User;
