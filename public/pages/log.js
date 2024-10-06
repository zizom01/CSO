const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  reportId: {
    type: Number,
    ref: 'Report',
    required: true
  },
  unit: {
    type: String,  // User's unit
    required: true
  },
  role: {
    type: String,  // User's role
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  caseId: {type: Number}
});

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
