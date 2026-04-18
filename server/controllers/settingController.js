import Setting from '../models/Setting.js';
import mongoose from 'mongoose';

const isMockMode = () => mongoose.connection.readyState !== 1;

let mockSettings = [
  { key: 'company_name', value: 'VyorAI Technologies', description: 'Name of the organization' },
  { key: 'interview_timeout', value: 3600, description: 'Interview session timeout in seconds' },
  { key: 'ai_model', value: 'gemini-1.5-flash', description: 'Default AI model for generation' },
  { key: 'proctoring_strictness', value: 'medium', description: 'Warning threshold for auto-termination' }
];

export const getSettings = async (req, res) => {
  try {
    if (isMockMode()) return res.json(mockSettings);
    const settings = await Setting.find({});
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

export const updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body;
    if (isMockMode()) {
      const idx = mockSettings.findIndex(s => s.key === key);
      if (idx !== -1) mockSettings[idx].value = value;
      else mockSettings.push({ key, value });
      return res.json({ message: 'Setting updated (mock)' });
    }
    
    await Setting.findOneAndUpdate(
      { key },
      { value, updatedAt: new Date(), updatedBy: req.user.id },
      { upsert: true }
    );
    res.json({ message: 'Setting updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update setting' });
  }
};
