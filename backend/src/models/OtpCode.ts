import mongoose, { Schema, Document } from "mongoose";

export interface IOtpCode extends Document {
  userId: mongoose.Types.ObjectId;
  codeHash: string;
  expiresAt: Date;
  consumed: boolean;
  channel: "email";
  createdAt: Date;
  updatedAt: Date;
}

const otpCodeSchema = new Schema<IOtpCode>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    consumed: { type: Boolean, default: false },
    channel: { type: String, enum: ["email"], default: "email" },
  },
  { timestamps: true }
);

const OtpCodeModel = mongoose.model<IOtpCode>("OtpCode", otpCodeSchema);
export default OtpCodeModel;


