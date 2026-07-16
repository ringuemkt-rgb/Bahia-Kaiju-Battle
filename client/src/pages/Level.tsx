import { useLocation, useParams } from "wouter";
import { useEffect, useState, useRef } from "react";

// Assets
import baixoSulBg from "../assets/baixo_sul_bg.png";
import salvadorBg from "../assets/salvador_bg.png";
import kaijuSprite from "../assets/kaiju_sprite.png";
import crabKaiju from "../assets/crab_kaiju.png";
import birdKaiju from "../assets/bird_kaiju.png";
import gatorKaiju from "../assets/gator_kaiju.png";
import rayKaiju from "../assets/ray_kaiju.png";

import woodenBoat from "../assets/wooden_boat.png";
import speedboat from "../assets/speedboat.png";
import humanNpc from "../assets/human_npc.png";
import bossMilitary from "../assets/boss_military.png";
import container from "../assets/container.png";
import building1 from "../assets/building_1.png";
import building2 from "../assets/building_2.png";
import tank from "../assets/tank.png";
import heli from "../assets/heli.png";

import exp1 from "../assets/explosion_1.png";
import exp2 from "../assets/explosion_2.png";
import exp3 from "../assets/explosion_3.png";

// --- Enums & Types ---
type Environment = 'clear' | 'rain' | 'fog' | 'storm';
type TideLevel = 'high' | 'low' | 'normal';
type EntityState = 'idle' | 'fleeing' | 'panicking' | 'attacking' | 'dead' | 'stunned' | 'grabbed';
type EntityType = 'civilian' | 'boat' | 'speedboat' | 'container' | 'building_small' | 'building_large' | 'military_infantry' | 'military_tank' | 'military_heli' | 'boss';
type AttackType = 'light' | 'heavy' | 'special' | 'grab' | 'throw' | 'eat';

interface CombatText {
    id: number;
    text: string;
    x: number;
    y: number;
    type: 'damage' | 'heal' | 'energy' | 'system';
}

interface Particle {
    id: number;
    x: number;
    y: number;
    type: 'explosion' | 'blood' | 'dust';
    createdAt: number;
}

interface GameEntity {
  id: string;
  type: EntityType;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  state: EntityState;
  vx: number;
  vy: number;
  threatLevel: number; // For targeting priorities
  sprite: string;
}

export default function Level() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  
  // --- Game Engine State ---
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'victory' | 'defeat'>('playing');
  const [destruction, setDestruction] = useState(0); // 0 to 100
  const [score, setScore] = useState(0);
  
  // --- Player State ---
  const [health, setHealth] = useState(100);
  const [maxHealth] = useState(100);
  const [energy, setEnergy] = useState(100);
  const [maxEnergy] = useState(100);
  const [playerX, setPlayerX] = useState(20); // 0 to 100%
  const [isFacingRight, setIsFacingRight] = useState(true);
  const [isAttacking, setIsAttacking] = useState<AttackType | null>(null);
  const [grabbedEntityId, setGrabbedEntityId] = useState<string | null>(null);
  
  // --- World State ---
  const [wantedLevel, setWantedLevel] = useState(1); // 1 to 5 stars
  const [weather, setWeather] = useState<Environment>('clear');
  const [tide, setTide] = useState<TideLevel>('normal');
  const [isNight, setIsNight] = useState(false);

  // --- Entities & FX ---
  const [entities, setEntities] = useState<GameEntity[]>([]);
  const [combatTexts, setCombatTexts] = useState<CombatText[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  
  const combatTextIdCounter = useRef(0);
  const particleIdCounter = useRef(0);
  const engineTickRef = useRef<NodeJS.Timeout | null>(null);

  // --- Helpers ---
  const spawnCombatText = (text: string, x: number, y: number, type: CombatText['type']) => {
      const id = combatTextIdCounter.current++;
      setCombatTexts(prev => [...prev, { id, text, x, y, type }]);
      setTimeout(() => {
          setCombatTexts(prev => prev.filter(ct => ct.id !== id));
      }, 1000);
  };

  const spawnParticle = (x: number, y: number, type: Particle['type']) => {
      const id = particleIdCounter.current++;
      setParticles(prev => [...prev, { id, x, y, type, createdAt: Date.now() }]);
      setTimeout(() => {
          setParticles(prev => prev.filter(p => p.id !== id));
      }, 600); // Life of explosion animation
  };

  const addMessage = (msg: string) => {
    setMessages(prev => [...prev.slice(-3), msg]);
  };

  const triggerScreenShake = (intensity: 'small' | 'large' | 'massive' = 'large') => {
      const screen = document.getElementById('game-screen');
      if (screen) {
        screen.classList.remove('animate-shake', 'animate-shake-small', 'animate-shake-massive');
        void screen.offsetWidth; // trigger reflow
        screen.classList.add(`animate-shake${intensity === 'large' ? '' : '-' + intensity}`);
      }
  };

  // --- Initialization & Spawning ---
  useEffect(() => {
    const initialEntities: GameEntity[] = [];
    let entityId = 0;

    const spawn = (type: EntityType, x: number, y: number, props: Partial<GameEntity> = {}) => {
        let maxHp = 10, w = 5, h = 5, sprite = humanNpc, threat = 0;
        
        switch(type) {
            case 'civilian': maxHp = 5; sprite = humanNpc; w=4; h=8; break;
            case 'boat': maxHp = 30; sprite = woodenBoat; w=12; h=12; break;
            case 'speedboat': maxHp = 40; sprite = speedboat; w=14; h=10; break;
            case 'container': maxHp = 60; sprite = container; w=15; h=15; break;
            case 'building_small': maxHp = 100; sprite = building1; w=20; h=30; break;
            case 'building_large': maxHp = 250; sprite = building2; w=25; h=45; break;
            case 'military_infantry': maxHp = 20; sprite = humanNpc; w=4; h=8; threat = 1; break; // Placeholder sprite
            case 'military_tank': maxHp = 150; sprite = tank; w=20; h=15; threat = 3; break;
            case 'military_heli': maxHp = 80; sprite = heli; w=20; h=12; threat = 4; break;
            case 'boss': maxHp = 1000; sprite = bossMilitary; w=30; h=40; threat = 10; break;
        }

        initialEntities.push({
            id: `ent_${entityId++}`, type, x, y, width: w, height: h, hp: maxHp, maxHp, sprite,
            state: props.state || 'idle', vx: 0, vy: 0, threatLevel: threat, ...props
        });
    };

    // Construct Scene based on level ID
    // Static structures (background to foreground)
    spawn('building_large', 60, 20);
    spawn('building_small', 45, 20);
    spawn('building_large', 85, 20);
    spawn('container', 35, 10);
    spawn('container', 38, 25);

    // Dynamic
    for(let i=0; i<6; i++) spawn('civilian', 20 + Math.random() * 60, 10 + Math.random() * 5);
    spawn('boat', 20, 20);
    spawn('speedboat', 70, 25);

    setEntities(initialEntities);

  }, [id]);

  // --- Main Game Engine Loop ---
  useEffect(() => {
    if (gameState !== 'playing') return;

    engineTickRef.current = setInterval(() => {
      
      // 1. Resource Regen
      setEnergy(prev => Math.min(maxEnergy, prev + 1));
      
      // 2. Environment Dynamics
      if (Math.random() < 0.02) {
          const weathers: Environment[] = ['clear', 'rain', 'fog', 'storm'];
          setWeather(weathers[Math.floor(Math.random() * weathers.length)]);
      }

      // 3. AI & Physics Update
      setEntities(prevEntities => {
          let updated = [...prevEntities];
          let totalMilitaryThreat = 0;

          updated = updated.map(ent => {
              if (ent.state === 'dead' || ent.state === 'grabbed') return ent;

              let newX = ent.x;
              let newY = ent.y;
              let newState = ent.state;
              let newHp = ent.hp;

              // Distance to player
              const distToPlayer = Math.abs(ent.x - playerX);

              // Basic Behavior Tree
              switch(ent.type) {
                  case 'civilian':
                      if (distToPlayer < 30 && newState !== 'panicking') {
                          newState = 'panicking';
                      }
                      if (newState === 'panicking' || newState === 'fleeing') {
                          const dir = ent.x < playerX ? -1 : 1;
                          newX += dir * 1.5; // Run away
                      }
                      break;

                  case 'military_tank':
                  case 'military_heli':
                  case 'military_infantry':
                      totalMilitaryThreat += ent.threatLevel;
                      if (distToPlayer > 40) {
                          // Move towards player
                          newX += ent.x > playerX ? -0.5 : 0.5;
                      } else {
                          newState = 'attacking';
                          // Fire logic
                          if (Math.random() < (ent.type === 'military_tank' ? 0.1 : 0.2)) {
                              const damage = ent.type === 'military_tank' ? 10 : ent.type === 'military_heli' ? 5 : 2;
                              setHealth(h => Math.max(0, h - damage));
                              spawnCombatText(`-${damage}`, playerX, 50, 'damage');
                              triggerScreenShake('small');
                              spawnParticle(playerX + (Math.random()*10 - 5), 30 + (Math.random()*20), 'explosion');
                          }
                      }
                      break;
                  
                  case 'boss':
                      if (distToPlayer > 20) {
                          newX += ent.x > playerX ? -1 : 1;
                      } else {
                          if (Math.random() < 0.2) {
                              setHealth(h => Math.max(0, h - 20));
                              spawnCombatText('-20', playerX, 50, 'damage');
                              triggerScreenShake('large');
                              spawnParticle(playerX, 30, 'explosion');
                          }
                      }
                      break;

                  default: // Static or semi-static (boats)
                      if ((ent.type === 'boat' || ent.type === 'speedboat') && distToPlayer < 40 && Math.random() < 0.1) {
                           newState = 'fleeing';
                      }
                      if (newState === 'fleeing') {
                           newX += ent.type === 'speedboat' ? 2 : 1;
                      }
                      break;
              }

              // Bounds checking
              newX = Math.max(0, Math.min(100, newX));

              return { ...ent, x: newX, y: newY, state: newState, hp: newHp };
          });

          // 4. Director / Spawner Logic based on Wanted Level
          const maxThreatAllowed = wantedLevel * 5;
          if (totalMilitaryThreat < maxThreatAllowed && Math.random() < 0.1) {
              // Spawn military
              const spawnSide = Math.random() > 0.5 ? -10 : 110;
              if (wantedLevel >= 2 && Math.random() < 0.5) {
                 updated.push({
                    id: `tank_${Date.now()}`, type: 'military_tank', x: spawnSide, y: 15, width: 20, height: 15, hp: 150, maxHp: 150, sprite: tank, state: 'idle', vx: 0, vy: 0, threatLevel: 3
                 });
                 addMessage("Tanque inimigo a caminho!");
              } else if (wantedLevel >= 3 && Math.random() < 0.3) {
                 updated.push({
                    id: `heli_${Date.now()}`, type: 'military_heli', x: spawnSide, y: 70, width: 20, height: 12, hp: 80, maxHp: 80, sprite: heli, state: 'idle', vx: 0, vy: 0, threatLevel: 4
                 });
              }
          }

          // Clean up dead/off-screen entities
          updated = updated.filter(ent => ent.hp > 0 && ent.x >= -20 && ent.x <= 120);

          return updated;
      });

      // 5. Win/Loss Conditions
      if (health <= 0) {
          setGameState('defeat');
      } else if (destruction >= 100) {
          setGameState('victory');
      }

    }, 100); // 10 FPS Logic update for browser performance

    return () => {
        if (engineTickRef.current) clearInterval(engineTickRef.current);
    };
  }, [gameState, playerX, wantedLevel]);

  // --- Combat Engine ---
  const performAttack = (type: AttackType) => {
    if (gameState !== 'playing') return;

    let cost = 0, baseDamage = 0, range = 15, hitboxOffset = isFacingRight ? 15 : -15;
    let attackDuration = 300;

    switch(type) {
      case 'light': cost = 5; baseDamage = 20; range = 15; break;
      case 'heavy': cost = 25; baseDamage = 60; range = 20; hitboxOffset = isFacingRight ? 20 : -20; triggerScreenShake('small'); break;
      case 'special': cost = 50; baseDamage = 150; range = 60; hitboxOffset = isFacingRight ? 30 : -30; triggerScreenShake('massive'); attackDuration = 600; break;
      case 'grab': cost = 15; break;
      case 'throw': cost = 10; baseDamage = 80; range = 70; hitboxOffset = isFacingRight ? 40 : -40; triggerScreenShake('large'); break;
      case 'eat': cost = 10; range = 15; break;
    }

    if (energy < cost) {
        spawnCombatText('Sem Energia', playerX, 60, 'system');
        return;
    }

    setEnergy(prev => prev - cost);
    setIsAttacking(type);
    setTimeout(() => setIsAttacking(null), attackDuration);

    const hitXCenter = playerX + hitboxOffset;

    // --- Interaction Logic ---
    if (type === 'grab') {
        const grabables = ['civilian', 'boat', 'speedboat', 'container', 'military_infantry', 'military_tank'];
        const target = entities.find(e => 
            e.state !== 'grabbed' && 
            grabables.includes(e.type) && 
            Math.abs(e.x - hitXCenter) < range
        );

        if (target) {
            setGrabbedEntityId(target.id);
            setEntities(prev => prev.map(e => e.id === target.id ? { ...e, state: 'grabbed' } : e));
            addMessage(`Agarrou ${target.type.replace('_', ' ')}`);
        } else {
             spawnCombatText('Errou', hitXCenter, 40, 'system');
        }
        return;
    }

    if (type === 'throw') {
        if (!grabbedEntityId) return;
        const projectile = entities.find(e => e.id === grabbedEntityId);
        if (projectile) {
            // Un-grab and kill the thrown object immediately for simplicity
            setEntities(prev => prev.filter(e => e.id !== projectile.id));
            setGrabbedEntityId(null);
            
            // Apply damage to everything in a massive line
            let hitCount = 0;
            let totalDmg = baseDamage + (projectile.type === 'container' || projectile.type === 'military_tank' ? 100 : projectile.type.includes('boat') ? 50 : 10);
            
            setEntities(prev => prev.map(e => {
                const distance = isFacingRight ? (e.x - playerX) : (playerX - e.x);
                if (distance > 0 && distance < range && e.state !== 'grabbed') {
                    hitCount++;
                    spawnCombatText(`-${totalDmg}`, e.x, e.y + e.height, 'damage');
                    spawnParticle(e.x, e.y + (e.height/2), 'explosion');
                    return { ...e, hp: e.hp - totalDmg };
                }
                return e;
            }));

            if(hitCount > 0) {
                 addMessage(`Impacto Crítico! (${hitCount} acertos)`);
                 setDestruction(prev => Math.min(100, prev + 5));
                 setScore(prev => prev + hitCount * 50);
            }
        }
        return;
    }

    if (type === 'eat') {
        const edibles = ['civilian', 'military_infantry'];
        // Check grabbed first
        if (grabbedEntityId) {
            const held = entities.find(e => e.id === grabbedEntityId);
            if (held && edibles.includes(held.type)) {
                setHealth(prev => Math.min(maxHealth, prev + 25));
                setEntities(prev => prev.filter(e => e.id !== grabbedEntityId));
                setGrabbedEntityId(null);
                setWantedLevel(prev => Math.min(5, prev + 1)); // Eating raises wanted level fast
                spawnCombatText('+25 HP', playerX, 60, 'heal');
                addMessage("Recuperação Vital!");
                triggerScreenShake('small');
                return;
            }
        }

        // Try eating from ground
        const target = entities.find(e => edibles.includes(e.type) && Math.abs(e.x - hitXCenter) < range);
        if (target) {
            setHealth(prev => Math.min(maxHealth, prev + 15));
            setEntities(prev => prev.filter(e => e.id !== target.id));
            setWantedLevel(prev => Math.min(5, prev + 0.5));
            spawnCombatText('+15 HP', playerX, 60, 'heal');
            triggerScreenShake('small');
        } else {
             spawnCombatText('Errou', hitXCenter, 40, 'system');
        }
        return;
    }

    // --- Standard Damage Resolution (Light, Heavy, Special) ---
    let hits = 0;
    let destructionEarned = 0;

    setEntities(prev => prev.map(e => {
        if (e.state === 'grabbed') return e;
        
        // Calculate hit detection based on facing direction and range
        const isHit = isFacingRight 
            ? (e.x >= playerX && e.x <= playerX + range) 
            : (e.x <= playerX && e.x >= playerX - range);

        if (isHit) {
            hits++;
            
            // Damage Modifiers
            let finalDamage = baseDamage;
            if (e.type.includes('building')) finalDamage *= (type === 'heavy' ? 1.5 : 1); // Heavy is good against buildings
            if (e.type.includes('military')) finalDamage *= (type === 'special' ? 2 : 1);

            spawnCombatText(`-${finalDamage}`, e.x, e.y + e.height + 5, 'damage');
            
            // Spawn explosion effect where hit occurred
            spawnParticle(e.x, e.y + (e.height/2), 'explosion');

            // Calculate destruction points if this hit kills a structure
            if (e.hp - finalDamage <= 0 && e.type.includes('building')) {
                destructionEarned += e.type === 'building_large' ? 10 : 5;
                setWantedLevel(prev => Math.min(5, prev + 0.5));
                // Extra explosion for building destruction
                spawnParticle(e.x, e.y + e.height, 'explosion');
                spawnParticle(e.x, e.y, 'explosion');
            }

            return { ...e, hp: e.hp - finalDamage };
        }
        return e;
    }));

    if (hits > 0) {
        setDestruction(prev => Math.min(100, prev + destructionEarned + 0.5));
        setScore(prev => prev + hits * 10 + destructionEarned * 100);
    }
  };

  // --- Input Handling ---
  const handleMove = (dir: 'left' | 'right') => {
      if (gameState !== 'playing') return;
      setIsFacingRight(dir === 'right');
      setPlayerX(prev => {
          const moveAmt = 2;
          const newX = dir === 'right' ? prev + moveAmt : prev - moveAmt;
          return Math.max(0, Math.min(100, newX));
      });
  };

  // --- Rendering Helpers ---
  const envStyles = {
      overlay: isNight ? "bg-[#051114]/90 mix-blend-multiply" : weather === 'rain' ? "bg-gray-500/50 mix-blend-multiply" : weather === 'storm' ? "bg-[#2b1b3d]/70 mix-blend-multiply" : "bg-transparent",
      filters: weather === 'fog' ? "blur-[3px] brightness-110 contrast-125" : ""
  };

  // Get currently grabbed entity object to render in hand
  const grabbedEntity = entities.find(e => e.id === grabbedEntityId);

  return (
    <div 
      id="game-screen" 
      className={`relative w-full h-screen overflow-hidden flex flex-col font-sans select-none`}
      style={{ backgroundColor: isNight ? '#020a0d' : '#87ceeb' }}
    >
      {/* ---------------- ENVIRONMENT ---------------- */}
      <div 
        className={`absolute inset-0 z-0 transition-all duration-[3000ms] ${envStyles.filters} pixelated-render`}
        style={{
          backgroundImage: `url(${id === 'salvador' ? salvadorBg : baixoSulBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          backgroundRepeat: 'repeat-x',
          transform: tide === 'high' ? 'translateY(10%)' : tide === 'low' ? 'translateY(-10%)' : 'none'
        }}
      />
      <div className={`absolute inset-0 z-10 pointer-events-none transition-colors duration-[3000ms] ${envStyles.overlay}`} />
      
      {(weather === 'rain' || weather === 'storm') && (
         <div className="absolute inset-0 z-15 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjUwIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSI0MCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjQpIi8+PC9zdmc+')] animate-[rain_0.3s_linear_infinite]" />
      )}
      {weather === 'storm' && (
         <div className="absolute inset-0 z-15 pointer-events-none bg-white animate-[lightning_5s_infinite]" />
      )}

      {/* ---------------- HUD TOP ---------------- */}
      <div className="absolute top-0 left-0 w-full p-2 md:p-4 z-50 flex justify-between items-start pointer-events-none">
        
        {/* Core Stats */}
        <div className="flex flex-col gap-1 w-[40%] max-w-[250px]">
          <div className="bg-[#111] border-2 border-gray-600 p-1 shadow-[2px_2px_0_rgba(0,0,0,0.8)] relative">
            <span className="absolute top-0 left-1 font-display text-[8px] text-white z-10 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">HP {Math.floor(health)}/{maxHealth}</span>
            <div className="w-full h-4 md:h-5 bg-gray-900 border border-gray-800">
              <div className="h-full bg-gradient-to-r from-red-800 to-red-500 transition-all duration-200" style={{ width: `${(health/maxHealth)*100}%` }} />
            </div>
          </div>
          
          <div className="bg-[#111] border-2 border-gray-600 p-1 shadow-[2px_2px_0_rgba(0,0,0,0.8)] relative">
            <span className="absolute top-0 left-1 font-display text-[8px] text-white z-10 drop-shadow-[1px_1px_0_rgba(0,0,0,1)]">ATL EN {Math.floor(energy)}</span>
            <div className="w-full h-3 bg-gray-900 border border-gray-800">
              <div className="h-full bg-gradient-to-r from-purple-800 to-purple-400 transition-all duration-100" style={{ width: `${(energy/maxEnergy)*100}%` }} />
            </div>
          </div>
        </div>

        {/* Global Status (Wanted & Destruction) */}
        <div className="flex flex-col items-center gap-1">
           <div className="bg-[#111]/90 border border-red-900 px-2 py-1 shadow-[2px_2px_0_rgba(0,0,0,1)] flex flex-col items-center">
               <span className="font-display text-[8px] text-red-500 mb-1">NÍVEL DE AMEAÇA MILITAR</span>
               <div className="flex gap-1">
                   {[1,2,3,4,5].map(star => (
                       <div key={star} className={`w-3 h-3 text-[10px] flex items-center justify-center font-display ${star <= Math.floor(wantedLevel) ? 'text-red-500' : 'text-gray-800'}`}>
                           ★
                       </div>
                   ))}
               </div>
           </div>
           
           <div className="w-full bg-[#111]/90 border border-orange-900 p-1 shadow-[2px_2px_0_rgba(0,0,0,1)] text-center mt-1">
              <div className="font-display text-[8px] text-orange-400 uppercase">Devastação</div>
              <div className="text-white font-display text-xs">{Math.floor(destruction)}%</div>
           </div>
        </div>

        {/* Score & Exit */}
        <div className="flex flex-col items-end gap-2">
          <div className="bg-[#111] border-2 border-gray-600 px-3 py-1 md:py-2 shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
            <span className="font-display text-[10px] md:text-sm text-yellow-400">PTS\n{score.toString().padStart(7, '0')}</span>
          </div>
          <button 
            onClick={() => setLocation('/map')}
            className="pointer-events-auto bg-[#111] text-gray-300 font-display text-[8px] md:text-[10px] px-2 py-1 border-2 border-gray-600 hover:bg-white hover:text-black transition-colors shadow-[2px_2px_0_rgba(0,0,0,0.8)]"
          >
            [ PAUSA ]
          </button>
        </div>
      </div>

      {/* Action Messages Log */}
      <div className="absolute top-32 left-0 w-full z-40 pointer-events-none px-4">
          {messages.map((msg, i) => (
             <div key={i} className="font-display text-[8px] md:text-[10px] text-white pixel-text-shadow bg-black/30 w-max mb-1 animate-in slide-in-from-left fade-in duration-300 border-l-2 border-primary pl-1">
               &gt; {msg}
             </div>
          ))}
      </div>

      {/* ---------------- WORLD SCENE ---------------- */}
      <div className="flex-1 relative z-20 flex items-end pb-[160px] md:pb-[180px] pixelated-render">
        
        {/* Entities Rendering */}
        {entities.map(ent => {
          if (ent.state === 'grabbed') return null; // Don't render grabbed items on the ground
          
          return (
          <div 
            key={ent.id}
            className="absolute flex flex-col items-center justify-end"
            style={{ 
              left: `${ent.x}%`, 
              bottom: (ent.type === 'boat' || ent.type === 'speedboat') ? '15%' : '5%', // Basic Z-depth
              width: `${ent.width}vh`, // Responsive sizing
              height: `${ent.height}vh`,
              transition: 'left 0.1s linear',
              zIndex: ent.type.includes('building') ? 10 : 20
            }}
          >
            {/* HP Bar for larger entities */}
            {ent.maxHp > 20 && ent.hp < ent.maxHp && (
                <div className="w-[80%] h-1 md:h-1.5 bg-black border border-gray-700 mb-1">
                    <div 
                        className={`h-full transition-all ${ent.type === 'boss' || ent.type.includes('military') ? 'bg-purple-500' : 'bg-red-500'}`} 
                        style={{width: `${(ent.hp / ent.maxHp) * 100}%`}} 
                    />
                </div>
            )}
            
            {/* Sprite */}
            <img 
              src={ent.sprite} 
              alt={ent.type}
              className={`w-full h-full object-contain filter drop-shadow-xl ${
                  ent.state === 'fleeing' || ent.state === 'panicking' ? 'animate-bounce' : ''
              } ${ent.type === 'military_tank' && Math.random() < 0.1 ? 'brightness-150' : '' /* Muzzle flash mock */}`}
              style={{
                  transform: ent.type === 'military_heli' ? `translateY(${Math.sin(Date.now()/200)*5}px)` : 'none'
              }}
            />
          </div>
        )})}

        {/* Explosion Particles */}
        {particles.map(p => {
             const progress = (Date.now() - p.createdAt) / 600; // 0 to 1
             const frameIndex = Math.min(2, Math.floor(progress * 3));
             const frames = [exp1, exp2, exp3];
             
             return (
                 <div
                     key={p.id}
                     className="absolute z-40 w-[15vh] h-[15vh] pointer-events-none mix-blend-screen"
                     style={{
                         left: `${p.x}%`,
                         bottom: `${p.y}%`,
                         transform: `translate(-50%, 50%) scale(${1 + progress})`,
                         opacity: 1 - progress
                     }}
                 >
                     <img src={frames[frameIndex]} className="w-full h-full object-contain" />
                 </div>
             )
        })}

        {/* Player Kaiju Rendering */}
        <div 
            className="absolute z-30 flex flex-col items-center justify-end"
            style={{
                left: `${playerX}%`,
                bottom: '5%',
                width: '35vh',
                height: '35vh',
                transition: 'left 0.1s linear',
            }}
        >
          {/* Action indicator ring */}
          {isAttacking && (
              <div className={`absolute inset-0 rounded-full animate-ping opacity-30 z-0 ${
                  isAttacking === 'special' ? 'bg-purple-500 scale-150' : 
                  isAttacking === 'heavy' ? 'bg-orange-500 scale-110' : 'bg-red-500'
              }`} />
          )}
            
          <img 
            src={kaijuSprite} // Ideally this comes from Lair selection context
            alt="Player Kaiju" 
            className={`w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(0,0,0,0.9)] relative z-10 transition-transform ${isFacingRight ? '' : 'scale-x-[-1]'} ${isAttacking ? 'brightness-125' : ''}`}
            style={{
                transform: `${isFacingRight ? 'scaleX(1)' : 'scaleX(-1)'} ${isAttacking === 'heavy' ? 'translateY(-10px) rotate(5deg)' : ''}`
            }}
          />
          
          {/* Render Grabbed Item visually in hand */}
          {grabbedEntity && (
             <div 
                 className={`absolute z-20 w-[40%] h-[40%] transition-transform ${isAttacking === 'throw' ? 'animate-bounce scale-150 blur-sm' : ''}`}
                 style={{ 
                     top: '20%', 
                     left: isFacingRight ? '70%' : '-10%',
                 }}
             >
                <img src={grabbedEntity.sprite} className="w-full h-full object-contain brightness-50 sepia hue-rotate-[180deg]" />
             </div>
          )}
        </div>

        {/* Floating Combat Text */}
        {combatTexts.map(ct => (
            <div 
                key={ct.id}
                className={`absolute z-50 font-display text-[10px] md:text-xs pixel-text-shadow animate-[floatUp_1s_ease-out_forwards] pointer-events-none ${
                    ct.type === 'damage' ? 'text-red-500' :
                    ct.type === 'heal' ? 'text-green-400' :
                    ct.type === 'system' ? 'text-gray-400' : 'text-blue-400'
                }`}
                style={{
                    left: `${ct.x}%`,
                    bottom: `${ct.y}%`
                }}
            >
                {ct.text}
            </div>
        ))}
      </div>

      {/* ---------------- CONTROLS BOTTOM ---------------- */}
      <div className="absolute bottom-0 w-full h-[160px] md:h-[180px] bg-[#0a0a0a] border-t-2 border-gray-700 z-50 p-2 md:p-3 flex flex-col justify-end touch-none">
        
        <div className="flex justify-between h-full max-w-5xl mx-auto w-full gap-2">
            
            {/* Left: Movement */}
            <div className="w-[120px] md:w-[150px] h-full flex flex-col justify-end gap-2 pb-2">
                <div className="bg-gray-900 border border-gray-800 p-1 flex justify-center gap-2 h-1/2">
                    <button 
                        className="w-1/2 bg-gray-800 border-b-4 border-gray-950 rounded-sm flex items-center justify-center font-display text-lg text-gray-400 active:translate-y-1 active:border-b-0 active:bg-gray-700"
                        onPointerDown={() => handleMove('left')}
                        onClick={() => handleMove('left')}
                    >
                        &lt;
                    </button>
                    <button 
                        className="w-1/2 bg-gray-800 border-b-4 border-gray-950 rounded-sm flex items-center justify-center font-display text-lg text-gray-400 active:translate-y-1 active:border-b-0 active:bg-gray-700"
                        onPointerDown={() => handleMove('right')}
                        onClick={() => handleMove('right')}
                    >
                        &gt;
                    </button>
                </div>
            </div>

            {/* Center: Contextual Actions */}
            <div className="flex-1 flex gap-2 h-full pb-2">
                 <div className="w-1/2 flex flex-col justify-end gap-2">
                     <button 
                        onClick={() => grabbedEntityId ? performAttack('throw') : performAttack('grab')}
                        disabled={energy < 15}
                        className={`h-full border-2 ${grabbedEntityId ? 'bg-amber-700 border-amber-500' : 'bg-gray-800 border-gray-600'} rounded-sm flex flex-col items-center justify-center font-display active:scale-95 disabled:opacity-30`}
                    >
                        <span className={`text-[10px] md:text-xs ${grabbedEntityId ? 'text-white' : 'text-gray-300'}`}>{grabbedEntityId ? 'ARREMESSAR' : 'AGARRAR'}</span>
                        <span className="text-[6px] text-gray-500 mt-1">{grabbedEntityId ? '-10 EN' : '-15 EN'}</span>
                    </button>
                 </div>
                 <div className="w-1/2 flex flex-col justify-end gap-2">
                     <button 
                        onClick={() => performAttack('eat')}
                        disabled={energy < 10}
                        className={`h-full bg-[#1a381a] border-2 border-[#2d5a27] rounded-sm flex flex-col items-center justify-center font-display active:scale-95 disabled:opacity-30 hover:bg-[#3a7a33]`}
                    >
                        <span className="text-[10px] md:text-xs text-green-300">DEVORAR</span>
                        <span className="text-[6px] text-gray-500 mt-1">-10 EN</span>
                    </button>
                 </div>
            </div>

            {/* Right: Core Attacks */}
            <div className="w-[180px] md:w-[220px] h-full bg-[#151515] border border-gray-800 p-2 rounded-tl-xl flex gap-2 justify-end items-end pb-2">
                <button 
                    onClick={() => performAttack('light')}
                    disabled={energy < 5}
                    className="w-[30%] aspect-square rounded-full border-2 border-gray-500 bg-gray-700 text-white font-display text-[8px] flex flex-col items-center justify-center active:scale-90 disabled:opacity-30 shadow-[0_3px_0_#333] active:translate-y-1 active:shadow-none"
                >
                    GOLPE
                </button>
                
                <button 
                    onClick={() => performAttack('heavy')}
                    disabled={energy < 25}
                    className="w-[35%] aspect-square rounded-full border-2 border-orange-500 bg-orange-700 text-white font-display text-[8px] flex flex-col items-center justify-center active:scale-90 disabled:opacity-30 shadow-[0_4px_0_#7c2d12] active:translate-y-1 active:shadow-none"
                >
                    ESMAGAR
                </button>

                <button 
                    onClick={() => performAttack('special')}
                    disabled={energy < 50}
                    className="w-[40%] aspect-square rounded-full border-2 border-purple-400 bg-purple-700 text-white font-display text-[10px] flex flex-col items-center justify-center active:scale-90 disabled:opacity-30 shadow-[0_5px_0_#4c1d95] active:translate-y-[5px] active:shadow-none relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900 to-transparent opacity-50 pointer-events-none" />
                    <span className="relative z-10 text-shadow-sm">RAIO</span>
                </button>
            </div>
        </div>
      </div>

      {/* Game Over / Victory Overlay */}
      {gameState !== 'playing' && (
          <div className="absolute inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
              <h1 className={`font-display text-4xl md:text-6xl mb-4 pixel-text-shadow ${gameState === 'victory' ? 'text-green-500' : 'text-red-600'}`}>
                  {gameState === 'victory' ? 'DEVASTAÇÃO TOTAL' : 'KAIJU ELIMINADO'}
              </h1>
              <p className="font-sans text-xl text-white mb-8">PONTUAÇÃO FINAL: {score}</p>
              <button 
                  onClick={() => window.location.reload()}
                  className="bg-[#111] border-4 border-white px-8 py-4 font-display text-xl text-white hover:bg-white hover:text-black transition-colors"
              >
                  NOVA INVASÃO
              </button>
          </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake { 0%, 100% {transform: translate(0,0);} 10%, 30%, 50%, 70%, 90% {transform: translate(-5px,-5px);} 20%, 40%, 60%, 80% {transform: translate(5px,5px);} }
        @keyframes shake-small { 0%, 100% {transform: translate(0,0);} 25% {transform: translate(-2px,2px);} 75% {transform: translate(2px,-2px);} }
        @keyframes shake-massive { 0%, 100% {transform: translate(0,0);} 10%, 30%, 50%, 70%, 90% {transform: translate(-10px,-10px) rotate(-2deg);} 20%, 40%, 60%, 80% {transform: translate(10px,10px) rotate(2deg);} }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        .animate-shake-small { animation: shake-small 0.2s ease-in-out; }
        .animate-shake-massive { animation: shake-massive 0.6s ease-in-out; }
        
        @keyframes floatUp {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            100% { transform: translateY(-50px) scale(1.2); opacity: 0; }
        }
        @keyframes lightning {
            0%, 95%, 98%, 100% { opacity: 0; }
            96%, 99% { opacity: 0.8; }
        }
      `}} />
    </div>
  );
}