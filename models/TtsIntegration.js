const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ttsIntegrationSchema = new Schema({
  tts_id: {
    type: String,
    required: true,
    unique: true,
  },
  language_supported: {
    type: String,
    required: true,
  },
  version: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  voice_options: {
    type: String,
    required: true,
  },
  user_preferences_pitch: {
    type: String,
    required: true,
  },
  user_preferences_speed: {
    type: String,
    required: true,
  },
});

const TTSIntegration = mongoose.model('TTSIntegration', ttsIntegrationSchema, 'TTS_INTEGRATION');

module.exports = TTSIntegration;
