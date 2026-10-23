import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import { User } from './UserModel';

interface LoanAttributes {
  id: number;
  userId: number;
  friendName: string;
  amount: number;
  dueDate: Date;
  status: string; // 'PENDING' | 'REPAID'
  receiptUrl?: string | null;
  reason?: string | null; // Added reason field
  createdAt?: Date;
}

interface LoanCreationAttributes extends Optional<LoanAttributes, 'id' | 'status' | 'receiptUrl' | 'reason'> {}

export class Loan extends Model<LoanAttributes, LoanCreationAttributes> implements LoanAttributes {
  declare id: number;
  declare userId: number;
  declare friendName: string;
  declare amount: number;
  declare dueDate: Date;
  declare status: string;
  declare receiptUrl: string | null;
  declare reason: string | null; // Added reason declaration
  declare readonly createdAt: Date;
}

Loan.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
    },
    friendName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'friend_name',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: 'due_date',
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'PENDING',
      allowNull: false,
    },
    receiptUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'receipt_url',
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'reason',
    },
  },
  {
    sequelize,
    tableName: 'loans',
    timestamps: true,
    updatedAt: false,
  }
);

// Establish Associations
User.hasMany(Loan, { foreignKey: 'userId', as: 'loans' });
Loan.belongsTo(User, { foreignKey: 'userId', as: 'user' });