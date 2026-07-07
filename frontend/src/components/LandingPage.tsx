import { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface Props { onStartAssessment: () => void; }

// ── Cinematic Grid Background ────────────────────────────────────────────────
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[#060e1e]" />
      
      {/* Animated Subtle Grid */}
      <motion.div 
        animate={{ y: [0, -40] }} 
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 w-full h-[200%]"
      >
        <svg className="w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="bg-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#22d3ee" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bg-grid)"/>
        </svg>
      </motion.div>

      {/* Dynamic Atmospheric Glows */}
      <motion.div 
        animate={{ opacity: [0.12, 0.18, 0.12], scale: [1, 1.05, 1] }} 
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} 
        className="absolute -top-[20%] -left-[10%] w-[800px] h-[800px] rounded-full" 
        style={{background:'radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(6,182,212,0) 70%)', filter:'blur(80px)'}} 
      />
      <motion.div 
        animate={{ opacity: [0.08, 0.12, 0.08], scale: [1, 1.1, 1] }} 
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }} 
        className="absolute top-[20%] -right-[10%] w-[600px] h-[600px] rounded-full" 
        style={{background:'radial-gradient(circle, rgba(14,165,233,0.12) 0%, rgba(14,165,233,0) 70%)', filter:'blur(100px)'}} 
      />
      
      {/* Vignette & Fade Out */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#060e1e_100%)] opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#060e1e]/40 to-[#060e1e]" />
    </div>
  );
}

// ── Rooftop Visualization Card ────────────────────────────────────────────────
function RooftopCard() {
  const polys = [
    "60,30 140,30 160,80 120,100 40,80",
    "180,45 240,45 250,85 175,85",
    "30,110 90,110 100,150 20,150",
    "110,110 200,110 210,160 100,160",
    "220,110 270,110 275,145 215,145",
  ];
  const [active, setActive] = useState(0);
  
  useEffect(() => { 
    const t = setInterval(() => setActive(a => (a+1)%polys.length), 2000); 
    return () => clearInterval(t); 
  }, [polys.length]);

  return (
    <motion.div initial={{opacity:0,y:40}} animate={{opacity:1,y:0}} transition={{delay:0.4,duration:0.8, type:"spring", bounce:0.4}}
      className="relative rounded-3xl overflow-hidden border border-cyan-500/20 shadow-[0_0_80px_rgba(6,182,212,0.1)]"
      style={{background:'linear-gradient(135deg, rgba(10,22,40,0.8) 0%, rgba(15,32,68,0.8) 100%)', backdropFilter:'blur(20px)'}}>
      
      {/* Top Bar */}
      <div className="p-4 border-b border-cyan-500/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </div>
          <span className="text-cyan-400/80 text-xs font-mono tracking-widest font-semibold">ROOFTOP INTELLIGENCE</span>
        </div>
        <div className="text-slate-500 text-[10px] font-mono tracking-wider">LIVE FEED</div>
      </div>
      
      {/* Visualization Area */}
      <div className="relative p-6">
        <svg viewBox="0 0 300 200" className="w-full h-auto drop-shadow-lg" style={{maxHeight: 220}}>
          {/* Subtle Grid */}
          {Array.from({length:8}).map((_,i)=>(
            <line key={`h${i}`} x1="0" y1={i*28} x2="300" y2={i*28} stroke="#1e3a5f" strokeWidth="0.5" strokeDasharray="2,4" opacity="0.5"/>
          ))}
          {Array.from({length:11}).map((_,i)=>(
            <line key={`v${i}`} x1={i*30} y1="0" x2={i*30} y2="200" stroke="#1e3a5f" strokeWidth="0.5" strokeDasharray="2,4" opacity="0.5"/>
          ))}
          
          {/* Base Footprints */}
          {polys.map((pts, i) => (
            <polygon key={`base-${i}`} points={pts} fill="rgba(14,116,144,0.05)" stroke="#164e63" strokeWidth="0.8" />
          ))}

          {/* Active Footprint Highlight */}
          <motion.polygon 
            points={polys[active]}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1, fill: 'rgba(6,182,212,0.25)', stroke: '#22d3ee', strokeWidth: 1.5 }}
            transition={{ duration: 0.5, type:"spring" }}
            className="drop-shadow-[0_0_12px_rgba(34,211,238,0.4)]"
          />

          {/* Holographic Scan Line */}
          <motion.g animate={{y:[0,200,0]}} transition={{duration:6,repeat:Infinity,ease:"linear"}}>
            <line x1="0" x2="300" y1="0" y2="0" stroke="url(#scan-grad)" strokeWidth="2" opacity="0.8"/>
            <rect x="0" y="-40" width="300" height="40" fill="url(#scan-fade)" opacity="0.3"/>
          </motion.g>

          <defs>
            <linearGradient id="scan-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
            <linearGradient id="scan-fade" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating Overlay Cards */}
      <motion.div animate={{y:[0,-6,0]}} transition={{duration:4,repeat:Infinity,ease:"easeInOut"}}
        className="absolute top-20 right-6 rounded-xl p-3.5 border border-cyan-500/30 bg-[#061224]/80 backdrop-blur-md shadow-xl">
        <div className="text-cyan-400 text-[10px] font-mono tracking-widest mb-1">ROOF AREA</div>
        <div className="text-white font-semibold text-lg tracking-tight">247 <span className="text-sm text-slate-400">m²</span></div>
        <div className="text-cyan-500/70 text-[9px] uppercase tracking-wider mt-1 border-t border-cyan-500/20 pt-1">Satellite Verified</div>
      </motion.div>
      
      <motion.div animate={{y:[0,6,0]}} transition={{duration:5,repeat:Infinity,ease:"easeInOut", delay:0.5}}
        className="absolute bottom-16 left-6 rounded-xl p-3.5 border border-emerald-500/30 bg-[#061224]/80 backdrop-blur-md shadow-xl">
        <div className="text-emerald-400 text-[10px] font-mono tracking-widest mb-1">HARVEST POTENTIAL</div>
        <div className="text-white font-semibold text-lg tracking-tight">89,640 <span className="text-sm text-slate-400">L/yr</span></div>
        <div className="text-emerald-500/70 text-[9px] uppercase tracking-wider mt-1 border-t border-emerald-500/20 pt-1">@ 1200mm Rainfall</div>
      </motion.div>
    </motion.div>
  );
}

// ── Cinematic Rain Particles ──────────────────────────────────────────────────
function RainParticles() {
  const drops = Array.from({length:30}).map(()=>({
    x: Math.random()*100, delay: Math.random()*4, dur: 1.2+Math.random()*2
  }));
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
      {drops.map((d,i)=>(
        <motion.div key={i} className="absolute w-[1px] rounded-full"
          style={{
            left:`${d.x}%`, 
            height: Math.random() > 0.5 ? '16px' : '24px', 
            top:'-24px',
            background: 'linear-gradient(to bottom, transparent, rgba(34,211,238,0.8))'
          }}
          animate={{y:['0vh','100vh'], opacity:[0,1,0]}}
          transition={{duration:d.dur, delay:d.delay, repeat:Infinity, ease:'linear'}}/>
      ))}
    </div>
  );
}

// ── Step Component (How it Works) ──────────────────────────────────────────────
function Step({n,title,desc,delay, isLast=false}:{n:string;title:string;desc:string;delay:number;isLast?:boolean}) {
  return (
    <motion.div initial={{opacity:0,x:-20}} whileInView={{opacity:1,x:0}} viewport={{once:true, margin: "-100px"}} transition={{delay,duration:0.6}}
      className="relative flex gap-6 group">
      
      {/* Timeline Line */}
      {!isLast && (
        <div className="absolute left-6 top-14 bottom-[-24px] w-px bg-gradient-to-b from-cyan-500/30 to-transparent group-hover:from-cyan-400/50 transition-colors duration-500" />
      )}
      
      <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm border border-cyan-500/20 bg-[#061224] text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)] group-hover:border-cyan-400/50 group-hover:text-cyan-300 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all duration-300">
        {n}
      </div>
      <div className="pt-1 pb-10">
        <div className="text-white font-semibold text-lg tracking-tight mb-2 group-hover:text-cyan-100 transition-colors">{title}</div>
        <div className="text-slate-400 text-sm leading-relaxed max-w-md">{desc}</div>
      </div>
    </motion.div>
  );
}

// ── Premium Impact Stat Card ──────────────────────────────────────────────────
function ImpactStat({label,value,unit,delay}:{label:string;value:string;unit:string;delay:number}) {
  return (
    <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay,duration:0.6}}
      className="relative group rounded-3xl p-8 border border-slate-700/40 bg-[#0a1426]/80 backdrop-blur-xl overflow-hidden hover:border-cyan-500/40 transition-all duration-500">
      
      {/* Hover Illumination */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10">
        <div className="text-4xl font-bold tracking-tighter text-white mb-2 group-hover:scale-105 origin-left transition-transform duration-500">
          {value}<span className="text-cyan-400/80 text-xl font-medium tracking-normal ml-1.5">{unit}</span>
        </div>
        <div className="text-slate-400 text-sm font-medium tracking-wide">{label}</div>
      </div>
    </motion.div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────
export function LandingPage({ onStartAssessment }: Props) {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0,500], [0,120]);
  const heroOpacity = useTransform(scrollY, [0,400], [1,0]);

  return (
    <div className="min-h-screen bg-[#060e1e] text-white font-sans selection:bg-cyan-500/30" style={{fontFamily: "'Inter', system-ui, sans-serif"}}>
      
      {/* ── IMMERSIVE NAV ── */}
      <motion.nav initial={{y:-20, opacity:0}} animate={{y:0, opacity:1}} transition={{duration:0.6}}
        className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 lg:px-12 py-5 border-b border-white/5 bg-[#060e1e]/70 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-cyan-400 to-sky-600 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M12 2C6 2 2 8 2 14s4 8 10 8 10-2 10-8S18 2 12 2zm0 14c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/></svg>
          </div>
          <span className="font-bold tracking-tight text-lg text-white">NEER</span>
        </div>
        <div className="hidden md:flex items-center gap-10 text-sm font-medium text-slate-400 tracking-wide">
          <a href="#how" className="hover:text-cyan-300 transition-colors">Platform</a>
          <a href="#impact" className="hover:text-cyan-300 transition-colors">Impact</a>
        </div>
        <button onClick={onStartAssessment}
          className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:-translate-y-0.5 bg-gradient-to-r from-cyan-500 to-sky-500">
          Start Assessment
        </button>
      </motion.nav>

      {/* ── HERO SECTION ── */}
      <section className="relative min-h-[100svh] flex items-center pt-24 overflow-hidden">
        <GridBackground/>
        <RainParticles/>
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-12 gap-12 lg:gap-8 items-center py-12 lg:py-0">
          
          {/* Left Text Content */}
          <motion.div style={{opacity: heroOpacity}} className="lg:col-span-6 flex flex-col items-start">
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1, duration:0.7}}
              className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 mb-8 text-[11px] font-mono tracking-widest font-semibold border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"/>
              AI-POWERED GEOSPATIAL INTELLIGENCE
            </motion.div>

            <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2, duration:0.7}}
              className="font-bold leading-[1.05] mb-6 tracking-tighter"
              style={{fontSize:'clamp(3rem, 6vw, 5rem)'}}>
              <span className="bg-gradient-to-br from-white via-white to-slate-400 bg-clip-text text-transparent">
                Rooftop Intelligence
              </span>
              <br/>
              <span className="bg-gradient-to-br from-cyan-400 to-sky-600 bg-clip-text text-transparent">
                for Water Resilience.
              </span>
            </motion.h1>

            <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3, duration:0.7}}
              className="text-slate-400 text-lg sm:text-xl leading-relaxed mb-10 max-w-xl font-medium tracking-tight">
              NEER uses high-resolution satellite imagery and hydrogeological modeling to design the optimal rainwater harvesting system for any property in Delhi — instantly.
            </motion.p>

            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.4, duration:0.7}}
              className="flex flex-col sm:flex-row flex-wrap gap-4 w-full sm:w-auto">
              <button onClick={onStartAssessment}
                className="px-8 py-4 rounded-full font-semibold text-white text-base shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-300 hover:shadow-[0_0_60px_rgba(6,182,212,0.5)] hover:-translate-y-1 bg-gradient-to-r from-cyan-500 to-sky-600">
                Analyse My Property →
              </button>
              <a href="#how"
                className="px-8 py-4 rounded-full font-medium text-slate-300 text-base border border-slate-700/80 hover:border-slate-400 hover:bg-slate-800/50 transition-all duration-300 flex items-center justify-center">
                Explore the Platform
              </a>
            </motion.div>

            {/* Standards Strip */}
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.8, duration:1}}
              className="flex flex-wrap gap-6 mt-14 text-xs font-medium text-slate-500 tracking-wide">
              {['CGWB Guidelines','IS:15797 Standard','Delhi IMD Data'].map(t=>(
                <span key={t} className="flex items-center gap-2">
                  <svg viewBox="0 0 12 12" className="w-3.5 h-3.5 text-cyan-500/70 fill-current"><circle cx="6" cy="6" r="5"/></svg>
                  {t}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Visualization */}
          <motion.div style={{y:heroY}} className="lg:col-span-6 relative lg:pl-10 mt-10 lg:mt-0">
            <RooftopCard/>
            
            {/* Cinematic Floating Card */}
            <motion.div animate={{y:[0,-8,0]}} transition={{duration:5,repeat:Infinity,ease:'easeInOut', delay:1}}
              className="absolute -bottom-8 lg:-left-4 z-20 rounded-2xl p-5 border border-slate-600/40 bg-[#0a1426]/95 backdrop-blur-xl shadow-2xl">
              <div className="text-[10px] text-slate-400 font-mono tracking-widest mb-1.5">HYDROGEOLOGY LAYER</div>
              <div className="text-white font-semibold text-base tracking-tight">South Delhi Aquifer</div>
              <div className="text-slate-400 text-sm mb-3">12m Depth · Sandy Loam</div>
              <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                <span className="text-emerald-400 text-xs font-semibold tracking-wide">Recharge Optimal</span>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* ── HOW IT WORKS (PLATFORM) ── */}
      <section id="how" className="relative py-32 border-t border-slate-800/50 bg-[#0a1222] overflow-hidden">
        {/* Subtle Background Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(14,165,233,0.05),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true, margin:"-100px"}} transition={{duration:0.7}}
            className="text-center mb-20">
            <div className="inline-block border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-xs font-mono tracking-widest font-semibold px-4 py-1.5 rounded-full mb-6">
              SYSTEM WORKFLOW
            </div>
            <h2 className="font-bold text-white mb-6 tracking-tighter" style={{fontSize:'clamp(2.5rem,4vw,3.5rem)'}}>
              From coordinates to <br className="hidden sm:block"/>engineered solutions.
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium tracking-tight">
              A precise, end-to-end intelligence pipeline automating spatial analysis, hydrology, and structural engineering.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-center">
            
            {/* Timeline Steps */}
            <div className="lg:col-span-5 relative">
              <Step n="01" title="Geospatial Resolution" desc="Drop a pin in Delhi. NEER instantly resolves your location, fetches 30-year IMD rainfall data, and identifies your specific groundwater zone." delay={0}/>
              <Step n="02" title="Computer Vision Extraction" desc="AI-assisted rooftop polygon extraction from high-resolution satellite imagery. Modify boundaries freely on an interactive geospatial canvas." delay={0.1}/>
              <Step n="03" title="Hydrogeological Mapping" desc="Cross-references your coordinates against Delhi's aquifer depth, soil infiltration rates, and recharge feasibility matrices." delay={0.2}/>
              <Step n="04" title="Structural Sizing Engine" desc="Calculates IS:15797-compliant percolation pits, storage tanks, and first-flush diverter specifications based on catchment yield." delay={0.3}/>
              <Step n="05" title="Consultancy-Grade Reporting" desc="Generates a professional engineering PDF with overlaid diagrams, ROI analysis, compliance checks, and DJB subsidy eligibility." delay={0.4} isLast/>
            </div>

            {/* Visual Data Flow Element */}
            <motion.div initial={{opacity:0,scale:0.95}} whileInView={{opacity:1,scale:1}} viewport={{once:true}} transition={{duration:0.8}}
              className="lg:col-span-7 relative">
              
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-[2rem] blur-2xl" />
              
              <div className="relative rounded-[2rem] p-8 sm:p-10 border border-slate-700/50 bg-[#060e1e]/80 backdrop-blur-2xl shadow-2xl">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                    <span className="text-white font-semibold tracking-wide">Analysis Pipeline Active</span>
                  </div>
                  <span className="text-slate-500 font-mono text-xs">SYS_REQ_0994</span>
                </div>

                <div className="space-y-4">
                  {[
                    {icon:'📍', label:'Spatial Context',  val:'28.62°N, 77.20°E',    color:'#22d3ee'},
                    {icon:'🛰️', label:'Catchment Area',   val:'247.50 m²',           color:'#38bdf8'},
                    {icon:'💧', label:'Meteorology',      val:'1,148 mm/yr',         color:'#818cf8'},
                    {icon:'🌱', label:'Harvest Yield',    val:'89.6 kL/yr',          color:'#34d399'},
                    {icon:'⚙️', label:'System Output',    val:'Hybrid 65/35 Split',  color:'#fbbf24'},
                  ].map((row,i)=>(
                    <motion.div key={i} initial={{opacity:0,x:20}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:0.3 + (i*0.1)}}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-800/50 bg-slate-900/30 hover:bg-slate-800/50 hover:border-slate-700 transition-colors">
                      <div className="flex items-center gap-4 mb-2 sm:mb-0">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-lg shadow-inner border border-slate-700/50">
                          {row.icon}
                        </div>
                        <span className="text-slate-300 font-medium tracking-wide">{row.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="hidden sm:block w-16 h-px bg-slate-800 group-hover:bg-slate-700 transition-colors" />
                        <span className="font-mono text-sm font-semibold tracking-tight px-3 py-1 rounded-md bg-slate-900 border border-slate-800" style={{color:row.color}}>
                          {row.val}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── IMPACT METRICS ── */}
      <section id="impact" className="py-32 relative overflow-hidden">
        {/* Deep ambient glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.05),transparent_70%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <motion.div initial={{opacity:0,y:30}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:0.7}}
            className="text-center mb-20">
            <div className="inline-block border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-mono tracking-widest font-semibold px-4 py-1.5 rounded-full mb-6">
              ENGINEERING CONSTANTS
            </div>
            <h2 className="font-bold text-white tracking-tighter" style={{fontSize:'clamp(2.5rem,4vw,3.5rem)'}}>
              Rigorous data.<br/>Real-world impact.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ImpactStat value="2.5" unit="mm" label="IS:15797 First-Flush standard" delay={0}/>
            <ImpactStat value="0.87" unit="Cf" label="RCC roof runoff coefficient" delay={0.1}/>
            <ImpactStat value="150" unit="L" label="Daily consumption per resident" delay={0.2}/>
            <ImpactStat value="18" unit="₹" label="Delhi baseline water tariff (kL)" delay={0.3}/>
          </div>
        </div>
      </section>

      {/* ── IMMERSIVE CTA FOOTER ── */}
      <footer className="relative border-t border-slate-800/80 bg-[#040914] overflow-hidden pt-32 pb-12">
        {/* Immersive Footer Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.08)_0%,transparent_50%)]" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="footer-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#22d3ee" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#footer-grid)"/>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          
          {/* Main CTA Area */}
          <div className="text-center max-w-3xl mx-auto mb-32">
            <motion.div initial={{opacity:0,scale:0.9}} whileInView={{opacity:1,scale:1}} viewport={{once:true}} transition={{duration:0.8}}>
              <h2 className="font-bold text-white mb-6 tracking-tighter" style={{fontSize:'clamp(3rem,5vw,4.5rem)'}}>
                Build resilience.<br/>
                <span className="text-slate-500">Start harvesting.</span>
              </h2>
              <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto font-medium">
                Generate a comprehensive rainwater harvesting engineering report for your property today.
              </p>
              <button onClick={onStartAssessment}
                className="px-10 py-5 rounded-full font-semibold text-white text-lg transition-all duration-300 hover:shadow-[0_0_60px_rgba(6,182,212,0.4)] hover:-translate-y-1 bg-gradient-to-r from-cyan-500 to-sky-600">
                Run Free Assessment →
              </button>
            </motion.div>
          </div>

          {/* Footer Bottom Strip */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-gradient-to-br from-cyan-400 to-sky-600">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M12 2C6 2 2 8 2 14s4 8 10 8 10-2 10-8S18 2 12 2zm0 14c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/></svg>
              </div>
              <div>
                <div className="text-white font-bold tracking-tight">NEER</div>
                <div className="text-slate-500 text-xs font-medium tracking-wide">Water Intelligence Platform</div>
              </div>
            </div>
            
            <div className="flex gap-8 text-sm font-medium text-slate-500">
              <a href="#" className="hover:text-cyan-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-cyan-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-cyan-400 transition-colors">Contact</a>
            </div>

            <div className="text-slate-600 text-xs font-mono tracking-wider">
              DATA: CGWB · IMD · IS:15797
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}