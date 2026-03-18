import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getWishlist(@Request() req: any) {
    return this.wishlistService.getWishlist(req.user.userId);
  }

  @Post('items')
  addItem(@Request() req: any, @Body() dto: AddToWishlistDto) {
    return this.wishlistService.addItem(req.user.userId, dto);
  }

  @Delete('items/:id')
  removeItem(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.wishlistService.removeItem(req.user.userId, id);
  }
}
