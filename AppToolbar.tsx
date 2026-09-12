// Adapts the ToolbarTopIPad import for Green500.
// Preserves the glass-pill shadow system from the import; replaces PUA SF Symbols
// with inline SVGs that render cross-browser, and wires sector tabs interactively.

import type { Sector } from "../data";

type Tab = "All" | Sector;
const TABS: Tab[] = ["All", "Finance", "Tech", "Industrial", "Energy", "Healthcare", "Consumer"];

interface Props {
  activeTab: Tab;
  onTabChange: (t: Tab) => void;
  count: number;
  horizon: "short" | "long";
  onHorizonChange: (h: "short" | "long") => void;
}

// Identical to FillShadow / GlassEffect from the import
function GlassPill() {
  return (
    <>
      <div className="absolute inset-0 rounded-[1000px] shadow-[1.25px_0px_0px_-0.75px_#d0d0d0,-1.25px_0px_0px_-0.75px_#d0d0d0,0px_0px_0px_0.5px_#e8e8e8,0px_8px_15px_0px_rgba(0,0,0,0.02)]">
        <div aria-hidden className="absolute inset-0 pointer-events-none rounded-[1000px]">
          <div className="absolute inset-0 rounded-[1000px]" style={{ backgroundImage: "linear-gradient(90deg,rgba(255,255,255,0.25) 0%,rgba(255,255,255,0.25) 100%),linear-gradient(90deg,rgba(0,0,0,0.25) 0%,rgba(0,0,0,0.25) 100%)" }} />
          <div className="absolute bg-[rgba(68,68,68,0.6)] inset-0 mix-blend-plus-lighter rounded-[1000px]" />
          <div className="absolute bg-[rgba(248,248,248,0.2)] inset-0 mix-blend-luminosity rounded-[1000px]" />
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-[1000px]">
        <div aria-hidden className="absolute bg-[rgba(0,0,0,0)] inset-0 rounded-[1000px]" />
        <div className="absolute inset-0 rounded-[inherit] shadow-[inset_0px_40px_10px_-40px_#282828,inset_0px_-40px_10px_-40px_#282828,inset_0px_40px_30px_-40px_#e6e6e6]" />
      </div>
    </>
  );
}

// Back chevron (replaces \u{100BF6} SF Symbol)
function ChevronLeft() {
  return (
    <svg width="10" height="17" viewBox="0 0 10 17" fill="none">
      <path d="M8.5 1.5L1.5 8.5L8.5 15.5" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// Sidebar grid icon (replaces \u{100C31} SF Symbol)
function SidebarIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
      <rect x="0.5" y="0.5" width="17" height="13" rx="2.5" stroke="#1a1a1a" strokeOpacity="0.55" strokeWidth="1.1"/>
      <line x1="6" y1="0.5" x2="6" y2="13.5" stroke="#1a1a1a" strokeOpacity="0.55" strokeWidth="1.1"/>
    </svg>
  );
}

// Magnifying glass (search)
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="5.25" stroke="#1a1a1a" strokeOpacity="0.55" strokeWidth="1.2"/>
      <line x1="11" y1="11" x2="14.5" y2="14.5" stroke="#1a1a1a" strokeOpacity="0.55" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

// Square icon for trailing buttons (replaces \u{1004D4} SF Symbol)
function SquareIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <rect x="0.75" y="0.75" width="15.5" height="15.5" rx="3.25" stroke="#1a1a1a" strokeWidth="1.2"/>
      <line x1="5" y1="0.75" x2="5" y2="16.25" stroke="#1a1a1a" strokeWidth="1.2"/>
    </svg>
  );
}

export default function AppToolbar({ activeTab, onTabChange, count, horizon, onHorizonChange }: Props) {
  return (
    <div className="relative w-full bg-[#f5f5f7]" data-name="Toolbar - Top - iPad">
      <div className="flex flex-col gap-[10px] items-start pb-[10px] px-[10px] relative w-full">

        {/* Controls row — matches the import's Controls layout */}
        <div className="flex items-start relative w-full pt-2" data-name="Controls">
          {/* Leading — back button glass pill */}
          <div className="flex flex-[1_0_0] gap-[12px] items-center min-w-px relative" data-name="Leading">
            <div className="h-[44px] min-w-[44px] relative rounded-[296px] shrink-0">
              <div className="flex items-center justify-center size-full">
                <div className="flex gap-[12px] items-center justify-center px-[2px] relative size-full">
                  <div className="absolute h-[44px] left-0 right-0 top-1/2 -translate-y-1/2">
                    <GlassPill />
                  </div>
                  <div className="flex items-center justify-center h-[36px] min-w-[36px] relative rounded-[100px] shrink-0 px-[8px]">
                    <ChevronLeft />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Center — Tab Bar glass pill, mirrors the import's Tab Bar */}
          <div className="flex items-center" data-name="Tab Bar">
            <div className="flex items-start p-[4px] relative">
              <GlassPill />
              {/* Sidebar icon */}
              <div className="relative shrink-0 flex items-center justify-center h-[36px] w-[44px]">
                <SidebarIcon />
              </div>
              {/* Sector tabs — mapped from import's Tab 1–5 pattern */}
              <div className="flex h-[36px] items-center justify-center relative shrink-0" data-name="Buttons">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => onTabChange(tab)}
                      className="relative shrink-0 flex items-center justify-center h-full px-[14px] rounded-[100px] transition-all"
                      style={{ cursor: "pointer", border: "none", background: "none" }}
                    >
                      {isActive && (
                        <div className="absolute inset-0 bg-[#ededed] rounded-[100px]" />
                      )}
                      <span
                        className="relative text-[13px] font-medium leading-[20px] whitespace-nowrap tracking-[-0.1px]"
                        style={{
                          color: isActive ? "#0071e3" : "#1a1a1a",
                          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
                        }}
                      >
                        {tab}
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* Search icon */}
              <div className="relative shrink-0 flex items-center justify-center h-[36px] w-[44px]">
                <SearchIcon />
              </div>
            </div>
          </div>

          {/* Trailing — horizon toggle as twin glass pills */}
          <div className="flex flex-[1_0_0] gap-[8px] items-center justify-end min-w-px relative" data-name="Trailing">
            <div className="h-[44px] relative rounded-[296px] shrink-0">
              <div className="flex items-center size-full">
                <div className="flex gap-[6px] items-center px-[4px] relative size-full">
                  <div className="absolute h-[44px] left-0 right-0 top-1/2 -translate-y-1/2">
                    <GlassPill />
                  </div>
                  {(["short", "long"] as const).map((h) => (
                    <button
                      key={h}
                      onClick={() => onHorizonChange(h)}
                      className="relative h-[36px] px-3 rounded-[100px] flex items-center transition-all"
                      style={{ border: "none", cursor: "pointer", background: horizon === h ? "#0071e3" : "transparent" }}
                    >
                      <span
                        className="text-[12px] font-medium whitespace-nowrap"
                        style={{
                          color: horizon === h ? "#ffffff" : "#1a1a1a",
                          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
                        }}
                      >
                        {h === "short" ? "Short" : "Long"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="h-[44px] relative rounded-[296px] shrink-0">
              <div className="flex items-center size-full">
                <div className="flex gap-[4px] items-center px-[4px] relative size-full">
                  <div className="absolute h-[44px] left-0 right-0 top-1/2 -translate-y-1/2">
                    <GlassPill />
                  </div>
                  <div className="relative h-[36px] w-[36px] flex items-center justify-center rounded-[100px]">
                    <SquareIcon />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Title and Subtitle — exact layout from import */}
        <div className="min-h-[48px] relative shrink-0 w-full" data-name="Title and Subtitle">
          <div className="flex flex-col gap-[2px] items-start min-h-[inherit] pt-[4px] px-[10px] relative">
            <div className="h-[41px] relative w-full" data-name="Title">
              <p
                className="absolute font-bold leading-[41px] left-0 right-0 text-[#1a1a1a] text-[34px] top-0 tracking-[0.4px] whitespace-nowrap"
                style={{ fontVariationSettings: '"wdth" 100', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}
              >
                Green500
              </p>
            </div>
            <div className="relative shrink-0" data-name="Subtitle">
              <p
                className="font-medium leading-[20px] text-[#727272] text-[15px] tracking-[-0.23px] whitespace-nowrap"
                style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif" }}
              >
                {count} companies · S&amp;P 500 Sustainability Index
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
