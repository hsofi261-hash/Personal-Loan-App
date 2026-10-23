import { Request, Response } from 'express';
import { Loan } from '../models/LoanModel';
import { User } from '../models/UserModel';
import { Op } from 'sequelize';

// 1. Mock Phone Login / Send OTP
export const loginWithPhone = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Find or create mock user
    const [user] = await User.findOrCreate({ where: { phoneNumber } });

    // Generate Mock 4-Digit OTP
    const mockOtp = Math.floor(1000 + Math.random() * 9000);
    
    // Print OTP in server log as requested by assignment
    console.log(`\n==============================`);
    console.log(`[MOCK OTP] For ${phoneNumber}: ${mockOtp}`);
    console.log(`==============================\n`);

    return res.status(200).json({ message: 'OTP sent successfully (check server logs)', userId: user.id });
  } catch (error) {
    return res.status(500).json({ error: 'Server error during login' });
  }
};

// 2. Add Loan Entry
export const createLoan = async (req: Request, res: Response) => {
  try {
    const { userId, friendName, amount, dueDate, reason } = req.body;
    
    // If multer processed an uploaded file, create its accessible URL path
    const receiptUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.receiptUrl || null);

    const loan = await Loan.create({
      userId: Number(userId),
      friendName,
      amount: Number(amount),
      dueDate: new Date(dueDate),
      receiptUrl,
      reason: reason || null,
    });

    return res.status(201).json(loan);
  } catch (error) {
    console.error('Error creating loan:', error);
    return res.status(500).json({ error: 'Failed to create loan entry' });
  }
};

// 3. Mark Loan as Repaid
export const markAsRepaid = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findByPk(id as any);
    if (!loan) {
      return res.status(404).json({ error: 'Loan entry not found' });
    }

    loan.status = 'REPAID';
    await loan.save();

    return res.status(200).json({ message: 'Loan marked as repaid', loan });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update loan status' });
  }
};

// 4. Get All Entries
export const getLoans = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId || req.headers['user-id'];

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const loans = await Loan.findAll({
      where: { userId: Number(userId) },
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json(loans);
  } catch (error) {
    console.error('Error fetching loans:', error);
    return res.status(500).json({ error: 'Failed to fetch loans' });
  }
};

// 2. Get Summary Endpoint for the Logged-in User
export const getSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId || req.headers['user-id'];

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const loans = await Loan.findAll({
      where: { userId: Number(userId) },
    });

    const today = new Date().toISOString().split('T')[0]; // Current date string YYYY-MM-DD

    let totalLent = 0;
    let totalRepaid = 0;
    let overdueAmount = 0;

    loans.forEach((loan) => {
      const amt = Number(loan.amount);
      totalLent += amt;

      if (loan.status === 'REPAID') {
        totalRepaid += amt;
      }

      // Check if pending and due date has passed
      if (loan.status === 'PENDING' && String(loan.dueDate) < today) {
        overdueAmount += amt;
      }
    });

    return res.status(200).json({
      totalLent,
      totalRepaid,
      overdueAmount,
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    return res.status(500).json({ error: 'Failed to fetch summary' });
  }
};

export const getLoanDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const loan = await Loan.findByPk(id as any, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'phoneNumber'],
        },
      ],
    });

    if (!loan) {
      return res.status(404).json({ error: 'Loan entry not found' });
    }

    return res.status(200).json(loan);
  } catch (error) {
    console.error('Error fetching loan details:', error);
    return res.status(500).json({ error: 'Failed to fetch loan details' });
  }
};