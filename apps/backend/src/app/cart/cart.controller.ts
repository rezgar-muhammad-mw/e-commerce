import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  getCart(@Request() req: any) {
    return this.cartService.getCart(req.user.userId);
  }

  @Post('items')
  addItem(@Request() req: any, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(req.user.userId, dto);
  }

  @Patch('items/:id')
  updateItem(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(req.user.userId, id, dto);
  }

  @Delete('items/:id')
  removeItem(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.cartService.removeItem(req.user.userId, id);
  }
}
