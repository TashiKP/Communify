import { Schema as _Schema, model } from 'mongoose';
const Schema = _Schema;

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

const Profile = model('Profile', profileSchema, 'PROFILES');

export default Profile;
