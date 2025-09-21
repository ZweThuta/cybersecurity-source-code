import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name?: string;
  email: string;
  passwordHash: string;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: false }, // Make optional for existing users
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
});

const UserModel = mongoose.model<IUser>("User", userSchema);
export default UserModel;
