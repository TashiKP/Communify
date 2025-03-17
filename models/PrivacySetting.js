import { Schema as _Schema, model } from 'mongoose';
const Schema = _Schema;

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

const PrivacySettings = model('PrivacySettings', privacySettingsSchema, 'PRIVACY_SETTINGS');

export default PrivacySettings;
