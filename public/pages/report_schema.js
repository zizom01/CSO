const mongoose = require('mongoose');

// Counter Schema and Model
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // _id is the unique identifier for the counter
  sequenceValue: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

// Function to Get Next Sequence Value
const getNextSequenceValue = async (sequenceName) => {
  const sequenceDocument = await Counter.findByIdAndUpdate(
    sequenceName, // The name of the sequence, e.g., 'myCounter'
    { $inc: { sequenceValue: 1 } }, // Increment the sequence value by 1
    { new: true, upsert: true } // Create the document if it doesn't exist
  );
  return sequenceDocument.sequenceValue;
};

// Report Schema
const reportSchema = new mongoose.Schema({
    caseId: { type: Number}, // Will hold the incremented ID
    title: { type: String },
    description: { type: String},
    toolsUsed: { type: [String], default: [] },
    alertPolicy: { type: [String], default: [] },
    sourceIntel: { type: String },
    reportNum: { type: Number },
    letterNum: { type: Number },
    User: {type: String },
    analysis: { type: String },
    destinationIPs: { type: [Number], default: [] },
    sourceIPs: { type: [Number], default: [] },
    iocType: { type: [String], default: []},
    iocs: { type: [String], default: [] },
    recommendations: { type: String},
    isActive: { type: Boolean},
    ttps: { type: [String], default: [] },
    fileType: { type: String},
    files: [{ type: String }],
    follow: {type: Date}
  }, {
    timestamps: true // Automatically adds `createdAt` and `updatedAt`
  });
  

// Pre-save Hook to Increment caseId
reportSchema.pre('save', async function (next) {
  if (this.isNew) {
    this.caseId = await getNextSequenceValue('myCounter'); // Generates the next sequence value for caseId
  }
  next();
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;


