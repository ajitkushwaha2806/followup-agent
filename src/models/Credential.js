import mongoose from "mongoose";

const CredentialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Credential name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    cookie: {
      type: String,
      required: [true, "Zomato cookie is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED"],
      default: "EXPIRED",
    },
    email: {
      type: String,
      trim: true,
    },
    userId: {
      type: String,
      trim: true,
    },
    userDetails: {
      type: mongoose.Schema.Types.Mixed,
    },
    lastVerifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Credential ||
  mongoose.model("Credential", CredentialSchema);
