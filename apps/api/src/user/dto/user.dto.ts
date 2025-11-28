import { IsEmail, IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class UserDto {
  @IsNotEmpty()
  _id?: string;

  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsNumber()
  @IsNotEmpty()
  created_at: number;

  @IsNumber()
  @IsOptional()
  updated_at: number;
}