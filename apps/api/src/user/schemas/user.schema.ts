import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserDocument = User & Document

@Schema({ collection: "users" })
export class User {
  @Prop({ required: true, index: true, unique: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  created_at: number;

  @Prop({ required: false })
  updated_at: number;
}

export const UserSchema = SchemaFactory.createForClass(User);