import { Request, Response } from "express";
import { validationResult } from "express-validator";
import argon2 from "argon2";
import mongoose from "mongoose";
import UserModel from "../models/User";
import TokenService from "../services/TokenService";

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

    const token = await this.tokenService.createAccessToken(
      user._id as mongoose.Types.ObjectId
    );
    const refreshToken = await this.tokenService.createRefreshToken(
      user._id as mongoose.Types.ObjectId
    );
    return res.json({
      accessToken: token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name || user.email.split("@")[0],
        email: user.email,
      },
    });
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
