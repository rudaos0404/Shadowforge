import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Monster } from '../entity/monster.entity';
import { GameState } from '../entity/user.entity';
import { MonsterGrade, MONSTER_BOOK } from '../data/monsters.data';
import { WEAPON_BOOK } from '../data/items.data';
import { UserService } from './user.service';

@Injectable()
export class BattleService {
    constructor(
        @InjectRepository(Monster) private monsterRepo: Repository<Monster>,
        private readonly userService: UserService,
    ) { }

    async spawnMonster(turn: number) {
        const availableMonsters = MONSTER_BOOK.filter(m =>
            m.minTurn <= turn && m.grade !== MonsterGrade.BOSS
        );

        let spec = availableMonsters.length > 0
            ? availableMonsters[Math.floor(Math.random() * availableMonsters.length)]
            : MONSTER_BOOK[0];

        const scaling = 1 + (turn * 0.05);

        const newMonster = this.monsterRepo.create({
            specId: spec.id,
            name: spec.name,
            maxHp: Math.floor(spec.baseHp * scaling),
            hp: Math.floor(spec.baseHp * scaling),
            attack: Math.floor(spec.baseAtk * scaling),
            defense: spec.def,
            agi: Math.floor(spec.baseAgi * scaling),
            nextAction: Math.random() < 0.7 ? 'ATTACK' : 'DEFENSE',
            rewardGold: Math.floor(spec.gold * scaling),
            imagePath: spec.image
        });

        return await this.monsterRepo.save(newMonster);
    }

    async spawnRandomBoss(turn: number) {
        const lords = MONSTER_BOOK.filter(m => m.grade === MonsterGrade.BOSS);
        const lordSpec = lords[Math.floor(Math.random() * lords.length)];
        const scaling = 1 + (turn * 0.1);

        const boss = this.monsterRepo.create({
            specId: lordSpec.id,
            name: lordSpec.name,
            maxHp: Math.floor(lordSpec.baseHp * scaling),
            hp: Math.floor(lordSpec.baseHp * scaling),
            attack: Math.floor(lordSpec.baseAtk * scaling),
            defense: lordSpec.def,
            agi: Math.floor(lordSpec.baseAgi * scaling),
            nextAction: Math.random() < 0.8 ? 'ATTACK' : 'DEFENSE',
            rewardGold: Math.floor(lordSpec.gold * scaling),
            imagePath: lordSpec.image
        });

        return await this.monsterRepo.save(boss);
    }

    async battleAction(userId: number, monsterId: number, action: string, useLucky: boolean) {
        const user = await this.userService.findOne(userId);
        const monster = await this.monsterRepo.findOne({ where: { id: monsterId } });

        if (!user || !monster) throw new NotFoundException('대상 찾을 수 없음');

        if (user.gameData.state === GameState.GAME_OVER) {
            return { result: 'LOSE', logs: ['이미 사망했습니다.'], userHp: 0, monsterHp: monster.hp };
        }

        const logs: string[] = [];
        if (user.gameData.luckyCooldown === undefined) user.gameData.luckyCooldown = 0;

        // 기절 체크
        if (user.gameData.stunned) {
            user.gameData.stunned = false;
            if (user.gameData.luckyCooldown > 0) user.gameData.luckyCooldown--;

            const monsterAction = monster.nextAction || 'ATTACK';
            let monsterDmg = monster.attack + Math.floor(Math.random() * 3);

            if (monsterAction === 'ATTACK') {
                user.gameData.hp -= monsterDmg;
                logs.push(`😵 기절하여 움직일 수 없습니다! (샌드백 신세... -${monsterDmg} HP)`);
            } else {
                logs.push(`😵 기절해 있었지만 다행히 몬스터도 방어했습니다.`);
            }

            if (user.gameData.hp <= 0) {
                user.gameData.hp = 0;
                user.gameData.state = GameState.GAME_OVER;
                logs.push(`💀 기절 상태에서 공격받아 쓰러졌습니다...`);
                await this.userService.save(user);
                return { result: 'LOSE', logs, monsterHp: monster.hp, userHp: 0, monsterAction, luckyCooldown: user.gameData.luckyCooldown };
            }

            await this.userService.save(user);
            const nextMonsterIntent = user.gameData.agi >= monster.agi ? monster.nextAction : '?';
            return {
                result: 'CONTINUE',
                logs,
                monsterHp: monster.hp,
                userHp: user.gameData.hp,
                monsterAction,
                nextMonsterIntent,
                canSeeIntent: user.gameData.agi >= monster.agi,
                luckyCooldown: user.gameData.luckyCooldown
            };
        }

        const monsterAction = monster.nextAction || 'ATTACK';
        let monsterDmg = monster.attack + Math.floor(Math.random() * 3);

        let weaponAtk = 0;
        if (user.gameData.equippedWeapon && WEAPON_BOOK[user.gameData.equippedWeapon]) {
            weaponAtk = WEAPON_BOOK[user.gameData.equippedWeapon].atk;
        }
        let playerBaseDmg = Math.max(1, Math.round(weaponAtk + (user.gameData.str * 0.5)));

        let luckyMultiplier = 1.0;
        if (useLucky) {
            if (user.gameData.luckyCooldown > 0) {
                logs.push(`⚠️ 럭키 어택 쿨타임입니다! (남은 턴: ${user.gameData.luckyCooldown}) -> 일반 공격으로 진행`);
            } else {
                logs.push(`🎲 [이판사판] 주사위를 굴립니다...`);
                const dice1 = Math.floor(Math.random() * 5) + 1;
                const dice2 = Math.floor(Math.random() * 5) + 1;
                const sum = dice1 + dice2;

                if (dice1 === dice2) {
                    luckyMultiplier = 2.0;
                    logs.push(`🎰 잭팟! (${dice1}, ${dice2}) -> 배율 2.0배!`);
                } else {
                    luckyMultiplier = 0.2 + (sum / 10);
                    logs.push(`🎲 결과: ${dice1}, ${dice2} (합 ${sum}) -> 배율 ${luckyMultiplier.toFixed(1)}배`);
                }
                user.gameData.luckyCooldown = 3;
            }
        }

        let playerFinalDmg = 0;
        if (action === 'DEFENSE') {
            logs.push(`🛡️ [방어] 태세! (피해 70% 감소)`);
            if (monsterAction === 'ATTACK') {
                const reducedDmg = Math.floor(monsterDmg * 0.3);
                user.gameData.hp -= reducedDmg;
                logs.push(`👾 몬스터 공격! 방어로 ${reducedDmg} 피해만 입었습니다.`);
            } else {
                logs.push(`👾 몬스터도 방어하며 대치 중...`);
            }
        } else if (action === 'STRONG_ATTACK') {
            logs.push(`💪 [강공격] 시도! (방어 무시 + 130%)`);
            const skillDmg = Math.floor(playerBaseDmg * 1.3 * luckyMultiplier);
            if (monsterAction === 'DEFENSE') {
                playerFinalDmg = skillDmg;
                logs.push(`🔨 몬스터가 방어했지만 강공격으로 뚫었습니다! (데미지 ${playerFinalDmg})`);
            } else {
                if (user.gameData.agi >= monster.agi) {
                    playerFinalDmg = skillDmg;
                    user.gameData.hp -= monsterDmg;
                    user.gameData.stunned = true;
                    logs.push(`⚡ 선공 성공! 데미지를 주고 반격받았습니다. (반동으로 다음 턴 기절)`);
                } else {
                    playerFinalDmg = 0;
                    user.gameData.hp -= monsterDmg;
                    user.gameData.stunned = true;
                    logs.push(`🐌 너무 느립니다! 공격하기 전에 맞아 캔슬되었습니다. (다음 턴 기절)`);
                }
            }
        } else {
            logs.push(`⚔️ [일반 공격]!`);
            playerFinalDmg = Math.floor(playerBaseDmg * luckyMultiplier);
            if (monsterAction === 'DEFENSE') {
                playerFinalDmg = Math.floor(playerFinalDmg * 0.3);
                logs.push(`🛡️ 몬스터 방어 (데미지 70% 감소)`);
            } else {
                user.gameData.hp -= monsterDmg;
                logs.push(`👾 서로 공격 교환! (-${monsterDmg} HP)`);
            }
        }

        if (playerFinalDmg > 0) {
            monster.hp = Math.max(0, monster.hp - playerFinalDmg);
            logs.push(`💥 몬스터에게 ${playerFinalDmg} 피해!`);
        }

        if (user.gameData.hp <= 0) {
            user.gameData.hp = 0;
            user.gameData.state = GameState.GAME_OVER;
            logs.push(`💀 체력이 다했습니다... 당신은 쓰러졌습니다.`);
            await this.userService.save(user);
            return { result: 'LOSE', logs, monsterHp: monster.hp, userHp: 0, monsterAction };
        }

        let result = 'CONTINUE';
        if (monster.hp === 0) {
            result = 'WIN';
            logs.push(user.gameData.state === GameState.BOSS_BATTLE ? `🏆 군주 ${monster.name} 토벌 완료!` : `🎉 승리!`);
            user.gameData.gold = (user.gameData.gold || 0) + monster.rewardGold;
            await this.monsterRepo.remove(monster);
        } else {
            monster.nextAction = Math.random() < 0.7 ? 'ATTACK' : 'DEFENSE';
            await this.monsterRepo.save(monster);
        }

        if (user.gameData.luckyCooldown > 0) user.gameData.luckyCooldown--;
        await this.userService.save(user);

        const canSeeIntent = monster.hp > 0 && user.gameData.agi >= monster.agi;
        const nextMonsterIntent = monster.hp > 0 ? (canSeeIntent ? monster.nextAction : '?') : null;

        return {
            result, logs, monsterHp: monster.hp, userHp: user.gameData.hp,
            monsterAction, nextMonsterIntent, canSeeIntent,
            luckyCooldown: user.gameData.luckyCooldown,
            gold: user.gameData.gold
        };
    }

    async claimVictoryReward(userId: number, reward: 'STR' | 'AGI' | 'POTION') {
        const user = await this.userService.findOne(userId);
        if (!user) throw new NotFoundException(`User ${userId} not found`);

        let message = '';
        if (reward === 'STR') {
            user.gameData.str += 1;
            message = '힘수치가 1 상승했습니다!';
        } else if (reward === 'AGI') {
            user.gameData.agi += 1;
            message = '민첩성이 1 상승했습니다!';
        } else if (reward === 'POTION') {
            user.gameData.potions = (user.gameData.potions || 0) + 1;
            message = `포션을 획득했습니다! (현재 갯수: ${user.gameData.potions})`;
        } else {
            throw new BadRequestException('잘못된 보상 선택입니다.');
        }

        await this.userService.save(user);
        return { message, str: user.gameData.str, agi: user.gameData.agi, potions: user.gameData.potions };
    }

    async escape(userId: number) {
        const user = await this.userService.findOne(userId);
        if (!user) throw new NotFoundException(`User ${userId} not found`);

        if (user.gameData.state === GameState.BATTLE || user.gameData.state === GameState.BOSS_BATTLE) {
            user.gameData.state = GameState.SELECTING;
            await this.userService.save(user);
        }
        return { message: '탈출 성공', state: GameState.SELECTING };
    }
}
