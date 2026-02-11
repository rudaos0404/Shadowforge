import { Module } from '@nestjs/common';
import { AppController } from '../controllers/app.controller';
import { UserService } from '../services/user.service';
import { GameService } from '../services/game.service';
import { BattleService } from '../services/battle.service';
import { ShopService } from '../services/shop.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entity/user.entity';
import { Monster } from '../entity/monster.entity';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
      serveRoot: '/',
    }),
    TypeOrmModule.forRoot({
      type: 'mariadb',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: 'game_db',
      entities: [User, Monster],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([User, Monster]),
  ],
  controllers: [AppController],
  providers: [
    UserService,
    GameService,
    BattleService,
    ShopService,
  ],
})
export class AppModule { }
