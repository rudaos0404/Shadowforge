import { Controller, Get, Post, Body } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { GameService } from '../services/game.service';
import { BattleService } from '../services/battle.service';
import { ShopService } from '../services/shop.service';

@Controller()
export class AppController {
  constructor(
    private readonly userService: UserService,
    private readonly gameService: GameService,
    private readonly battleService: BattleService,
    private readonly shopService: ShopService,
  ) { }

  @Post('game/start')
  startGame(@Body() body: { userId: number }) {
    return this.gameService.startGame(body.userId);
  }

  @Get('users/me')
  getMe() {
    return this.userService.getMe(1); // Dev: Hardcode user 1
  }

  @Post('game/option')
  selectOption(@Body() body: { userId: number, selection: string }) {
    return this.gameService.selectOption(body.userId, body.selection);
  }

  @Post('game/next')
  nextTurn(@Body() body: { userId: number }) {
    return this.gameService.nextTurn(body.userId);
  }

  @Post('game/confirm-rest')
  confirmRest(@Body() body: { userId: number }) {
    return this.gameService.confirmRest(body.userId);
  }

  @Post('battle')
  battle(@Body() body: { userId: number, monsterId: number, action: string, useLucky?: boolean }) {
    return this.battleService.battleAction(body.userId, body.monsterId, body.action, body.useLucky || false);
  }

  @Post('battle/reward')
  claimReward(@Body() body: { userId: number, reward: 'STR' | 'AGI' | 'POTION' }) {
    return this.battleService.claimVictoryReward(body.userId, body.reward);
  }

  @Post('battle/escape')
  escape(@Body() body: { userId: number }) {
    return this.battleService.escape(body.userId);
  }

  @Post('use-potion')
  usePotion(@Body() body: { userId: number }) {
    return this.shopService.usePotion(body.userId);
  }

  @Post('equip-item')
  equipItem(@Body() body: { userId: number, itemId: string }) {
    return this.shopService.equipItem(body.userId, body.itemId);
  }

  @Post('buy-item')
  buyItem(@Body() body: { userId: number, itemId: string }) {
    return this.shopService.buyItem(body.userId, body.itemId);
  }
}