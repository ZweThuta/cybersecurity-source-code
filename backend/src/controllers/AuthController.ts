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
    const token = await this.tokenService.createAccessToken(user._id as mongoose.Types.ObjectId);

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, name: user.name || user.email.split('@')[0], email: user.email },
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
    return res.json({ 
      accessToken: token,
      user: { id: user._id, name: user.name || user.email.split('@')[0], email: user.email }
    });
  };

  whoami = async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { name, email } = req.user;
    return res.json({ 
      name: name || email.split('@')[0], 
      email 
    });
  };
}
