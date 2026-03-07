import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(168, 255, 62, ${p.opacity})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ mixBlendMode: "screen" }}
    />
  );
}

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-field-900 bg-grid overflow-hidden flex flex-col items-center justify-center">
      <ParticleField />

      {/* Radial glow behind content */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <motion.div
        className="relative z-10 w-full max-w-md mx-auto px-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            className="inline-flex items-center justify-center mb-6"
            animate={{ filter: ["drop-shadow(0 0 8px rgba(168,255,62,0.3))", "drop-shadow(0 0 20px rgba(168,255,62,0.6))", "drop-shadow(0 0 8px rgba(168,255,62,0.3))"] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <svg width="64" height="56" viewBox="0 0 32 28" fill="none">
              <path d="M4 20 C4 20, 2 16, 2 12 C2 7, 6 4, 10 4 C13 4, 15 6, 16 8 C17 6, 19 4, 22 4 C26 4, 30 7, 30 12 C30 16, 28 20, 28 20" stroke="hsl(88 100% 62%)" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <ellipse cx="16" cy="21" rx="10" ry="5" stroke="hsl(88 100% 62%)" strokeWidth="1.5" fill="none"/>
              <path d="M10 4 L8 0 M22 4 L24 0" stroke="hsl(88 100% 62%)" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M8 12 Q10 16 12 12 Q14 8 16 12 Q18 16 20 12" stroke="hsl(88 100% 62%)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
          </motion.div>

          <h1 className="font-display text-5xl font-bold text-primary mb-2 tracking-tight">HerdSense</h1>
          <p className="font-body text-muted-foreground text-sm tracking-widest uppercase mb-6">
            AI Livestock Health Intelligence
          </p>
          <p className="font-display text-xl text-foreground/80 leading-tight">
            Every animal.<br/>Every signal.<br/>Every second.
          </p>
        </div>

        {/* Login Card */}
        <div className="card-glass rounded-xl p-8">
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">Farm Name</label>
              <input
                type="text"
                defaultValue="Meadowbrook Farm"
                className="w-full bg-field-700 border border-border rounded-lg px-3 py-2.5 text-sm font-body text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                defaultValue="••••••••"
                className="w-full bg-field-700 border border-border rounded-lg px-3 py-2.5 text-sm font-body text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors"
              />
            </div>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-display font-bold text-sm tracking-wide hover:bg-lime-glow transition-all duration-200 shadow-glow-lime mb-3"
          >
            Sign In
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full py-3 rounded-lg border border-border text-muted-foreground font-body text-sm hover:border-primary/40 hover:text-foreground transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span className="text-xs font-mono text-warning">◉</span>
            Enter Demo Mode
          </button>
        </div>

        <p className="text-center text-xs font-mono text-muted-foreground mt-6 opacity-50">
          v1.0.0-beta · HerdSense Platform · 247 animals monitored
        </p>
      </motion.div>
    </div>
  );
}
