import { useLocation, useParams } from "wouter";
import { useEffect, useState, useRef } from "react";
import baixoSulBg from "../assets/baixo_sul_bg.png";
import kaijuSprite from "../assets/kaiju_sprite.png";
import woodenBoat from "../assets/wooden_boat.png";
import speedboat from "../assets/speedboat.png";
import humanNpc from "../assets/human_npc.png";
import bossMilitary from "../assets/boss_military.png";
import container from "../assets/container.png";

// --- Game Logic Types ---
type Weather = 'clear' | 'rain' | 'fog' | 'storm';
type Tide = 'high' | 'low' | 'normal';
type NPCState = 'idle' | 'fleeing' | 'panicking' | 'attacking' | 'dead';
type ObjectType = 'boat' | 'speedboat' | 'human' | 'military' | 'boss' | 'container';

interface GameEntity {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  hp: number;
  maxHp?: number;
  state: NPCState;
  vx?: number;
  vy?: number;
}

export default function Level() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  
  // --- Game State ---
  const [destruction, setDestruction] = useState(0);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [energy, setEnergy] = useState(100);
  const [wantedLevel, setWantedLevel] = useState(0);
  
  // Environment Systems
  const [weather, setWeather] = useState<Weather>('clear');
  const [tide, setTide] = useState<Tide>('normal');
  const [isNight, setIsNight] = useState(false);
  const [isEarthquake, setIsEarthquake] = useState(false);

  // Entities & Combat
  const [entities, setEntities] = useState<GameEntity[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [grabbedItem, setGrabbedItem] = useState<GameEntity | null>(null);
  const [bossActive, setBossActive] = useState(false);
  
  // Simulation Loop
  useEffect(() => {
    // Initial spawn
    const initialEntities: GameEntity[] = [];
    
    // Humans
    for(let i=0; i<5; i++) {
        initialEntities.push({
          id: `human-${i}`, type: 'human', x: 30 + Math.random() * 50, y: 15 + Math.random() * 10, hp: 10, state: 'panicking'
        });
    }

    // Boats & Containers based on region
    if (id === 'valenca' || id === 'camamu' || id === 'salvador') {
      for(let i=0; i<2; i++) {
        initialEntities.push({
          id: `boat-${i}`, type: 'boat', x: 20 + Math.random() * 60, y: 60 + Math.random() * 10, hp: 30, state: 'idle'
        });
      }
      initialEntities.push({
        id: `container-1`, type: 'container', x: 70, y: 15, hp: 50, state: 'idle'
      });
    } else {
        initialEntities.push({
            id: `speedboat-1`, type: 'speedboat', x: 60, y: 65, hp: 40, state: 'idle'
        });
    }
    
    setEntities(initialEntities);

    // Main Game Loop
    const interval = setInterval(() => {
      // Regen
      setEnergy(prev => Math.min(100, prev + 2));
      
      // Random Environment Changes
      if (Math.random() < 0.05) {
        const weathers: Weather[] = ['clear', 'rain', 'fog', 'storm'];
        setWeather(weathers[Math.floor(Math.random() * weathers.length)]);
      }
      
      // Boss Spawn Logic
      if (destruction > 50 && !bossActive) {
          setBossActive(true);
          addMessage("ALERTA: COLOSSO MILITAR DETECTADO!");
          setEntities(prev => [...prev, {
              id: 'boss-1', type: 'boss', x: 80, y: 30, hp: 200, maxHp: 200, state: 'attacking'
          }]);
      }

      // Entity AI
      setEntities(prev => prev.map(ent => {
        let newX = ent.x;
        let newState = ent.state;

        if (ent.type === 'human') {
             newX += (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 3);
             newX = Math.max(0, Math.min(100, newX));
        }

        if ((ent.type === 'boat' || ent.type === 'speedboat') && newState === 'idle' && Math.random() < 0.1) {
          newState = 'fleeing';
        }

        if (newState === 'fleeing') {
          newX += 2;
        }
        
        if (ent.type === 'boss') {
            newX -= 0.5;
            if (Math.random() < 0.15) {
                setHealth(h => Math.max(0, h - 8));
                addMessage("Mutante Militar Atirou!");
                triggerScreenShake('small');
            }
        }

        return { ...ent, x: newX, state: newState };
      }).filter(ent => ent.x < 120 && ent.hp > 0)); 

    }, 1000);

    return () => clearInterval(interval);
  }, [id, destruction, bossActive]);

  const triggerScreenShake = (intensity: 'small' | 'large' = 'large') => {
      const screen = document.getElementById('game-screen');
      if (screen) {
        screen.classList.remove('animate-shake', 'animate-shake-small');
        // trigger reflow
        void screen.offsetWidth;
        screen.classList.add(intensity === 'large' ? 'animate-shake' : 'animate-shake-small');
      }
  };

  const addMessage = (msg: string) => {
    setMessages(prev => [...prev.slice(-3), msg]);
  };

  const handleAttack = (type: 'punch' | 'beam' | 'stomp' | 'grab' | 'eat' | 'throw') => {
    let cost = 0;
    let damage = 0;
    let attackRange = [10, 40]; // Base range x=10 to x=40
    
    switch(type) {
      case 'punch': cost = 10; damage = 15; break;
      case 'beam': cost = 40; damage = 40; attackRange = [10, 90]; break;
      case 'stomp': cost = 25; damage = 25; attackRange = [0, 30]; break;
      case 'eat': cost = 5; damage = 100; attackRange = [10, 30]; break;
      case 'grab': cost = 15; damage = 0; attackRange = [10, 40]; break;
      case 'throw': cost = 10; damage = 60; attackRange = [10, 90]; break;
    }

    if (energy >= cost) {
      setEnergy(prev => prev - cost);
      
      // Action logic
      if (type === 'grab') {
        const grabableTypes = ['boat', 'speedboat', 'human', 'container'];
        const grabable = entities.find(e => grabableTypes.includes(e.type) && e.x > attackRange[0] && e.x < attackRange[1]);
        if (grabable) {
          addMessage(`Agarrou ${grabable.type}!`);
          setGrabbedItem(grabable);
          setEntities(prev => prev.filter(e => e.id !== grabable.id));
        } else {
          addMessage("Nada para agarrar!");
        }
        return;
      }

      if (type === 'throw' && grabbedItem) {
          addMessage(`Arremessou ${grabbedItem.type}!`);
          setGrabbedItem(null);
          damage = 60 + (grabbedItem.type === 'container' ? 40 : grabbedItem.type === 'boat' ? 20 : 0);
          triggerScreenShake('large');
      }

      if (type === 'eat') {
          const edible = entities.find(e => e.type === 'human' && e.x > attackRange[0] && e.x < attackRange[1]);
          if (edible) {
              addMessage("Devorou Humano! +20 HP, +Pânico");
              setHealth(prev => Math.min(100, prev + 20));
              setWantedLevel(prev => Math.min(5, prev + 1));
              setEntities(prev => prev.filter(e => e.id !== edible.id));
          } else if (grabbedItem && grabbedItem.type === 'human') {
              addMessage("Devorou Humano Agarrado! +20 HP");
              setHealth(prev => Math.min(100, prev + 20));
              setWantedLevel(prev => Math.min(5, prev + 1));
              setGrabbedItem(null);
          } else {
              addMessage("Nada macio para comer!");
          }
          return;
      }

      // Normal Combat Resolution
      let hitCount = 0;
      setEntities(prev => prev.map(e => {
          if (e.x > attackRange[0] && e.x < attackRange[1]) {
              hitCount++;
              if (e.type === 'boss') addMessage("Dano no Boss!");
              return { ...e, hp: e.hp - damage };
          }
          return e;
      }));

      if (hitCount > 0 || type === 'throw') {
         setDestruction(prev => Math.min(100, prev + (damage/2)));
         setScore(prev => prev + (damage * 10));
      }

      triggerScreenShake(type === 'beam' || type === 'stomp' ? 'large' : 'small');

    } else {
      addMessage("Energia Insuficiente!");
    }
  };

  const envStyles = {
      overlay: isNight ? "bg-[#051114]/80 mix-blend-multiply" : weather === 'rain' ? "bg-gray-500/50 mix-blend-multiply" : weather === 'storm' ? "bg-purple-900/60 mix-blend-multiply" : "bg-transparent",
      filters: weather === 'fog' ? "blur-[2px] brightness-125" : ""
  };

  return (
    <div 
      id="game-screen" 
      className={`relative w-full h-screen overflow-hidden flex flex-col pixelated-render`}
      style={{ backgroundColor: isNight ? '#020a0d' : '#4a7a8c' }}
    >
      
      {/* Background Parallax */}
      <div 
        className={`absolute inset-0 z-0 transition-all duration-1000 ${envStyles.filters}`}
        style={{
          backgroundImage: `url(${baixoSulBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          backgroundRepeat: 'repeat-x',
          transform: tide === 'high' ? 'translateY(5%)' : tide === 'low' ? 'translateY(-5%)' : 'none'
        }}
      />
      
      <div className={`absolute inset-0 z-10 pointer-events-none transition-colors duration-1000 ${envStyles.overlay}`} />
      
      {(weather === 'rain' || weather === 'storm') && (
         <div className="absolute inset-0 z-15 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjUwIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSI0MCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjMpIi8+PC9zdmc+')] animate-[rain_0.5s_linear_infinite]" />
      )}

      {weather === 'fog' && <div className="absolute inset-0 z-15 pointer-events-none bg-white/40 backdrop-blur-[3px]" />}

      <div className="scanlines z-50 pointer-events-none" />

      {/* HUD Top */}
      <div className="absolute top-0 left-0 w-full p-4 z-40 flex justify-between items-start pointer-events-none">
        {/* Left Stats */}
        <div className="flex flex-col gap-2 w-[40%] max-w-[200px]">
          <div className="w-full bg-black/90 border-2 border-white p-1 shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center mb-1">
              <span className="font-display text-[10px] text-white">HP</span>
              <span className="font-display text-[10px] text-white">{health}%</span>
            </div>
            <div className="w-full h-3 bg-gray-800">
              <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${health}%` }} />
            </div>
          </div>
          
          <div className="w-full bg-black/90 border-2 border-white p-1 shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center mb-1">
              <span className="font-display text-[10px] text-white">ENERGIA ATL</span>
              <span className="font-display text-[10px] text-white">{energy}%</span>
            </div>
            <div className="w-full h-3 bg-gray-800">
              <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${energy}%` }} />
            </div>
          </div>
        </div>

        {/* Center Environmental Info */}
        <div className="flex flex-col items-center gap-1">
           <div className="bg-black/90 border-2 border-white px-2 py-1 flex items-center gap-2 shadow-[4px_4px_0_rgba(0,0,0,1)]">
             <span className="font-display text-[8px] text-blue-300 uppercase">Clima: {weather}</span>
           </div>
           {/* Wanted Level */}
           <div className="bg-black/80 px-2 py-1 flex gap-1 mt-1 border border-red-900">
               <span className="font-display text-[8px] text-red-500 mr-1">MILITAR:</span>
               {[1,2,3,4,5].map(star => (
                   <div key={star} className={`w-3 h-3 text-[10px] flex items-center justify-center font-display ${star <= wantedLevel ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>
                       ★
                   </div>
               ))}
           </div>
        </div>

        {/* Right Stats */}
        <div className="flex flex-col items-end gap-2">
          <div className="bg-black/90 border-2 border-white px-3 py-2 shadow-[4px_4px_0_rgba(0,0,0,1)]">
            <span className="font-display text-sm text-yellow-400">PTS: {score.toString().padStart(6, '0')}</span>
          </div>
          <button 
            onClick={() => setLocation('/map')}
            className="pointer-events-auto bg-black/90 text-white font-sans text-xl px-4 py-1 border-2 border-white hover:bg-white hover:text-black transition-colors shadow-[4px_4px_0_rgba(0,0,0,1)]"
          >
            VOLTAR
          </button>
        </div>
      </div>

      {/* Action Log */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-md pointer-events-none">
        <div className="w-full text-center flex flex-col items-center">
          {messages.map((msg, i) => (
             <div key={i} className="font-sans text-xl text-white pixel-text-shadow bg-black/50 px-2 my-1 animate-in fade-in slide-in-from-bottom-2">
               {msg}
             </div>
          ))}
        </div>
      </div>

      {/* Play Area */}
      <div className="flex-1 relative z-20 flex items-end pb-[150px] md:pb-[180px]">
        
        {/* Dynamic Entities */}
        {entities.map(ent => (
          <div 
            key={ent.id}
            className="absolute transition-all duration-1000 ease-linear flex flex-col items-center"
            style={{ 
              left: `${ent.x}%`, 
              bottom: (ent.type === 'boat' || ent.type === 'speedboat') ? '25%' : '15%',
              width: ent.type === 'human' ? '40px' : ent.type === 'boss' ? '180px' : ent.type === 'container' ? '80px' : '70px',
              height: ent.type === 'human' ? '40px' : ent.type === 'boss' ? '180px' : ent.type === 'container' ? '80px' : '70px',
            }}
          >
            {ent.type === 'boss' && ent.maxHp && (
                <div className="w-full h-3 bg-gray-800 border-2 border-white mb-2 shadow-[2px_2px_0_rgba(0,0,0,1)]">
                    <div className="h-full bg-red-600" style={{width: `${(ent.hp / ent.maxHp) * 100}%`}} />
                </div>
            )}
            <img 
              src={
                  ent.type === 'boat' ? woodenBoat : 
                  ent.type === 'human' ? humanNpc : 
                  ent.type === 'boss' ? bossMilitary : 
                  ent.type === 'container' ? container : speedboat
              } 
              alt={ent.type}
              className={`w-full h-full object-contain filter drop-shadow-xl ${
                  ent.state === 'fleeing' || ent.state === 'panicking' ? 'animate-bounce' : ''
              }`}
            />
          </div>
        ))}

        {/* Player Kaiju */}
        <div className="relative w-56 h-56 md:w-80 md:h-80 ml-[10%] z-30 flex items-center justify-center">
          <img 
            src={kaijuSprite} 
            alt="Kaiju" 
            className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]"
          />
          {/* Held Item Overlay */}
          {grabbedItem && (
             <div className="absolute top-[-10%] right-[-10%] w-20 h-20 bg-white/10 border-2 border-dashed border-white rounded-full flex items-center justify-center animate-pulse">
                <img 
                    src={grabbedItem.type === 'boat' ? woodenBoat : grabbedItem.type === 'container' ? container : humanNpc} 
                    className="w-14 h-14 object-contain" 
                />
             </div>
          )}
        </div>
      </div>

      {/* Controls Bottom */}
      <div className="absolute bottom-0 w-full h-auto min-h-[150px] bg-[#111] border-t-4 border-white z-40 p-2 md:p-4">
         {/* Destrucion Meter */}
         <div className="w-full max-w-lg mx-auto mb-3 flex items-center gap-2 bg-black p-1 border border-gray-700">
            <span className="font-display text-[8px] text-orange-500 uppercase tracking-widest">Nível de Destruição</span>
            <div className="flex-1 h-3 bg-gray-900 border border-gray-600 relative">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiM1NTAwMDAiIGZpbGwtb3BhY2l0eT0iMC40Ii8+PC9zdmc+')] opacity-50" />
                <div className="h-full bg-orange-600 transition-all duration-300 relative z-10" style={{ width: `${destruction}%` }} />
            </div>
         </div>

        <div className="flex justify-between items-center gap-2 h-full max-w-4xl mx-auto">
            
            {/* D-PAD */}
            <div className="w-24 md:w-32 h-full grid grid-cols-2 grid-rows-2 gap-1 p-1">
                <button className="col-span-2 bg-gray-800 border-b-4 border-gray-900 rounded-sm flex items-center justify-center font-display text-xs text-gray-300 active:translate-y-1 active:border-b-0">&uarr;</button>
                <button className="bg-gray-800 border-b-4 border-gray-900 rounded-sm flex items-center justify-center font-display text-xs text-gray-300 active:translate-y-1 active:border-b-0">&larr;</button>
                <button className="bg-gray-800 border-b-4 border-gray-900 rounded-sm flex items-center justify-center font-display text-xs text-gray-300 active:translate-y-1 active:border-b-0">&rarr;</button>
            </div>

            {/* Tactical Actions */}
            <div className="flex flex-col gap-2 w-20 md:w-28">
                 {grabbedItem ? (
                     <button 
                        onClick={() => handleAttack('throw')}
                        className="w-full py-2 bg-amber-600 border-2 border-white shadow-[0_0_10px_rgba(217,119,6,0.8)] text-white font-display text-[8px] md:text-[10px] flex flex-col items-center justify-center active:scale-95 transition-transform"
                    >
                        <span>ARREMESSAR</span>
                    </button>
                 ) : (
                    <button 
                        onClick={() => handleAttack('grab')}
                        disabled={energy < 15}
                        className="w-full py-2 bg-gray-700 border-2 border-gray-500 text-white font-display text-[8px] md:text-[10px] flex flex-col items-center justify-center active:scale-95 disabled:opacity-50"
                    >
                        <span>AGARRAR</span>
                    </button>
                 )}
                 <button 
                    onClick={() => handleAttack('eat')}
                    className="w-full py-2 bg-[#2d5a27] border-2 border-[#5a8a60] text-white font-display text-[8px] md:text-[10px] flex flex-col items-center justify-center active:scale-95 disabled:opacity-50 hover:bg-[#3a7a33]"
                >
                    <span>DEVORAR</span>
                    <span className="text-[6px] text-green-300 mt-1">+20 HP</span>
                </button>
            </div>

            {/* Core Attacks */}
            <div className="flex gap-2 md:gap-4 items-center bg-gray-900/50 p-2 rounded-lg border border-gray-800">
                <button 
                    onClick={() => handleAttack('punch')}
                    disabled={energy < 10}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-gray-400 bg-gray-700 text-white font-display text-[8px] md:text-[10px] flex flex-col items-center justify-center active:scale-95 disabled:opacity-50 hover:border-white shadow-[0_4px_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
                >
                    <span>GOLPE</span>
                    <span className="text-[6px] text-gray-400 mt-1">-10 EN</span>
                </button>
                
                <button 
                    onClick={() => handleAttack('stomp')}
                    disabled={energy < 25}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-orange-500 bg-orange-700 text-white font-display text-[8px] md:text-[10px] flex flex-col items-center justify-center active:scale-95 disabled:opacity-50 hover:border-white shadow-[0_4px_0_rgba(154,52,18,1)] active:translate-y-1 active:shadow-none transition-all"
                >
                    <span>ESMAGAR</span>
                    <span className="text-[6px] text-orange-300 mt-1">-25 EN</span>
                </button>

                <button 
                    onClick={() => handleAttack('beam')}
                    disabled={energy < 40}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full border-4 border-purple-400 bg-purple-700 text-white font-display text-[10px] md:text-xs flex flex-col items-center justify-center active:scale-95 disabled:opacity-50 hover:border-white hover:shadow-[0_0_15px_rgba(168,85,247,0.8)] shadow-[0_6px_0_rgba(88,28,135,1)] active:translate-y-1 active:shadow-none transition-all"
                >
                    <span>RAIO ATL</span>
                    <span className="text-[8px] text-purple-300 mt-1">-40 EN</span>
                </button>
            </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0% { transform: translate(3px, 3px) rotate(0deg); }
          10% { transform: translate(-3px, -4px) rotate(-2deg); }
          20% { transform: translate(-6px, 0px) rotate(2deg); }
          30% { transform: translate(6px, 4px) rotate(0deg); }
          40% { transform: translate(3px, -3px) rotate(2deg); }
          50% { transform: translate(-3px, 4px) rotate(-2deg); }
          60% { transform: translate(-6px, 3px) rotate(0deg); }
          70% { transform: translate(6px, 3px) rotate(-2deg); }
          80% { transform: translate(-3px, -3px) rotate(2deg); }
          90% { transform: translate(3px, 4px) rotate(0deg); }
          100% { transform: translate(3px, -4px) rotate(-2deg); }
        }
        @keyframes shake-small {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          25% { transform: translate(-1px, -1px) rotate(-1deg); }
          50% { transform: translate(-1px, 1px) rotate(1deg); }
          75% { transform: translate(1px, -1px) rotate(-1deg); }
          100% { transform: translate(1px, 1px) rotate(0deg); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        .animate-shake-small {
          animation: shake-small 0.2s ease-in-out both;
        }
        @keyframes rain {
          0% { transform: translateY(-100vh) translateX(0); }
          100% { transform: translateY(100vh) translateX(-20vh); }
        }
      `}} />
    </div>
  );
}