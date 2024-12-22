const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const profileSchema = new Schema({
  user_id: {
    type: String,
    required: true,
    ref: 'User',
  },
  symbol_grid_layout: {
    type: String,
    required: true,
  },
  font_size: {
    type: Number,
    required: true,
  },
  theme: {
    type: String,
    required: true,
  },
  symbol_display_mode: {
    type: String,
    required: true,
  },
  favorite_phrases: {
    type: String,
    required: false,
  },
});

const Profile = mongoose.model('Profile', profileSchema, 'PROFILES');

module.exports = Profile;
