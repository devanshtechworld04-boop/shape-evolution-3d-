/**
 * SHAPE EVOLUTION 3D - Complete Three.js Engine (500 Levels) & Multi-Portal SDK Bridge
 */

// ==========================================
// 1. MULTI-PORTAL MONETIZATION & SDK BRIDGE
// ==========================================
const PortalBridge = {
    sdkReady: false,
    async init() {
        // Auto-initialize CrazyGames SDK v3 if loaded
        if (window.CrazyGames && window.CrazyGames.SDK) {
            try {
                await window.CrazyGames.SDK.init();
                this.sdkReady = true;
            } catch (e) {}
        }
    },
    gameplayStart() {
        try {
            if (window.CrazyGames?.SDK?.game) window.CrazyGames.SDK.game.gameplayStart();
        } catch (e) {}
    },
    gameplayStop() {
        try {
            if (window.CrazyGames?.SDK?.game) window.CrazyGames.SDK.game.gameplayStop();
        } catch (e) {}
    },
    showInterstitial(onComplete) {
        this.gameplayStop();
        if (window.CrazyGames?.SDK?.ad) {
            window.CrazyGames.SDK.ad.requestAd("midgame", {
                adFinished: () => onComplete && onComplete(),
                adError: () => onComplete && onComplete()
            });
        } else if (typeof window.gdsdk !== "undefined" && window.gdsdk.showAd) {
            window.gdsdk.showAd().then(() => onComplete && onComplete()).catch(() => onComplete && onComplete());
        } else if (typeof window.sdk !== "undefined" && window.sdk.showBanner) {
            window.sdk.showBanner();
            if (onComplete) onComplete();
        } else {
            if (onComplete) onComplete();
        }
    },
    showRewarded(onReward, onCancel) {
        this.gameplayStop();
        if (window.CrazyGames?.SDK?.ad) {
            window.CrazyGames.SDK.ad.requestAd("rewarded", {
                adFinished: () => onReward && onReward(),
                adError: () => onCancel && onCancel()
            });
        } else if (typeof window.gdsdk !== "undefined" && window.gdsdk.showAd) {
            window.gdsdk.showAd("rewarded").then(() => onReward && onReward()).catch(() => onCancel && onCancel());
        } else if (typeof window.sdk !== "undefined" && window.sdk.showBanner) {
            window.sdk.showBanner();
            if (onReward) onReward();
        } else {
            if (onReward) onReward();
        }
    }
};

// ==========================================
// 2. PROCEDURAL WEB AUDIO SYNTHESIZER
// ==========================================
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.bgmInterval = null;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    }

    playTone(freq, type, duration, vol = 0.15, slideTo = null) {
        if (this.muted || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        if (slideTo) {
            osc.frequency.exponentialRampToValueAtTime(slideTo, this.ctx.currentTime + duration);
        }
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playGem() { this.playTone(680, "sine", 0.14, 0.16, 1180); }
    playCoin() { this.playTone(920, "triangle", 0.16, 0.16, 1380); }
    playJump() { this.playTone(220, "sine", 0.22, 0.18, 520); }
    playCrash() { this.playTone(140, "sawtooth", 0.4, 0.25, 42); }
    playEvolve() {
        [440, 554, 659, 880].forEach((n, idx) => {
            setTimeout(() => this.playTone(n, "triangle", 0.25, 0.18), idx * 65);
        });
    }
    playVictory() {
        [523, 659, 784, 1046].forEach((n, idx) => {
            setTimeout(() => this.playTone(n, "sine", 0.32, 0.2), idx * 90);
        });
    }

    startBGM() {
        this.stopBGM();
        const notes = [130.81, 164.81, 196.00, 164.81, 146.83, 174.61, 220.00, 196.00];
        let step = 0;
        this.bgmInterval = setInterval(() => {
            if (!this.muted && this.ctx && this.ctx.state === "running") {
                this.playTone(notes[step % notes.length], "sine", 0.28, 0.045);
                step++;
            }
        }, 320);
    }

    stopBGM() {
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }
}

// ==========================================
// 3. LOCAL STORAGE SAVE MANAGER
// ==========================================
const SaveManager = {
    KEY: "shape_evolution_3d_save_v1",
    data: {
        unlockedLevel: 1,
        selectedLevel: 1,
        highScore: 0,
        totalGems: 0,
        totalCoins: 0,
        lastDailyClaim: "",
        muted: false
    },
    load() {
        try {
            const raw = localStorage.getItem(this.KEY);
            if (raw) Object.assign(this.data, JSON.parse(raw));
        } catch (e) {}
    },
    save() {
        try {
            localStorage.setItem(this.KEY, JSON.stringify(this.data));
        } catch (e) {}
    },
    canClaimDaily() {
        const today = new Date().toISOString().slice(0, 10);
        return this.data.lastDailyClaim !== today;
    },
    claimDaily() {
        if (!this.canClaimDaily()) return false;
        this.data.lastDailyClaim = new Date().toISOString().slice(0, 10);
        this.data.totalCoins += 100;
        this.save();
        return true;
    }
};

// ==========================================
// 4. MAIN 3D GAME ENGINE
// ==========================================
class ShapeEvolutionGame {
    constructor() {
        SaveManager.load();
        PortalBridge.init();
        this.sound = new SoundEngine();
        this.sound.muted = SaveManager.data.muted;

        // Game State
        this.state = "MENU"; // MENU, PLAYING, PAUSED, GAMEOVER, VICTORY
        this.mode = "classic"; // classic, endless, time, evolution
        this.currentLevelNum = SaveManager.data.selectedLevel || 1;
        this.score = 0;
        this.runGems = 0;
        this.runCoins = 0;
        this.currentFormIdx = 0;
        this.timeLeft = 60;
        this.invulnerableTimer = 0;

        // Track & Player Physics
        this.trackWidth = 8.4;
        this.playerX = 0;
        this.targetX = 0;
        this.playerY = 0.7;
        this.playerZ = 0;
        this.velocityY = 0;
        this.isGrounded = true;

        // World Entities
        this.obstacles = [];
        this.collectibles = [];
        this.particles = [];
        this.trackTiles = [];
        this.nextSpawnZ = -28;
        this.finishLine = null;

        this.initThree();
        this.initPlayerMesh();
        this.bindEvents();
        this.updateMenuUI();

        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);
    }

    initThree() {
        this.container = document.getElementById("game-container");
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x070b19);
        this.scene.fog = new THREE.FogExp2(0x070b19, 0.015);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 160);
        this.camera.position.set(0, 5.2, 9.5);
        this.camera.lookAt(0, 1.2, -8);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.65);
        this.scene.add(ambient);

        this.dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
        this.dirLight.position.set(10, 22, 12);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 512;
        this.dirLight.shadow.mapSize.height = 512;
        this.scene.add(this.dirLight);
    }

    createEvolutionGeometry(formIndex) {
        switch (formIndex) {
            case 0: return new THREE.BoxGeometry(1.15, 1.15, 1.15); // Cube
            case 1: return new THREE.SphereGeometry(0.72, 24, 24); // Sphere
            case 2: return new THREE.ConeGeometry(0.82, 1.35, 4); // Pyramid
            case 3: return new THREE.OctahedronGeometry(0.85, 0); // Diamond
            case 4: return new THREE.CylinderGeometry(0.78, 0.78, 0.9, 6); // Hexagon
            case 5: return new THREE.IcosahedronGeometry(0.86, 0); // Crystal
            case 6: return new THREE.TorusKnotGeometry(0.55, 0.2, 64, 12); // Ultimate Energy Shape
            default: return new THREE.BoxGeometry(1.15, 1.15, 1.15);
        }
    }

    initPlayerMesh() {
        this.playerGroup = new THREE.Group();
        const form = EVOLUTION_FORMS[0];
        const geo = this.createEvolutionGeometry(0);
        const mat = new THREE.MeshStandardMaterial({
            color: form.color,
            emissive: form.emissive,
            roughness: 0.25,
            metalness: 0.4
        });
        this.playerMesh = new THREE.Mesh(geo, mat);
        this.playerMesh.castShadow = true;
        this.playerGroup.add(this.playerMesh);

        // Energy Aura Ring
        const ringGeo = new THREE.RingGeometry(0.85, 1.05, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: form.color,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
        });
        this.auraRing = new THREE.Mesh(ringGeo, ringMat);
        this.auraRing.rotation.x = -Math.PI / 2;
        this.auraRing.position.y = -0.52;
        this.playerGroup.add(this.auraRing);

        this.playerGroup.position.set(0, this.playerY, 0);
        this.scene.add(this.playerGroup);
    }

    evolveTo(formIdx, silent = false) {
        this.currentFormIdx = Math.min(formIdx, EVOLUTION_FORMS.length - 1);
        const form = EVOLUTION_FORMS[this.currentFormIdx];

        this.playerMesh.geometry.dispose();
        this.playerMesh.geometry = this.createEvolutionGeometry(this.currentFormIdx);
        this.playerMesh.material.color.setHex(form.color);
        this.playerMesh.material.emissive.setHex(form.emissive);
        this.auraRing.material.color.setHex(form.color);

        this.playerGroup.scale.setScalar(form.scale);

        if (!silent) {
            this.sound.playEvolve();
            this.spawnParticles(this.playerGroup.position, form.color, 26);
        }
        this.updateEvolutionHUD();
    }

    clearWorld() {
        this.obstacles.forEach(o => this.scene.remove(o.mesh));
        this.collectibles.forEach(c => this.scene.remove(c.mesh));
        this.trackTiles.forEach(t => this.scene.remove(t));
        if (this.finishLine) {
            this.scene.remove(this.finishLine);
            this.finishLine = null;
        }
        this.obstacles = [];
        this.collectibles = [];
        this.trackTiles = [];
    }

    startLevel(levelNum) {
        this.sound.init();
        this.sound.startBGM();
        this.clearWorld();

        this.currentLevelNum = levelNum;
        this.levelConfig = LEVELS_DATA[(levelNum - 1) % LEVELS_DATA.length];

        // Apply Theme
        const theme = this.levelConfig.theme;
        this.scene.background.setHex(theme.sky);
        this.scene.fog.color.setHex(theme.fog);

        // Reset Player
        this.playerX = 0;
        this.targetX = 0;
        this.playerY = 0.7;
        this.playerZ = 0;
        this.velocityY = 0;
        this.isGrounded = true;
        this.score = 0;
        this.runGems = 0;
        this.runCoins = 0;
        this.invulnerableTimer = 1.0;
        this.timeLeft = this.mode === "time" ? this.levelConfig.timeLimit : 60;

        this.evolveTo(0, true);

        // Build Initial Track Segments
        for (let i = 0; i < 14; i++) {
            this.spawnTrackSegment(-i * 15);
        }

        // Build Finish Line for Classic & Time modes
        if (this.mode === "classic" || this.mode === "time") {
            const finGeo = new THREE.BoxGeometry(this.trackWidth, 0.25, 2.5);
            const finMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
            this.finishLine = new THREE.Mesh(finGeo, finMat);
            this.finishLine.position.set(0, 0.1, -this.levelConfig.length);
            this.scene.add(this.finishLine);
        }

        this.nextSpawnZ = -26;
        this.populateAhead();

        this.state = "PLAYING";
        this.showScreen("hud");
        document.getElementById("hud-level").textContent = this.mode === "endless" ? "∞" : this.currentLevelNum;
        document.getElementById("timer-pill").style.display = this.mode === "time" ? "block" : "none";
        this.updateHUD();
        PortalBridge.gameplayStart();
    }

    spawnTrackSegment(zPos) {
        const theme = this.levelConfig.theme;
        const group = new THREE.Group();

        const roadGeo = new THREE.BoxGeometry(this.trackWidth, 0.5, 15);
        const roadMat = new THREE.MeshStandardMaterial({ color: theme.track, roughness: 0.7 });
        const road = new THREE.Mesh(roadGeo, roadMat);
        road.position.y = -0.25;
        road.receiveShadow = true;
        group.add(road);

        // Neon Side Rails
        const railGeo = new THREE.BoxGeometry(0.22, 0.35, 15);
        const railMat = new THREE.MeshBasicMaterial({ color: theme.grid });
        const leftRail = new THREE.Mesh(railGeo, railMat);
        leftRail.position.set(-this.trackWidth / 2, 0.15, 0);
        const rightRail = new THREE.Mesh(railGeo, railMat);
        rightRail.position.set(this.trackWidth / 2, 0.15, 0);
        group.add(leftRail, rightRail);

        group.position.z = zPos;
        this.scene.add(group);
        this.trackTiles.push(group);
    }

    populateAhead() {
        const horizon = this.playerZ - 135;
        const limitZ = (this.mode === "classic" || this.mode === "time")
            ? -this.levelConfig.length + 18
            : -999999;

        while (this.nextSpawnZ > horizon && this.nextSpawnZ > limitZ) {
            this.spawnWave(this.nextSpawnZ);
            this.nextSpawnZ -= this.levelConfig.obstacleSpacing;
        }
    }

    spawnWave(zPos) {
        const pool = this.levelConfig.availableObstacles;
        const type = pool[Math.floor(Math.random() * pool.length)];
        const laneX = (Math.random() - 0.5) * (this.trackWidth - 2.4);

        let mesh;
        let obsData = { type, z: zPos, phase: Math.random() * Math.PI * 2, triggered: false };

        if (type === "moving_block") {
            mesh = new THREE.Mesh(
                new THREE.BoxGeometry(2.1, 1.5, 1.5),
                new THREE.MeshStandardMaterial({ color: 0xff2a55, emissive: 0x440011 })
            );
            mesh.position.set(laneX, 0.75, zPos);
        } else if (type === "laser_gate") {
            mesh = new THREE.Group();
            const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155 });
            const p1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 0.5), pillarMat);
            p1.position.x = -2.2;
            const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 0.5), pillarMat);
            p2.position.x = 2.2;
            const beam = new THREE.Mesh(
                new THREE.CylinderGeometry(0.14, 0.14, 4.4, 8),
                new THREE.MeshBasicMaterial({ color: 0xff0044 })
            );
            beam.rotation.z = Math.PI / 2;
            beam.position.y = 1.2;
            mesh.add(p1, p2, beam);
            mesh.position.set(laneX * 0.4, 0, zPos);
        } else if (type === "spinning_blade") {
            mesh = new THREE.Mesh(
                new THREE.BoxGeometry(4.2, 0.35, 0.5),
                new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0x552200 })
            );
            mesh.position.set(laneX * 0.5, 0.85, zPos);
        } else if (type === "falling_platform") {
            mesh = new THREE.Mesh(
                new THREE.BoxGeometry(2.6, 0.4, 3.2),
                new THREE.MeshStandardMaterial({ color: 0x9333ea, emissive: 0x2e0854 })
            );
            mesh.position.set(laneX, 0.25, zPos);
        } else if (type === "energy_barrier") {
            mesh = new THREE.Mesh(
                new THREE.BoxGeometry(3.2, 1.1, 0.4),
                new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.75 })
            );
            mesh.position.set(laneX, 0.55, zPos);
        } else {
            // moving_wall
            mesh = new THREE.Mesh(
                new THREE.BoxGeometry(3.5, 2.2, 0.9),
                new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0x4c0519 })
            );
            mesh.position.set(0, 1.1, zPos);
        }

        mesh.castShadow = true;
        this.scene.add(mesh);
        obsData.mesh = mesh;
        this.obstacles.push(obsData);

        // Spawn Energy Gems & Coins in safe offset lane
        const gemX = laneX > 0 ? -2.2 : 2.2;
        const isCoin = Math.random() < 0.32;
        const colGeo = isCoin
            ? new THREE.CylinderGeometry(0.42, 0.42, 0.16, 16)
            : new THREE.OctahedronGeometry(0.48, 0);
        const colMat = new THREE.MeshStandardMaterial({
            color: isCoin ? 0xffd700 : 0x00f0ff,
            emissive: isCoin ? 0x664400 : 0x005577
        });
        const colMesh = new THREE.Mesh(colGeo, colMat);
        if (isCoin) colMesh.rotation.x = Math.PI / 2;
        colMesh.position.set(gemX, 0.85, zPos - 4);
        this.scene.add(colMesh);
        this.collectibles.push({ mesh: colMesh, type: isCoin ? "coin" : "gem", collected: false });
    }

    spawnParticles(pos, colorHex, count = 14) {
        const geo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
        const mat = new THREE.MeshBasicMaterial({ color: colorHex });
        for (let i = 0; i < count; i++) {
            const p = new THREE.Mesh(geo, mat);
            p.position.copy(pos);
            this.scene.add(p);
            this.particles.push({
                mesh: p,
                vx: (Math.random() - 0.5) * 9,
                vy: Math.random() * 7 + 2,
                vz: (Math.random() - 0.5) * 9,
                life: 0.65
            });
        }
    }

    jump() {
        if (this.state !== "PLAYING" || !this.isGrounded) return;
        const form = EVOLUTION_FORMS[this.currentFormIdx];
        this.velocityY = 11.5 * form.jumpBonus;
        this.isGrounded = false;
        this.sound.playJump();
    }

    update(dt) {
        // Particles update always
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            p.vy -= 18 * dt;
            p.mesh.position.x += p.vx * dt;
            p.mesh.position.y += p.vy * dt;
            p.mesh.position.z += p.vz * dt;
            p.mesh.scale.setScalar(Math.max(0.01, p.life));
            if (p.life <= 0) {
                this.scene.remove(p.mesh);
                this.particles.splice(i, 1);
            }
        }

        if (this.state !== "PLAYING") {
            if (this.playerMesh) {
                this.playerMesh.rotation.y += dt * 1.2;
                this.playerMesh.rotation.x += dt * 0.5;
            }
            return;
        }

        if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;

        // Time Challenge Countdown
        if (this.mode === "time") {
            this.timeLeft -= dt;
            document.getElem
