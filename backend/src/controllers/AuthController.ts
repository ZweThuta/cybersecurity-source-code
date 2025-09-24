import { Request, Response } from "express";
import { validationResult } from "express-validator";
import argon2 from "argon2";
import mongoose from "mongoose";
import UserModel from "../models/User";
import TokenService from "../services/TokenService";
import EmailService from "../services/EmailService";

export default class AuthController {
  constructor(private tokenService: TokenService) {}

  register = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;
    const existing = await UserModel.findOne({ email });
    if (existing) return res.status(409).json({ message: "User exists" });

    const hash = await argon2.hash(password);
    const user = await UserModel.create({ name, email, passwordHash: hash });

    // generate access token
    const token = await this.tokenService.createAccessToken(
      user._id as mongoose.Types.ObjectId
    );

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name || user.email.split("@")[0],
        email: user.email,
      },
      accessToken: token,
    });
  };

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await argon2.verify(user.passwordHash, password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    // MFA: issue OTP to email and require verification before issuing tokens
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const codeHash = await argon2.hash(code);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const OtpCode = (await import("../models/OtpCode")).default;
    await OtpCode.create({ userId: user._id, codeHash, expiresAt, channel: "email" });

    const emailer = new EmailService();
    try {
      await emailer.sendOtp(user.email, code);
    } catch (e) {
      return res.status(500).json({ message: "Failed to send OTP email" });
    }

    return res.json({ mfaRequired: true, userId: user._id });
  };

  verifyOtp = async (req: Request, res: Response) => {
    const { userId, code } = req.body as { userId: string; code: string };
    if (!userId || !code) return res.status(400).json({ message: "Missing fields" });
    const OtpCode = (await import("../models/OtpCode")).default;
    const record = await OtpCode.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      consumed: false,
      channel: "email",
    }).sort({ createdAt: -1 });
    if (!record) return res.status(401).json({ message: "OTP not found" });
    if (record.expiresAt.getTime() < Date.now()) return res.status(401).json({ message: "OTP expired" });
    const ok = await argon2.verify(record.codeHash, code);
    if (!ok) return res.status(401).json({ message: "Invalid OTP" });
    record.consumed = true;
    await record.save();

    // Issue tokens after successful OTP
    const token = await this.tokenService.createAccessToken(new mongoose.Types.ObjectId(userId));
    const refreshToken = await this.tokenService.createRefreshToken(new mongoose.Types.ObjectId(userId));
    const user = await UserModel.findById(userId);
    return res.json({
      accessToken: token,
      refreshToken,
      user: user
        ? { id: user._id, name: user.name || user.email.split("@")[0], email: user.email }
        : undefined,
    });
  };

  resendOtp = async (req: Request, res: Response) => {
    const { userId } = req.body as { userId: string };
    if (!userId) return res.status(400).json({ message: "Missing userId" });
    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await argon2.hash(code);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const OtpCode = (await import("../models/OtpCode")).default;
    await OtpCode.create({ userId: user._id, codeHash, expiresAt, channel: "email" });

    const emailer = new EmailService();
    try {
      await emailer.sendOtp(user.email, code);
      return res.json({ message: "OTP resent" });
    } catch (e) {
      return res.status(500).json({ message: "Failed to send OTP email" });
    }
  };

  refresh = async (req: Request, res: Response) => {
    const { userId, refreshToken } = req.body as {
      userId: string;
      refreshToken: string;
    };
    if (!userId || !refreshToken)
      return res.status(400).json({ message: "Missing fields" });

    try {
      // Verify existing refresh token
      await this.tokenService.verifyRefreshToken(userId, refreshToken);

      // Rotate refresh token and issue new access token
      const newAccessToken = await this.tokenService.createAccessToken(
        new mongoose.Types.ObjectId(userId)
      );
      const newRefreshToken = await this.tokenService.rotateRefreshToken(
        new mongoose.Types.ObjectId(userId),
        refreshToken
      );

      return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err: any) {
      return res.status(401).json({ message: err?.message || "Unauthorized" });
    }
  };

  logout = async (req: Request, res: Response) => {
    const { userId, refreshToken } = req.body as {
      userId: string;
      refreshToken: string;
    };
    if (!userId || !refreshToken)
      return res.status(400).json({ message: "Missing fields" });

    try {
      // Revoke the provided refresh token if it exists
      const records = await (await import("../models/RefreshToken")).default.find({
        userId: new mongoose.Types.ObjectId(userId),
        revoked: false,
      });
      for (const r of records) {
        const ok = await (await import("argon2")).default.verify(r.tokenHash, refreshToken);
        if (ok) {
          r.revoked = true;
          await r.save();
          break;
        }
      }
      return res.json({ message: "Logged out" });
    } catch {
      return res.json({ message: "Logged out" });
    }
  };

  whoami = async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { name, email } = req.user;
    return res.json({
      name: name || email.split("@")[0],
      email,
    });
  };

  securityEvents = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const RefreshToken = (await import("../models/RefreshToken")).default;
    const userId = req.user.id;
    const records = await RefreshToken
      .find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .limit(20);

    const events = records.flatMap(r => {
      const arr: Array<{ type: string; at: Date; meta?: Record<string, unknown> }> = [];
      arr.push({ type: "Refresh token issued", at: r.createdAt, meta: { userAgent: r.userAgent, ip: r.ip } });
      if (r.revoked) arr.push({ type: "Session revoked", at: r.updatedAt, meta: { userAgent: r.userAgent, ip: r.ip } });
      if (r.replacedByTokenHash) arr.push({ type: "Token rotated", at: r.updatedAt, meta: { userAgent: r.userAgent, ip: r.ip } });
      return arr;
    }).sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 20);

    return res.json(events.map(e => ({
      type: e.type,
      at: e.at,
      userAgent: e.meta?.userAgent as string | undefined,
      ip: e.meta?.ip as string | undefined,
    })));
  };
}
