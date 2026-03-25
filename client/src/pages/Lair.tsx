import { useLocation } from "wouter";
import { useState } from "react";
import lairBg from "../assets/lair_bg.png";
import kaijuSprite from "../assets/kaiju_sprite.png";
import crabKaiju from "../assets/crab_kaiju.png";
import birdKaiju from "../assets/bird_kaiju.png";
import gatorKaiju from "../assets/gator_kaiju.png";
import rayKaiju from "../assets/ray_kaiju.png";

// --- Deep Types ---
type BodyPart = 'head' | 'arms' | 'legs' | 'core' | 'tail' | 'wings' | 'carapace';
type WeaponCategory = 'biologic' | 'atl' | 'hybrid' | 'improvised';
type ClassRole = 'tank' | 'bruiser' | 'mobility' | 'control' | 'amphibious' | 'aerial';

interface Ability {
  name: string;
  type: 'passive' | 'active' | 'ultimate';
  description: string;
  cost?: number;
}

interface KaijuClass {
  id: string;
  name: string;
  role: ClassRole;
  sprite: string;
  stats: { str: number; agi: number; def: number; atl: number; hp: number };
  abilities: Ability[];
  description: string;
}

interface CustomPart {
  id: string;
  name: string;
  category: WeaponCategory;
  slot: BodyPart;
  bonus: string;
  description: string;
}

// --- Deep Data ---
const CLASSES: KaijuClass[] = [
  { 
    id: 'reptile', 
    name: 'Lagarto Mutante do Mangue', 
    role: 'bruiser', 
    sprite: kaijuSprite, 
    stats: { str: 7, agi: 5, def: 6, atl: 5, hp: 120 }, 
    description: 'Equilibrado e letal. Originalmente um réptil costeiro exposto ao vazamento ATL primário.',
    abilities: [
      { name: 'Regeneração Rápida', type: 'passive', description: 'Cura 1% HP a cada 3s.' },
      { name: 'Mordida Esmagadora', type: 'active', cost: 15, description: 'Causa dano massivo a alvos singulares.' },
      { name: 'Sopro Radioativo', type: 'ultimate', cost: 80, description: 'Raio de plasma ATL que varre a tela.' }
    ]
  },
  { 
    id: 'crab', 
    name: 'Guaiamum Couraçado', 
    role: 'tank', 
    sprite: crabKaiju, 
    stats: { str: 9, agi: 2, def: 10, atl: 3, hp: 200 }, 
    description: 'Força bruta e defesa impenetrável. Perfeito para destruir estruturas.',
    abilities: [
      { name: 'Carapaça de Manguezal', type: 'passive', description: 'Reduz dano balístico em 40%.' },
      { name: 'Garra Guilhotina', type: 'active', cost: 20, description: 'Corta veículos blindados ao meio.' },
      { name: 'Terremoto Sísmico', type: 'ultimate', cost: 70, description: 'Bate no chão, destruindo construções e stunando inimigos terrestres.' }
    ]
  },
  { 
    id: 'bird', 
    name: 'Garça Sombria', 
    role: 'aerial', 
    sprite: birdKaiju, 
    stats: { str: 4, agi: 10, def: 3, atl: 7, hp: 80 }, 
    description: 'Frágil, porém intocável. Domina os céus com ataques ágeis de energia.',
    abilities: [
      { name: 'Evasão Aérea', type: 'passive', description: '30% de chance de ignorar ataques físicos.' },
      { name: 'Mergulho Rasante', type: 'active', cost: 15, description: 'Ataque rápido que perfura linhas inimigas.' },
      { name: 'Tempestade de Penas ATL', type: 'ultimate', cost: 60, description: 'Dispara milhares de agulhas explosivas em área.' }
    ]
  },
  { 
    id: 'gator', 
    name: 'Besta do Estuário (Jacaré)', 
    role: 'amphibious', 
    sprite: gatorKaiju, 
    stats: { str: 8, agi: 4, def: 8, atl: 4, hp: 150 }, 
    description: 'Predador de emboscada. Mais forte quando em contato com a água.',
    abilities: [
      { name: 'Predador Aquático', type: 'passive', description: '+50% Dano durante Maré Alta ou Chuva.' },
      { name: 'Giro da Morte', type: 'active', cost: 25, description: 'Agarra um alvo e causa dano contínuo.' },
      { name: 'Tsunami Mutante', type: 'ultimate', cost: 75, description: 'Convoca uma onda destrutiva que arrasta navios e tropas.' }
    ]
  },
  { 
    id: 'ray', 
    name: 'Abissal Bioluminescente', 
    role: 'control', 
    sprite: rayKaiju, 
    stats: { str: 3, agi: 8, def: 4, atl: 10, hp: 100 }, 
    description: 'Arraia colossal flutuante. Mestra do controle do ATL e dano elétrico.',
    abilities: [
      { name: 'Aura Elétrica', type: 'passive', description: 'Inimigos próximos tomam dano constante.' },
      { name: 'Chicote Voltaico', type: 'active', cost: 20, description: 'Eletrocuta múltiplos alvos em cadeia.' },
      { name: 'PEM (Pulso Eletromagnético)', type: 'ultimate', cost: 90, description: 'Desativa instantaneamente todas as unidades militares por 10s.' }
    ]
  },
];

const ARSENAL: CustomPart[] = [
  // Biologic
  { id: 'w1', name: 'Lâmina Óssea de Peixe-Espada', category: 'biologic', slot: 'arms', bonus: '+3 STR, Dano Perfurante', description: 'Garras mutantes super afiadas com propriedades perfurantes.' },
  { id: 'w5', name: 'Cauda de Arraia com Ferrão', category: 'biologic', slot: 'tail', bonus: '+3 AGI, Veneno/Choque', description: 'Ferrão elétrico venenoso para ataques rápidos.' },
  { id: 'w6', name: 'Mandíbula de Tubarão Mutante', category: 'biologic', slot: 'head', bonus: '+2 STR, Bônus ao Comer', description: 'Aumenta ganho de HP ao devorar inimigos.' },
  
  // Improvised / Scrap
  { id: 'w2', name: 'Marreta de Âncora Encouraçada', category: 'improvised', slot: 'arms', bonus: '+5 STR, Lentidão', description: 'Âncora gigante de navio graneleiro usada como clava devastadora.' },
  { id: 'w4', name: 'Carapaça de Casco de Traineira', category: 'improvised', slot: 'carapace', bonus: '+4 DEF, -1 AGI', description: 'Casco de madeira e metal de navio afundado.' },
  { id: 'w7', name: 'Mastro-Lança', category: 'improvised', slot: 'arms', bonus: '+3 STR, Longo Alcance', description: 'Mastro de escuna usado como arma de haste.' },
  
  // ATL / Military Hybrid
  { id: 'w3', name: 'Núcleo ATL Instável', category: 'atl', slot: 'core', bonus: '+5 ATL, -1 DEF', description: 'Reator militar fundido ao peito. Aumenta poder especial.' },
  { id: 'w8', name: 'Canhão Híbrido de Sucata', category: 'hybrid', slot: 'arms', bonus: '+4 ATL, Dano em Área', description: 'Torreta de tanque destruído fundida ao braço.' },
  { id: 'w9', name: 'Propulsores de Lancha (Pernas)', category: 'hybrid', slot: 'legs', bonus: '+4 AGI, Investida Aquática', description: 'Motores acoplados às pernas para saltos e natação.' },
];

export default function Lair() {
  const [, setLocation] = useLocation();
  const [selectedClass, setSelectedClass] = useState<KaijuClass>(CLASSES[0]);
  const [equipped, setEquipped] = useState<Record<string, CustomPart | null>>({
    head: null, arms: null, legs: null, core: null, tail: null, wings: null, carapace: null
  });

  const equipItem = (part: CustomPart) => {
    setEquipped(prev => ({ ...prev, [part.slot]: part }));
  };

  const unequipItem = (slot: string) => {
      setEquipped(prev => ({ ...prev, [slot]: null }));
  }

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col md:flex-row text-white pixelated-render font-sans">
      
      {/* Background */}
      <div 
        className="absolute inset-0 z-0 bg-[#051114]"
        style={{
          backgroundImage: `url(${lairBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.8
        }}
      />
      <div className="absolute inset-0 z-0 bg-green-900/20 mix-blend-multiply" />
      <div className="scanlines z-50 pointer-events-none" />

      {/* Left Column: Selection & Stats */}
      <div className="relative z-10 w-full md:w-[40%] p-2 md:p-4 flex flex-col gap-2 md:gap-4 border-b-4 md:border-b-0 md:border-r-4 border-[#3a5a40] bg-black/90 overflow-y-auto">
        
        <div className="flex justify-between items-center bg-gray-900 border-2 border-[#5a8a60] p-2">
          <h2 className="font-display text-lg text-green-400 pixel-text-shadow uppercase">
            HUB DE MUTAÇÃO
          </h2>
          <button 
            onClick={() => setLocation('/map')}
            className="border-2 border-white px-2 py-1 text-xs font-display hover:bg-white hover:text-black transition-colors"
          >
            VOLTAR AO MAPA
          </button>
        </div>

        {/* Class Selection */}
        <div className="mt-2">
          <h3 className="font-display text-[10px] mb-1 text-green-600 uppercase border-b border-green-900 pb-1">Espécies Base Regionais</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {CLASSES.map(cls => (
              <button 
                key={cls.id}
                onClick={() => setSelectedClass(cls)}
                className={`flex-shrink-0 w-14 h-14 border-2 p-1 transition-all ${selectedClass.id === cls.id ? 'border-green-400 bg-green-900/40 scale-110 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'border-gray-700 bg-gray-900 opacity-70'}`}
              >
                <img src={cls.sprite} alt={cls.name} className="w-full h-full object-contain filter drop-shadow-md" />
              </button>
            ))}
          </div>
        </div>

        {/* Stats & Skills */}
        <div className="bg-gray-900/80 border border-gray-700 p-3 text-sm">
          <div className="flex justify-between items-end mb-2">
              <h3 className="font-display text-sm md:text-md text-green-300">{selectedClass.name}</h3>
              <span className="text-[10px] bg-gray-800 px-1 border border-gray-600 text-gray-400 uppercase">{selectedClass.role}</span>
          </div>
          <p className="text-[10px] text-gray-400 italic mb-2 leading-tight">{selectedClass.description}</p>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
             <div className="bg-black/50 p-1 border border-gray-800 flex justify-between"><span className="text-red-400">STR:</span> <span>{selectedClass.stats.str}</span></div>
             <div className="bg-black/50 p-1 border border-gray-800 flex justify-between"><span className="text-blue-400">AGI:</span> <span>{selectedClass.stats.agi}</span></div>
             <div className="bg-black/50 p-1 border border-gray-800 flex justify-between"><span className="text-yellow-600">DEF:</span> <span>{selectedClass.stats.def}</span></div>
             <div className="bg-black/50 p-1 border border-gray-800 flex justify-between"><span className="text-purple-400">ATL:</span> <span>{selectedClass.stats.atl}</span></div>
          </div>

          <div className="space-y-1">
             <h4 className="font-display text-[8px] text-gray-500 uppercase">Habilidades:</h4>
             {selectedClass.abilities.map(ab => (
                 <div key={ab.name} className="border-l-2 border-green-600 pl-2 py-1">
                     <div className="flex gap-2 items-center">
                         <span className="font-display text-[8px] text-white">{ab.name}</span>
                         <span className={`text-[6px] px-1 rounded ${ab.type === 'passive' ? 'bg-blue-900 text-blue-200' : ab.type === 'ultimate' ? 'bg-purple-900 text-purple-200' : 'bg-red-900 text-red-200'}`}>
                             {ab.type.toUpperCase()}
                         </span>
                         {ab.cost && <span className="text-[8px] text-purple-300 ml-auto">-{ab.cost} EN</span>}
                     </div>
                     <p className="text-[9px] text-gray-400 mt-0.5">{ab.description}</p>
                 </div>
             ))}
          </div>
        </div>

        {/* Arsenal List */}
        <div className="mt-1 flex-1 flex flex-col min-h-[200px]">
          <h3 className="font-display text-[10px] mb-1 text-green-600 uppercase border-b border-green-900 pb-1">Arsenal & Adaptações</h3>
          <div className="space-y-2 overflow-y-auto pr-2 flex-1">
            {ARSENAL.map(item => {
              const isEquipped = equipped[item.slot]?.id === item.id;
              return (
                <div 
                  key={item.id}
                  onClick={() => isEquipped ? unequipItem(item.slot) : equipItem(item)}
                  className={`bg-gray-900/80 border p-2 cursor-pointer transition-colors ${
                      isEquipped ? 'border-green-500 bg-green-900/20' : 'border-gray-700 hover:border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`font-display text-[9px] md:text-[10px] ${isEquipped ? 'text-green-400' : 'text-white'}`}>{item.name}</span>
                    <div className="flex gap-1">
                        <span className={`text-[8px] px-1 uppercase ${
                            item.category === 'biologic' ? 'text-red-300 bg-red-900/50' :
                            item.category === 'improvised' ? 'text-yellow-300 bg-yellow-900/50' :
                            item.category === 'hybrid' ? 'text-orange-300 bg-orange-900/50' :
                            'text-purple-300 bg-purple-900/50'
                        }`}>{item.category}</span>
                        <span className="text-[8px] text-gray-500 uppercase bg-black px-1 border border-gray-700">[{item.slot}]</span>
                    </div>
                  </div>
                  <p className="text-[10px] md:text-xs text-primary mt-1">{item.bonus}</p>
                  <p className="text-[9px] text-gray-500 mt-1 leading-tight">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Preview & Equipped Slots */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between p-4">
        
        {/* Equipped Slots UI Top */}
        <div className="w-full flex justify-center gap-2 md:gap-4 flex-wrap mt-4">
           {['head', 'core', 'carapace', 'arms', 'legs', 'tail', 'wings'].map(slotStr => {
               const slot = slotStr as BodyPart;
               const item = equipped[slot];
               return (
                   <div key={slot} className={`w-12 h-12 md:w-16 md:h-16 flex flex-col items-center justify-center border ${item ? 'border-green-500 bg-green-900/30' : 'border-gray-700 bg-black/60'} text-center cursor-pointer`} onClick={() => unequipItem(slot)}>
                       <span className="text-[8px] text-gray-500 uppercase">{slot}</span>
                       <span className="font-display text-[8px] text-white break-words w-full px-1">{item ? item.name : 'VAZIO'}</span>
                   </div>
               )
           })}
        </div>

        {/* Monster Preview */}
        <div className="relative w-64 h-64 md:w-96 md:h-96 flex items-center justify-center my-8">
          {/* Bioluminescent glow behind based on class */}
          <div className={`absolute inset-0 rounded-full animate-pulse blur-3xl opacity-30 ${
              selectedClass.id === 'ray' ? 'bg-blue-500' : 
              selectedClass.id === 'gator' ? 'bg-green-700' :
              selectedClass.id === 'crab' ? 'bg-orange-600' : 'bg-red-600'
          }`} />
          
          <img 
            src={selectedClass.sprite} 
            alt="Preview" 
            className="relative z-20 w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]"
          />
          
          {/* Decorative visual overlays based on equipment (simplified) */}
          {equipped.core && <div className="absolute z-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-purple-500 rounded-full blur-[4px] animate-pulse" />}
          {equipped.arms && <div className="absolute z-30 top-1/2 left-[10%] w-6 h-12 bg-red-900/50 border border-red-500 skew-y-12" />}
        </div>

        {/* Deploy Button */}
        <button 
          onClick={() => setLocation('/map')}
          className="mb-8 bg-[#5a8a60] border-4 border-white text-white font-display text-xl md:text-3xl px-8 py-4 hover:bg-green-500 active:scale-95 transition-all pixel-text-shadow w-[80%] max-w-md shadow-[0_0_20px_rgba(90,138,96,0.6)]"
        >
          INICIAR INVASÃO
        </button>
      </div>

    </div>
  );
}