import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum GameState {
    SELECTING = 'SELECTING',
    BATTLE = 'BATTLE',
    BOSS_BATTLE = 'BOSS_BATTLE',
    SHOP = 'SHOP',
    REST = 'REST',
    TREASURE = 'TREASURE',
    GAME_CLEAR = 'GAME_CLEAR',
    GAME_OVER = 'GAME_OVER',
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    // JSON으로 유연하게 스탯 저장
    @Column({ type: 'json' })
    gameData: {
        currentTurn: number;     // 현재 턴 (1, 2, 3...)
        state: GameState;        // 현재 상태 (전투중? 선택중?)
        options: string[];       // 현재 뜬 선택지 3개 (예: ['battle', 'shop', 'rest'])
        hp: number;
        maxHp: number;
        str: number;
        agi: number;
        stunned: boolean;
        luckyCooldown: number;
        gold: number;
        nextMonsterIntent: string | null; // ✨ 추가됨
        canSeeIntent: boolean; // ✨ 추가됨

        // 🎒 인벤토리 시스템 (Gap 1 해결)
        potions: number;            // 포션 개수
        inventory: string[];        // 획득한 무기 ID 목록 (예: ['NORMAL_SWORD', 'RARE_SWORD'])
        equippedWeapon: string | null; // 현재 장착 중인 무기 ID (없으면 null)
    };
}