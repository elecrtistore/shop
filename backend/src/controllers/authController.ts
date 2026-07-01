import { Request, Response } from 'express';
import { getRoleForEmail } from '../utils/userRoles';
import Admin from '../models/Admin';

export async function getProfile(req: Request, res: Response) {
  const firebaseUser = res.locals.firebaseUser;
  if (!firebaseUser || !firebaseUser.email) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const role = await getRoleForEmail(firebaseUser.email, firebaseUser.uid);
  res.json({
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.name || firebaseUser.email,
    role
  });
}

export async function updateProfile(req: Request, res: Response) {
  const firebaseUser = res.locals.firebaseUser;
  if (!firebaseUser || !firebaseUser.email) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { displayName } = req.body;
  if (!displayName) {
    return res.status(400).json({ message: 'displayName is required' });
  }

  const role = await getRoleForEmail(firebaseUser.email, firebaseUser.uid);
  res.json({
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName,
    role
  });
}

export async function signup(req: Request, res: Response) {
  const firebaseUser = res.locals.firebaseUser;
  if (!firebaseUser || !firebaseUser.email) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { role, adminCode, displayName } = req.body;

  if (role === 'Admin') {
    const secretCode = process.env.ADMIN_SECRET_CODE;
    if (!secretCode || adminCode !== secretCode) {
      return res.status(403).json({ message: 'Invalid admin code.' });
    }

    const existingAdmin = await Admin.findOne({});
    if (existingAdmin) {
      return res.status(403).json({ message: 'An admin account already exists. Only one admin is allowed.' });
    }

    await Admin.create({ firebaseUID: firebaseUser.uid, email: firebaseUser.email, role: 'admin' });
  }

  const assignedRole = role === 'Admin' ? 'Admin' : await getRoleForEmail(firebaseUser.email, firebaseUser.uid);
  res.json({
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: displayName || firebaseUser.name || firebaseUser.email,
    role: assignedRole
  });
}
