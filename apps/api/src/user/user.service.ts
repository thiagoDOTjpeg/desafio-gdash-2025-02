import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) { }

  async create(user: UserDocument): Promise<UserDocument> {
    const createdUser = await this.userModel.create(user);
    return createdUser;
  }

  async update(user: UserDocument): Promise<UserDocument | null> {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      user._id,
      user,
      { new: true }
    ).exec();
    return updatedUser;
  }

  async getAll(page = 1, limit = 10): Promise<{
    data: UserDocument[],
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel.find().sort({ timestamp: -1 }).skip(skip).limit(limit).exec(),
      this.userModel.countDocuments().exec(),
    ]);
    const totalPages = Math.ceil(total / limit);
    return { data, total, page, limit, totalPages };
  }

  async getById(userId: string): Promise<UserDocument | null> {
    const user = await this.userModel.findById(userId).exec();
    return user;
  }

  async delete(userId: string): Promise<void> {
    await this.userModel.deleteOne({ _id: userId })
  }
}
