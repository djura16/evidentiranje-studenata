import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  @ApiOperation({ summary: 'Registracija novog korisnika' })
  @ApiResponse({ status: 201, description: 'Korisnik uspešno registrovan' })
  @ApiResponse({ status: 409, description: 'Email već postoji' })
  async register(@Body() createAuthDto: CreateUserDto) {
    return this.authService.register(createAuthDto);
  }

  @Post('/login')
  @ApiOperation({ summary: 'Prijava korisnika' })
  @ApiResponse({ status: 200, description: 'Uspešna prijava' })
  @ApiResponse({ status: 401, description: 'Neispravan email ili lozinka' })
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Post('/refresh')
  @ApiOperation({ summary: 'Osvežavanje access tokena' })
  @ApiResponse({ status: 200, description: 'Novi access token' })
  @ApiResponse({ status: 401, description: 'Nevažeći refresh token' })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }
}
