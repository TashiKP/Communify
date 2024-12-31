import { Schema as _Schema, model } from 'mongoose';
const Schema = _Schema;

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

const TTSIntegration = model('TTSIntegration', ttsIntegrationSchema, 'TTS_INTEGRATION');

export default TTSIntegration;
