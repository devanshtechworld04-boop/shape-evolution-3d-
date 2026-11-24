/**
 * Shape Evolution 3D - Evolution Forms & 50 Procedural-Deterministic Levels
 */

const EVOLUTION_FORMS = [
    {
        id: 0,
        name: "1. CUBE",
        shortName: "CUBE",
        requiredGems: 0,
        color: 0x00f0ff,
        emissive: 0x005577,
        scale: 1.0,
        speedBonus: 1.0,
        jumpBonus: 1.0
    },
    {
        id: 1,
        name: "2. SPHERE",
        shortName: "SPHERE",
        requiredGems: 5,
        color: 0x00ff88,
        emissive: 0x005522,
        scale: 1.08,
        speedBonus: 1.06,
        jumpBonus: 1.05
    },
    {
        id: 2,
        name: "3. PYRAMID",
        shortName: "PYRAMID",
        requiredGems: 12,
        color: 0xffd700,
        emissive: 0x664400,
        scale: 1.15,
        speedBonus: 1.12,
        jumpBonus: 1.1
    },
    {
        id: 3,
        name: "4. DIAMOND",
        shortName: "DIAMOND",
        requiredGems: 20,
        color: 0xff007f,
        emissive: 0x660033,
        scale: 1.2,
        speedBonus: 1.18,
        jumpBonus: 1.15
    },
    {
        id: 4,
        name: "5. HEXAGON",
        shortName: "HEXAGON",
        requiredGems: 30,
        color: 0x9d00ff,
        emissive: 0x3b0066,
        scale: 1.25,
        speedBonus: 1.22,
        jumpBonus: 1.18
    },
    {
        id: 5,
        name: "6. CRYSTAL",
        shortName: "CRYSTAL",
        requiredGems: 42,
        color: 0xff5500,
        emissive: 0x661a00,
        scale: 1.3,
        speedBonus: 1.28,
        jumpBonus: 1.22
    },
    {
        id: 6,
        name: "7. ULTIMATE ENERGY",
        shortName: "ULTIMATE",
        requiredGems: 55,
        color: 0xffffff,
        emissive: 0x00f0ff,
        scale: 1.38,
        speedBonus: 1.35,
        jumpBonus: 1.28
    }
];

const ENVIRONMENT_THEMES = [
    { sky: 0x070b19, fog: 0x070b19, track: 0x111a33, grid: 0x00f0ff },
    { sky: 0x14071d, fog: 0x14071d, track: 0x241136, grid: 0xff007f },
    { sky: 0x051814, fog: 0x051814, track: 0x0c2b24, grid: 0x00ff88 },
    { sky: 0x1c1205, fog: 0x1c1205, track: 0x30200a, grid: 0xffaa00 },
    { sky: 0x090d24, fog: 0x090d24, track: 0x161f4d, grid: 0x8a2be2 }
];

// Generate 50 unique, balanced levels
const LEVELS_DATA = (() => {
    const levels = [];
    const obstaclePool = [
        "moving_block",
        "laser_gate",
        "spinning_blade",
        "falling_platform",
        "energy_barrier",
        "moving_wall"
    ];

    for (let i = 1; i <= 50; i++) {
        const theme = ENVIRONMENT_THEMES[(i - 1) % ENVIRONMENT_THEMES.length];
        const length = 260 + i * 22; // Track distance increases smoothly
        const baseSpeed = 16 + Math.min(i * 0.28, 14);
        const obstacleSpacing = Math.max(22 - Math.floor(i * 0.16), 12);
        const targetFormIndex = Math.min(Math.floor((i - 1) / 7) + 1, EVOLUTION_FORMS.length - 1);

        // Unlock obstacle types progressively across the 50 levels
        const availableObstacles = obstaclePool.slice(0, Math.min(2 + Math.floor(i / 4), obstaclePool.length));

        levels.push({
            levelNumber: i,
            length: length,
            baseSpeed: baseSpeed,
            obstacleSpacing: obstacleSpacing,
            theme: theme,
            targetFormIndex: targetFormIndex,
            coinReward: 40 + i * 10,
            timeLimit: Math.max(45, Math.floor(length / baseSpeed) + 15),
            availableObstacles: availableObstacles
        });
    }
    return levels;
})();
