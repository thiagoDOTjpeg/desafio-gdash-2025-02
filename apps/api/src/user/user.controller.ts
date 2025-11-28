import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Logger, Post, Put, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { UserDocument } from './schemas/user.schema';
import { UserService } from './user.service';

@Controller('user')
@UsePipes(new ValidationPipe({ transform: true }))
export class UserController {
  private readonly logger = new Logger(UserController.name)

  constructor(private readonly userService: UserService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUser: CreateUserDto) {
    const entity = this.mapCreateUserToEntity(createUser);
    const savedUser = await this.userService.create(entity as UserDocument);
    return {
      message: 'Usuário criado com sucesso',
      id: savedUser._id,
      user: this.mapUserToDto(savedUser),
    };
  }

  @Put(":id")
  @HttpCode(HttpStatus.OK)
  async update(@Body() updateUser: UpdateUserDto, @Body('_id') id: string) {
    const entity = { _id: id, ...this.mapUpdateUserToEntity(updateUser) } as UserDocument;
    const updatedUser = await this.userService.update(entity);
    return updatedUser ? this.mapUserToDto(updatedUser) : { message: 'Usuário não encontrado' };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAll(@Body('page') page: number = 1, @Body('limit') limit: number = 10) {
    const result = await this.userService.getAll(page, limit);
    return {
      ...result,
      data: result.data.map(this.mapUserToDto),
    };
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  async getById(@Body('id') id: string) {
    const user = await this.userService.getById(id);
    return user ? this.mapUserToDto(user) : { message: 'Usuário não encontrado' };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Body('id') id: string) {
    await this.userService.delete(id);
  }

  private mapUserToDto(user: UserDocument): UserDto {
    return {
      _id: String(user._id),
      username: user.username,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  private mapCreateUserToEntity(dto: CreateUserDto): Partial<UserDocument> {
    return {
      username: dto.username,
      email: dto.email,
      password: dto.password,
      created_at: new Date().getTime(),
      updated_at: new Date().getTime(),
    };
  }

  private mapUpdateUserToEntity(dto: UpdateUserDto): Partial<UserDocument> {
    return {
      email: dto.email,
      password: dto.password
    };
  }
}

