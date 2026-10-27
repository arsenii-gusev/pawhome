import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthUser } from '../common/auth-user';
import { Role } from '../common/role.enum';
import { AdoptionsService } from './adoptions.service';
import { CreateAdoptionDto } from './dto/create-adoption.dto';
import { QueryAdoptionsDto } from './dto/query-adoptions.dto';

@ApiTags('adoptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('adoptions')
export class AdoptionsController {
  constructor(private readonly adoptions: AdoptionsService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAdoptionDto) {
    return this.adoptions.create(user.id, dto);
  }

  @Get('my')
  findMine(@CurrentUser() user: AuthUser) {
    return this.adoptions.findMine(user.id);
  }

  @Get()
  @Roles(Role.Admin)
  findAll(@Query() query: QueryAdoptionsDto) {
    return this.adoptions.findAll(query.status);
  }

  @Patch(':id/approve')
  @Roles(Role.Admin)
  approve(@Param('id', ParseUUIDPipe) id: string) {
    return this.adoptions.approve(id);
  }

  @Patch(':id/reject')
  @Roles(Role.Admin)
  reject(@Param('id', ParseUUIDPipe) id: string) {
    return this.adoptions.reject(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  cancel(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.adoptions.cancel(id, user.id);
  }
}
