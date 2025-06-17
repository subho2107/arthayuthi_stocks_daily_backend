import mongoose from "mongoose";
import bcrypt from "bcrypt";

export interface UserSchemaInterface extends Document {
    name?: string;
    email: string;
    password: string;
    comparePassword(candidatePassword: string): Promise<boolean>;
  }

const userSchema = new mongoose.Schema<UserSchemaInterface>(
  {
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
  },
  {
    timestamps: true,
  }
);
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare candidate password during login
userSchema.methods.comparePassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model("User", userSchema);
