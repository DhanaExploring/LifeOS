import { createContext, useContext } from "react";

// ── Theme Context ────────────────────────────────────────────────────────────
export const ThemeCtx = createContext();
export const useT = () => useContext(ThemeCtx);

// ── Global Fonts & Animations ────────────────────────────────────────────────
export function Fonts() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Mono:ital,wght@0,300;0,400;1,300&display=swap');
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      input[type=range] { -webkit-appearance:none; appearance:none; background:transparent; cursor:pointer; width:100%; }
      input[type=range]::-webkit-slider-runnable-track { height:4px; border-radius:2px; background:var(--track); }
      input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:var(--thumb,#7a9e7e); margin-top:-7px; box-shadow:0 1px 6px rgba(0,0,0,0.25); }
      select { appearance:none; }
      ::-webkit-scrollbar { width:3px; }
      ::-webkit-scrollbar-track { background:transparent; }
      ::-webkit-scrollbar-thumb { background:rgba(0,0,0,0.12); border-radius:2px; }
      @keyframes slideUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
      @keyframes popIn     { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
      @keyframes toastIn   { from{opacity:0;transform:translateX(-50%) translateY(-10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.4} }
      .su { animation: slideUp 0.32s cubic-bezier(0.16,1,0.3,1) both; }
      .su1 { animation-delay:0.04s }
      .su2 { animation-delay:0.08s }
      .su3 { animation-delay:0.12s }
      .pi { animation: popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }
    `}</style>
  );
}
