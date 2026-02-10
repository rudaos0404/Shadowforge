// src/app.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, GameState } from '../entity/user.entity';
import { Monster } from '../entity/monster.entity';
import { MonsterGrade, MONSTER_BOOK } from '../data/monsters.data';

@Injectable()
export class AppService {

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Monster) private monsterRepo: Repository<Monster>,
  ) { }

  // 🔀 섞기 함수
  private shuffle(array: string[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // 🎲 랜덤 선택지 생성
  private generateOptions() {
    const result = ['BATTLE'];
    let pool = ['BATTLE', 'SHOP', 'REST', 'TREASURE'];

    for (let i = 0; i < 2; i++) {
      const randomIndex = Math.floor(Math.random() * pool.length);
      const picked = pool[randomIndex];
      result.push(picked);
      if (picked !== 'BATTLE') {
        pool = pool.filter(item => item !== picked);
      }
    }
    return this.shuffle(result);
  }

  // 👾 일반 몬스터 소환 (Private)
  private async spawnMonster(turn: number) {
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
      agi: Math.floor(spec.baseAgi * scaling), // 민첩 적용
      nextAction: Math.random() < 0.7 ? 'ATTACK' : 'DEFENSE', // 초기 행동 설정
      rewardGold: Math.floor(spec.gold * scaling),
      imagePath: spec.image
    });

    return await this.monsterRepo.save(newMonster);
  }

  // 👑 보스 소환 (Private)
  private async spawnRandomBoss(turn: number) {
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
      agi: Math.floor(lordSpec.baseAgi * scaling), // 민첩 적용
      nextAction: Math.random() < 0.8 ? 'ATTACK' : 'DEFENSE', // 보스는 공격 확률 높음
      rewardGold: Math.floor(lordSpec.gold * scaling),
      imagePath: lordSpec.image
    });

    return await this.monsterRepo.save(boss);
  }

  // 1. 게임 시작 (겸 재시작)
  async startGame(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    // ✨ 재시작 시 모든 데이터를 깔끔하게 1턴 상태로 리셋
    user.gameData = {
      currentTurn: 1,
      state: GameState.SELECTING, // 상태도 다시 선택 중으로
      options: this.generateOptions(),
      hp: 100,
      maxHp: 100,
      str: 10,
      agi: 10, // 기본 민첩 10
      stunned: false,
      luckyCooldown: 0, // 쿨타임 초기화
      gold: 0,
    };

    await this.userRepo.save(user);

    return {
      message: '새로운 모험이 시작됩니다!',
      turn: 1,
      options: user.gameData.options,
      state: GameState.SELECTING
    };
  }

  // 2. 선택지 선택
  async selectOption(userId: number, selection: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    // 💀 죽은 사람은 행동 불가 (가드)
    if (user.gameData.state === GameState.GAME_OVER) {
      throw new BadRequestException('이미 사망했습니다. 게임을 다시 시작하세요.');
    }

    // ⚔️ 전투
    if (selection === 'BATTLE') {
      user.gameData.state = GameState.BATTLE;
      const newMonster = await this.spawnMonster(user.gameData.currentTurn);
      await this.userRepo.save(user);

      // 민첩 비교를 통한 의도 파악
      const canSeeIntent = user.gameData.agi >= newMonster.agi;
      const monsterIntent = canSeeIntent ? newMonster.nextAction : '?';

      return {
        message: '전투 시작!',
        monster: newMonster,
        state: 'BATTLE',
        monsterIntent, // 👁️ 민첩이 높으면 보임
        canSeeIntent,
        luckyCooldown: user.gameData.luckyCooldown || 0
      };
    }
    // 🛒 상점
    else if (selection === 'SHOP') {
      user.gameData.state = GameState.SHOP;
      await this.userRepo.save(user);
      return { message: '상점 입장', items: ['Potion', 'Sword'], state: 'SHOP' };
    }
    // 🔥 휴식
    else if (selection === 'REST') {
      user.gameData.state = GameState.REST;
      const healAmount = 100;
      user.gameData.hp += healAmount;
      if (user.gameData.hp > user.gameData.maxHp) user.gameData.hp = user.gameData.maxHp;
      await this.userRepo.save(user);
      return {
        message: '휴식 완료', description: `체력 ${healAmount} 회복`,
        hp: user.gameData.hp, maxHp: user.gameData.maxHp, state: 'REST'
      };
    }
    // 💰 보물
    else if (selection === 'TREASURE') {
      user.gameData.state = GameState.TREASURE;
      const rewardGold = 10;
      if (!user.gameData.gold) user.gameData.gold = 0;
      user.gameData.gold += rewardGold;
      await this.userRepo.save(user);
      return {
        message: '보물 발견!', description: `${rewardGold}G 획득`,
        gold: user.gameData.gold, state: 'TREASURE'
      };
    }
  }

  // ⚔️ 전투 액션 (수정됨: 사망 로직 강화 + 기획안 반영)
  async battleAction(userId: number, monsterId: number, action: string, useLucky: boolean) { // useLucky 파라미터는 제거 또는 호환성 유지
    // 참고: 클라이언트에서 'useLucky' 대신 action = 'LUCKY_GAMBIT'으로 보내도록 유도하거나, 
    // 기존 호환성을 위해 action이 'LUCKY'인 경우 등을 처리.
    // 여기서는 action string으로 통합 처리하겠습니다.

    const user = await this.userRepo.findOne({ where: { id: userId } });
    const monster = await this.monsterRepo.findOne({ where: { id: monsterId } });

    if (!user || !monster) throw new NotFoundException('대상 찾을 수 없음');

    // 💀 이미 죽은 경우 방지
    if (user.gameData.state === GameState.GAME_OVER) {
      return { result: 'LOSE', logs: ['이미 사망했습니다.'], userHp: 0, monsterHp: monster.hp };
    }

    const logs: string[] = [];

    // 쿨타임 초기화 방어 로직 (기존 유저 호환)
    if (user.gameData.luckyCooldown === undefined) user.gameData.luckyCooldown = 0;

    // 0. 😵 기절 상태 체크 (턴 스킵)
    if (user.gameData.stunned) {
      user.gameData.stunned = false; // 기절 해제

      // 기절 중에도 쿨타임은 줄어듬
      if (user.gameData.luckyCooldown > 0) user.gameData.luckyCooldown--;

      await this.userRepo.save(user); // 상태 저장

      // 몬스터는 공격함
      const monsterAction = monster.nextAction || 'ATTACK';
      let monsterDmg = monster.attack + Math.floor(Math.random() * 3);

      if (monsterAction === 'ATTACK') {
        user.gameData.hp -= monsterDmg;
        logs.push(`😵 기절하여 움직일 수 없습니다! (샌드백 신세... -${monsterDmg} HP)`);
      } else {
        logs.push(`😵 기절해 있었지만 다행히 몬스터도 방어했습니다.`);
      }

      // 사망 체크
      if (user.gameData.hp <= 0) {
        user.gameData.hp = 0;
        user.gameData.state = GameState.GAME_OVER;
        logs.push(`💀 기절 상태에서 공격받아 쓰러졌습니다...`);
        await this.userRepo.save(user);
        return { result: 'LOSE', logs, monsterHp: monster.hp, userHp: 0, monsterAction, luckyCooldown: user.gameData.luckyCooldown };
      }

      await this.userRepo.save(user);

      // 다음 턴 준비
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

    // 1. 몬스터 행동 가져오기 (이미 정해진 행동)
    const monsterAction = monster.nextAction || 'ATTACK'; // DB에 저장된 행동

    let monsterDmg = monster.attack + Math.floor(Math.random() * 3);
    let playerBaseDmg = user.gameData.str; // 기본 데미지

    // 🍀 럭키 어택 (Modifier) 적용
    let luckyMultiplier = 1.0;

    if (useLucky) {
      if (user.gameData.luckyCooldown > 0) {
        logs.push(`⚠️ 럭키 어택 쿨타임입니다! (남은 턴: ${user.gameData.luckyCooldown}) -> 일반 공격으로 진행`);
        // 발동 실패: 배율 1.0 유지
      } else {
        logs.push(`🎲 [이판사판] 주사위를 굴립니다...`);
        const dice1 = Math.floor(Math.random() * 5) + 1; // 1~5
        const dice2 = Math.floor(Math.random() * 5) + 1;
        const sum = dice1 + dice2;

        if (dice1 === dice2) {
          luckyMultiplier = 2.0; // 잭팟
          logs.push(`🎰 잭팟! (${dice1}, ${dice2}) -> 배율 2.0배!`);
        } else {
          luckyMultiplier = 0.2 + (sum / 10); // 0.3 ~ 1.1배
          logs.push(`🎲 결과: ${dice1}, ${dice2} (합 ${sum}) -> 배율 ${luckyMultiplier.toFixed(1)}배`);
        }

        // 사용했으므로 쿨타임 설정 (3턴)
        // 이번 턴 끝나면 1 줄어드니, 사실상 다음 턴부터 2턴 대기?
        // "3턴 쿨타임" -> 3번 행동 동안 못 씀.
        // 이번 턴에 썼으니 3으로 설정. 
        // 턴 종료 시 3 -> 2. 
        // 다음 턴(1): 2 -> 1. 
        // 다다음 턴(2): 1 -> 0. 
        // 다다다음 턴(3): 0 (사용 가능). 
        // 즉 3으로 설정하면 2턴 쉬고 3번째에 사용 가능. 의도에 맞음.
        user.gameData.luckyCooldown = 3;
      }
    }

    let playerFinalDmg = 0;

    // --- 플레이어 행동 처리 ---
    if (action === 'DEFENSE') {
      logs.push(`🛡️ [방어] 태세! (피해 70% 감소)`);
      if (monsterAction === 'ATTACK') {
        const reducedDmg = Math.floor(monsterDmg * 0.3); // 70% 감소 -> 30%만 받음
        user.gameData.hp -= reducedDmg;
        logs.push(`👾 몬스터 공격! 방어로 ${reducedDmg} 피해만 입었습니다.`);
      } else {
        logs.push(`👾 몬스터도 방어하며 대치 중...`);
      }
    }
    else if (action === 'STRONG_ATTACK') {
      logs.push(`💪 [강공격] 시도! (방어 무시 + 130%)`);

      const skillDmg = Math.floor(playerBaseDmg * 1.3 * luckyMultiplier); // 럭키 배율 적용

      if (monsterAction === 'DEFENSE') {
        // 1. 몬스터 방어 시: 안전하게 타격 (기절 X)
        playerFinalDmg = skillDmg;
        logs.push(`🔨 몬스터가 방어했지만 강공격으로 뚫었습니다! (데미지 ${playerFinalDmg})`);
      } else {
        // 2. 몬스터 공격 시: 민첩 싸움
        if (user.gameData.agi >= monster.agi) {
          // A. 내가 더 빠름 -> 때리고 맞고 기절
          playerFinalDmg = skillDmg;
          user.gameData.hp -= monsterDmg;
          user.gameData.stunned = true; // 다음 턴 기절
          logs.push(`⚡ 선공 성공! 데미지를 주고 반격받았습니다. (반동으로 다음 턴 기절)`);
        } else {
          // B. 내가 더 느림 -> 못 때리고 맞고 기절 (최악)
          playerFinalDmg = 0;
          user.gameData.hp -= monsterDmg;
          user.gameData.stunned = true; // 다음 턴 기절
          logs.push(`🐌 너무 느립니다! 공격하기 전에 맞아 캔슬되었습니다. (다음 턴 기절)`);
        }
      }
    }
    else { // 'ATTACK' (기본)
      logs.push(`⚔️ [일반 공격]!`);
      playerFinalDmg = Math.floor(playerBaseDmg * 1.0 * luckyMultiplier); // 럭키 배율 적용

      if (monsterAction === 'DEFENSE') {
        playerFinalDmg = Math.floor(playerFinalDmg * 0.3); // 방어 시 70% 반감 (플레이어와 동일)
        logs.push(`🛡️ 몬스터 방어 (데미지 70% 감소)`);
      } else {
        user.gameData.hp -= monsterDmg;
        logs.push(`👾 서로 공격 교환! (-${monsterDmg} HP)`);
      }
    }

    // --- 데미지 적용 ---
    if (playerFinalDmg > 0) {
      monster.hp -= playerFinalDmg;
      if (monster.hp < 0) monster.hp = 0;
      logs.push(`💥 몬스터에게 ${playerFinalDmg} 피해!`);
    }

    // ✨ 유저 사망 체크 및 게임 오버 처리 ✨
    if (user.gameData.hp <= 0) {
      user.gameData.hp = 0; // 음수 방지

      // 1. 상태를 GAME_OVER로 변경
      user.gameData.state = GameState.GAME_OVER;

      logs.push(`💀 체력이 다했습니다... 당신은 쓰러졌습니다.`);

      // 2. 저장 및 패배 리턴
      await this.userRepo.save(user);
      // 몬스터는 저장하지 않음 (게임 끝났으니)

      return {
        result: 'LOSE', // 프론트에서 이 값을 보면 'Retry 버튼' 띄우기
        logs,
        monsterHp: monster.hp,
        userHp: 0,
        monsterAction
      };
    }

    // --- 승리 체크 ---
    let result = 'CONTINUE';
    if (monster.hp === 0) {
      result = 'WIN';
      if (user.gameData.state === GameState.BOSS_BATTLE) {
        logs.push(`🏆 군주 ${monster.name} 토벌 완료!`);
      } else {
        logs.push(`🎉 승리!`);
      }

      if (!user.gameData.gold) user.gameData.gold = 0;
      user.gameData.gold += monster.rewardGold;

      await this.monsterRepo.remove(monster);
    } else {
      // 몬스터가 살아있으면 다음 행동 결정
      monster.nextAction = Math.random() < 0.7 ? 'ATTACK' : 'DEFENSE';
      await this.monsterRepo.save(monster);
    }

    // 쿨타임 감소 (턴 종료 시)
    if (user.gameData.luckyCooldown > 0) {
      user.gameData.luckyCooldown--;
    }

    await this.userRepo.save(user);

    // 다음 라운드 정보 준비 (의도 파악)
    const canSeeIntent = monster.hp > 0 && user.gameData.agi >= monster.agi;
    const nextMonsterIntent = monster.hp > 0 ? (canSeeIntent ? monster.nextAction : '?') : null;

    return {
      result,
      logs,
      monsterHp: monster.hp,
      userHp: user.gameData.hp,
      monsterAction, // 이번 턴에 몬스터가 한 행동
      nextMonsterIntent, // 다음 턴 몬스터 예고
      canSeeIntent,
      luckyCooldown: user.gameData.luckyCooldown
    };
  }

  // ⏭️ 턴 넘기기
  async nextTurn(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    // 💀 죽었으면 턴 못 넘김
    if (user.gameData.state === GameState.GAME_OVER) {
      throw new BadRequestException('게임 오버 상태입니다.');
    }

    // 1. 보스전 승리 후
    if (user.gameData.state === GameState.BOSS_BATTLE) {
      // 엔딩 조건 (10턴 이상)
      if (user.gameData.currentTurn >= 10) {
        user.gameData.state = GameState.GAME_CLEAR;
        await this.userRepo.save(user);
        return {
          message: '축하합니다! 던전을 정복했습니다.',
          turn: 'ENDING',
          state: 'GAME_CLEAR',
          finalGold: user.gameData.gold,
          finalHp: user.gameData.hp
        };
      }
      // 일반 진행
      user.gameData.currentTurn += 1;
      user.gameData.state = GameState.SELECTING;
      user.gameData.options = this.generateOptions();
      await this.userRepo.save(user);
      return {
        message: `${user.gameData.currentTurn}턴 시작!`,
        turn: user.gameData.currentTurn,
        options: user.gameData.options,
        isBossBattle: false
      };
    }

    // 2. 보스전 진입 (5턴 주기)
    if (user.gameData.currentTurn % 5 === 0) {
      user.gameData.state = GameState.BOSS_BATTLE;
      const boss = await this.spawnRandomBoss(user.gameData.currentTurn);
      await this.userRepo.save(user);
      return {
        message: user.gameData.currentTurn === 10 ? '⚠️ 최종 보스 등장!' : '⚠️ 중간 보스 등장!',
        turn: user.gameData.currentTurn === 10 ? 'FINAL BOSS' : 'BOSS',
        monster: boss,
        state: 'BOSS_BATTLE',
        isBossBattle: true
      };
    }

    // 3. 일반 턴 넘김
    user.gameData.currentTurn += 1;
    user.gameData.state = GameState.SELECTING;
    user.gameData.options = this.generateOptions();
    await this.userRepo.save(user);
    return {
      message: `${user.gameData.currentTurn}턴 시작!`,
      turn: user.gameData.currentTurn,
      options: user.gameData.options,
      isBossBattle: false
    };
  }
}