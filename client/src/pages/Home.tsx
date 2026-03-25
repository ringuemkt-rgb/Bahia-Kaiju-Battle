import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import menuBg from "../assets/menu_bg.png";

export default function Home() {
  const [, setLocation] = useLocation();
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink((prev) => !prev);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center pixelated-render"
      style={{
        backgroundImage: `url(${menuBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/40 z-10" />
      <div className="scanlines" />
      
      <div className="z-20 flex flex-col items-center gap-12 mt-[-10vh]">
        <div className="text-center">
          <h1 className="font-display text-5xl md:text-7xl text-primary pixel-text-shadow tracking-widest uppercase mb-4 animate-pulse">
            KAIJU
          </h1>
          <h2 className="font-display text-3xl md:text-5xl text-accent pixel-text-shadow tracking-widest uppercase">
            DA BAHIA
          </h2>
        </div>

        <button 
          onClick={() => setLocation('/map')}
          className={`mt-16 font-sans text-3xl text-white pixel-text-shadow transition-opacity duration-200 hover:scale-110 active:scale-95 ${blink ? 'opacity-100' : 'opacity-40'}`}
        >
          [ TOQUE PARA INICIAR ]
        </button>
      </div>

      <div className="absolute bottom-4 z-20 font-sans text-sm text-white/50 text-center w-full">
        v1.0.0 &copy; REPLIT GAMES 2026
      </div>
    </div>
  );
}