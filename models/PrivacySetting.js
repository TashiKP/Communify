const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const privacySettingsSchema = new Schema({
  user_id: {
    type: String,
    required: true,
    ref: 'User',
  },
  data_sharing_preference: {
    type: String,
    required: true,
  },
  parental_controls: {
    type: String,
    required: true,
  },
  screen_time_limits: {
    type: Number,
    required: true,
  },
  restricted_content_categories: {
    type: String,
    required: true,
  },
});

const PrivacySettings = mongoose.model('PrivacySettings', privacySettingsSchema, 'PRIVACY_SETTINGS');

module.exports = PrivacySettings;
