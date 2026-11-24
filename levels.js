/**
 * Shape Evolution 3D - Evolution Forms & 500 Procedural-Deterministic Levels
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

// 10 Distinct Neon Worlds across 500 Levels
const ENVIRONMENT_THEMES = [
    { sky: 0x070b19, fog: 0x070b19, track: 0x111a33, grid: 0x00f0ff }, // 1. Cyber Cyan
    { sky: 0x14071d, fog: 0x14071d, track: 0x241136, grid: 0xff007f }, // 2. Neon Magenta
    { sky: 0x051814, fog: 0x051814, track: 0x0c2b24, grid: 0x00ff88 }, // 3. Emerald Matrix
    { sky: 0x1c1205, fog: 0x1c1205, track: 0x30200a, grid: 0xffaa00 }, // 4. Solar Gold
    { sky: 0x090d24, fog: 0x090d24, track: 0x161f4d, grid: 0x8a2be2 }, // 5. Ultraviolet Void
    { sky: 0x1f050a, fog: 0x1f050a, track: 0x380c15, grid: 0xff3b5c }, // 6. Crimson Core
    { sky: 0x041524, fog: 0x041524, track: 0x0b2942, grid: 0x38bdf8 }, // 7. Arctic Pulse
    { sky: 0x161905, fog: 0x161905, track: 0x292e0b, grid: 0xd9f99d }, // 8. Acid Lime
    { sky: 0x1a0b1e, fog: 0x1a0b1e, track: 0x301438, grid: 0xf472b6 }, // 9. Plasma Rose
    { sky: 0x0a0a0f, fog: 0x0a0a0f, track: 0x1c1c26, grid: 0xffffff }  // 10. Quantum Zenith
];

const TOTAL_LEVELS = 500;

// Generate 500 unique, balanced levels
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

    for (let i = 1; i <= TOTAL_LEVELS; i++) {
        // Change world theme every 10 levels for visual variety across 500 levels
        const themeIndex = Math.floor((i - 1) / 10) % ENVIRONMENT_THEMES.length;
        const theme = ENVIRONMENT_THEMES[themeIndex];

        // Smooth progression curve from Level 1 to Level 500
        const progressRatio = (i - 1) / (TOTAL_LEVELS - 1);
        const length = Math.floor(260 + i * 3.8);
        const baseSpeed = +(16 + progressRatio * 18).toFixed(2);
        const obstacleSpacing = Math.max(10.5, +(22 - progressRatio * 11.5).toFixed(2));
        const targetFormIndex = Math.min(Math.floor((i - 1) / 70) + 1, EVOLUTION_FORMS.length - 1);

        // Unlock all 6 obstacle types smoothly over the first 25 levels
        const availableObstacles = obstaclePool.slice(0, Math.min(2 + Math.floor(i / 5), obstaclePool.length));

        levels.push({
            levelNumber: i,
            length: length,
            baseSpeed: baseSpeed,
            obstacleSpacing: obstacleSpacing,
            theme: theme,
            targetFormIndex: targetFormIndex,
            coinReward: 40 + i * 5,
            timeLimit: Math.max(45, Math.floor(length / baseSpeed) + 16),
            availableObstacles: availableObstacles
        });
    }
    return levels;
})();
