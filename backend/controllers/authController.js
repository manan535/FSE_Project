import User from '../models/User.js';
import generateToken from '../utils/generatetoken.js';
import { sendEmail } from '../services/emailService.js';
import { welcomeEmail, loginAlertEmail } from '../templates/emailTemplates.js';
import { createAuditLog } from '../utils/auditLogger.js';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password
    });

    if (user) {
      // Send welcome email (fire-and-forget — don't block response)
      sendEmail(
        user.email,
        '🎉 Welcome to ScaleNest!',
        welcomeEmail(user.name)
      ).catch((err) => console.error('Welcome email failed:', err.message));

      // Audit log: user created (fire-and-forget)
      if (user.currentWorkspace) {
        createAuditLog({
          userId: user._id,
          tenantId: user.currentWorkspace,
          action: 'USER_CREATED',
          description: `New user "${user.name}" registered`,
          req,
          metadata: { email: user.email }
        });
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        currentWorkspace: user.currentWorkspace,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      // Audit log: login (fire-and-forget)
      if (user.currentWorkspace) {
        createAuditLog({
          userId: user._id,
          tenantId: user.currentWorkspace,
          action: 'LOGIN',
          description: `User "${user.name}" logged in`,
          req
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        currentWorkspace: user.currentWorkspace,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('currentWorkspace');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.avatar = req.body.avatar || user.avatar;

      if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        user.email = req.body.email;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        currentWorkspace: updatedUser.currentWorkspace
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};