const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true
    },
    totalExpense: {
      type: Number,
      default: 0
    },
    categoryBreakdown: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
