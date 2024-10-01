const mongoose = require('mongoose');

// Counter Schema and Model
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // _id is the unique identifier for the counter
  sequenceValue: { type: Number, default: 0 },
});

const Counter2 = mongoose.model('Counter2', counterSchema);

// Function to Get Next Sequence Value
const getNextSequenceValue = async (sequenceName) => {
  const sequenceDocument = await Counter2.findByIdAndUpdate(
    sequenceName, // The name of the sequence, e.g., 'myCounter'
    { $inc: { sequenceValue: 1 } }, // Increment the sequence value by 1
    { new: true, upsert: true } // Create the document if it doesn't exist
  );
  return sequenceDocument.sequenceValue;
};

const reportSchema2 = new mongoose.Schema({
    caseId: { type: Number}, // Will hold the incremented ID
    reportId: { type: Number }, // Will hold the incremented ID
    title: { type: String },
    description: { type: String},
    toolsUsed: { type: [String], default: [] },
    alertPolicy: { type: [String], default: [] },
    sourceIntel: { type: String },
    reportNum: { type: String },
    letterNum: { type: String },
    User: {type: String },
    analysis: { type: String },
    destinationIPs: { type: [String], default: [] },
    sourceIPs: { type: [String], default: [] },
    portDest: { type: [String] },
    portSrc: { type: [String] },
    iocType: { type: [String], default: []},
    iocs: { type: [String], default: [] },
    recommendations: { type: String},
    isActive: { type: Boolean},
    ttps: { type: [String], default: [] },
    fileType: { type: String},
    files: [{ type: String }],
    follow: {type: Date }
  }, {
    timestamps: true // Automatically adds `createdAt` and `updatedAt`
  });
  
// Pre-save Hook to Increment caseId
reportSchema2.pre('save', async function (next) {
  if (this.isNew) {
    this.reportId = await getNextSequenceValue('myCounter'); // Generates the next sequence value for caseId
  }
  next();
});

  const Report2 = mongoose.model('Report2', reportSchema2);

  module.exports = Report2;
