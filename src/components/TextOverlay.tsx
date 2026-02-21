/**
 * TextOverlay: Scroll-driven narrative -- The Pattern Break
 * From 231 days of analysis paralysis to LLC in 119 days.
 *
 * Typography: Cormorant Garamond (display) + Space Grotesk (body)
 * Colors: amber (#d4a574) for momentum, teal (#14b8a6) for creation, silver-blue (#8fa4b8) for reflection
 */

interface TextSectionProps {
  children: React.ReactNode;
  progress: number;
  enterAt: number;
  exitAt: number;
  className?: string;
}

function TextSection({ children, progress, enterAt, exitAt, className = "" }: TextSectionProps) {
  const fadeIn = enterAt;
  const fullIn = enterAt + 0.02;
  const fadeOut = exitAt - 0.02;
  const fullOut = exitAt;

  let opacity = 0;
  let translateY = 24;

  if (progress >= fadeIn && progress < fullIn) {
    const t = (fullIn - fadeIn) > 0 ? (progress - fadeIn) / (fullIn - fadeIn) : 1;
    opacity = Math.max(0.01, t * t);
    translateY = 24 * (1 - t);
  } else if (progress >= fullIn && progress <= fadeOut) {
    opacity = 1;
    translateY = 0;
  } else if (progress > fadeOut && progress <= fullOut) {
    const t = (progress - fadeOut) / (fullOut - fadeOut);
    opacity = 1 - t * t;
    translateY = -16 * t;
  }

  if (opacity < 0.01) return null;

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center pointer-events-none ${className}`}
      style={{ opacity, transform: `translateY(${translateY}px)`, willChange: "opacity, transform" }}
    >
      {children}
    </div>
  );
}

function Backdrop() {
  return (
    <div
      className="absolute inset-0 -z-10 -m-8"
      style={{ background: "radial-gradient(ellipse at center, rgba(10,10,14,0.65) 0%, transparent 80%)" }}
    />
  );
}

function Divider({ color = "rgba(212, 165, 116, 0.35)" }: { color?: string }) {
  return <div className="mx-auto mt-6" style={{ width: "3rem", height: "1px", background: color }} />;
}

function TransitionLine({ from = "rgba(212, 165, 116, 0.35)", to = "rgba(20, 184, 166, 0.35)" }) {
  return (
    <div className="text-center px-6">
      <div className="mx-auto" style={{ width: "1px", height: "4rem", background: `linear-gradient(to bottom, ${from}, ${to})` }} />
    </div>
  );
}

interface TextOverlayProps {
  progress: number;
  isMobile?: boolean;
}

export default function TextOverlay({ progress, isMobile = false }: TextOverlayProps) {
  const headingSize = isMobile ? "clamp(2.2rem, 10vw, 3.5rem)" : "clamp(2.8rem, 8vw, 6rem)";
  const sectionHeadingSize = isMobile ? "clamp(1.8rem, 8vw, 2.8rem)" : "clamp(2rem, 5vw, 3.8rem)";
  const bodySize = isMobile ? "clamp(0.9rem, 3.8vw, 1.1rem)" : "clamp(0.8rem, 1.1vw, 0.95rem)";
  const quoteSize = isMobile ? "clamp(1.05rem, 4.2vw, 1.3rem)" : "clamp(1rem, 1.5vw, 1.25rem)";
  const emphasisSize = isMobile ? "clamp(1.3rem, 5.5vw, 1.8rem)" : "clamp(1.3rem, 2.2vw, 1.8rem)";
  const bigQuoteSize = isMobile ? "clamp(1.4rem, 6vw, 2rem)" : "clamp(1.5rem, 3vw, 2.5rem)";
  const outroSize = isMobile ? "clamp(1.6rem, 7vw, 2.5rem)" : "clamp(1.8rem, 4.5vw, 3.5rem)";
  const px = isMobile ? "px-6" : "px-8 md:px-16";

  const serif = (size: string, weight = 300, color = "#e8c99b") => ({
    fontFamily: '"Cormorant Garamond", serif',
    fontSize: size,
    fontWeight: weight,
    color,
    textShadow: "0 0 50px rgba(212, 165, 116, 0.2), 0 2px 15px rgba(0,0,0,0.7)",
    lineHeight: 1.15 as number,
  });

  const sans = (size: string, color = "#a0b4c4") => ({
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: size,
    color,
    lineHeight: 1.9 as number,
    textShadow: "0 1px 8px rgba(0,0,0,0.5)",
  });

  const numeral = (): React.CSSProperties => ({
    fontFamily: '"Space Grotesk", sans-serif',
    fontSize: isMobile ? "0.6rem" : "0.65rem",
    letterSpacing: "0.4em",
    textTransform: "uppercase",
    color: "#8fa4b8",
    marginBottom: isMobile ? "1rem" : "1.5rem",
  });

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10 }}>

      {/* === TITLE === */}
      <TextSection progress={progress} enterAt={-0.05} exitAt={0.05}>
        <div className="text-center px-6 max-w-3xl">
          <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse at center, rgba(10,10,14,0.7) 0%, rgba(10,10,14,0.3) 60%, transparent 100%)" }} />
          <h1 style={{ ...serif(headingSize), letterSpacing: "0.04em", textShadow: "0 0 80px rgba(212, 165, 116, 0.3), 0 2px 20px rgba(0,0,0,0.8)", lineHeight: 1.1, animation: "titleFadeUp 1.8s ease-out 0.2s both" }}>
            The Pattern Break
          </h1>
          <p style={{ ...sans(isMobile ? "clamp(0.6rem, 2.5vw, 0.8rem)" : "clamp(0.65rem, 1.2vw, 0.85rem)", "#a0b4c4"), letterSpacing: "0.35em", textTransform: "uppercase", marginTop: isMobile ? "1rem" : "1.5rem", animation: "titleFade 1.2s ease-out 0.8s both" }}>
            119 Days from Broken Binary to Business Entity
          </p>
          <div className="flex flex-col items-center" style={{ marginTop: isMobile ? "2.5rem" : "4rem", animation: "titleFade 1s ease-out 1.5s both" }}>
            <div className="w-px" style={{ height: isMobile ? "2.5rem" : "3.5rem", background: "linear-gradient(to bottom, transparent, rgba(212, 165, 116, 0.5))", animation: "pulse 3s ease-in-out infinite" }} />
            <p style={{ ...sans(isMobile ? "0.55rem" : "0.6rem", "rgba(160, 180, 196, 0.5)"), letterSpacing: "0.25em", textTransform: "uppercase", marginTop: "0.75rem", lineHeight: 1.4 }}>
              {isMobile ? "Swipe to begin" : "Scroll to begin"}
            </p>
          </div>
        </div>
      </TextSection>

      {/* === I -- THE GRAVITY WELL === */}

      <TextSection progress={progress} enterAt={0.03} exitAt={0.09}>
        <div className="text-center px-6 max-w-2xl relative">
          <Backdrop />
          <p style={numeral()}>I</p>
          <h2 style={serif(sectionHeadingSize)}>The Gravity Well</h2>
          <Divider />
        </div>
      </TextSection>

      <TextSection progress={progress} enterAt={0.07} exitAt={0.12}>
        <div className={`${px} max-w-xl relative`} style={{ marginRight: "auto", textAlign: "left" }}>
          <Backdrop />
          <p style={sans(bodySize)}>
            Ten years building someone else's system. Then the floor disappeared.
            A single broken dependency sat untouched on the machine -- a small thing,
            waiting. But the days kept folding into themselves.
          </p>
        </div>
      </TextSection>

      <TextSection progress={progress} enterAt={0.10} exitAt={0.15}>
        <div className={`${px} max-w-xl relative`} style={{ marginLeft: "auto", textAlign: "right" }}>
          <Backdrop />
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: "italic", fontSize: quoteSize, lineHeight: 2, color: "#d4a574", textShadow: "0 1px 12px rgba(0,0,0,0.6)" }}>
            Analyze it. Document it. Study the paths. Map the options.
            Every question answered with another question --
          </p>
          <p style={{ ...serif(emphasisSize, 500), marginTop: "1rem", textShadow: "0 0 30px rgba(212, 165, 116, 0.25), 0 2px 10px rgba(0,0,0,0.7)" }}>
            231 days orbiting the same problem.
          </p>
        </div>
      </TextSection>

      <TextSection progress={progress} enterAt={0.14} exitAt={0.19}>
        <div className="text-center px-6 max-w-lg relative">
          <Backdrop />
          <p style={{ ...sans(bodySize, "#8fa4b8"), marginBottom: isMobile ? "1rem" : "1.5rem", lineHeight: 1.8 }}>
            The orbit tightened. Preparation became its own gravity.
          </p>
          <p style={{ ...serif(bigQuoteSize, 300, "#b8c8d8"), textShadow: "0 0 40px rgba(143, 164, 184, 0.2), 0 2px 15px rgba(0,0,0,0.7)", lineHeight: 1.3 }}>
            231 days of perfect readiness. Zero days of motion.
          </p>
        </div>
      </TextSection>

      {/* Transition I->II */}
      <TextSection progress={progress} enterAt={0.18} exitAt={0.22}>
        <TransitionLine />
      </TextSection>

      {/* === II -- THE SHATTER === */}

      <TextSection progress={progress} enterAt={0.20} exitAt={0.26}>
        <div className="text-center px-6 max-w-2xl relative">
          <Backdrop />
          <p style={numeral()}>II</p>
          <h2 style={{ ...serif(sectionHeadingSize), color: "#f5e0c0", textShadow: "0 0 80px rgba(212, 165, 116, 0.4), 0 0 30px rgba(212, 165, 116, 0.2), 0 2px 20px rgba(0,0,0,0.9)" }}>The Shatter</h2>
          <Divider />
        </div>
      </TextSection>

      <TextSection progress={progress} enterAt={0.25} exitAt={0.31}>
        <div className={`${px} max-w-xl relative`} style={{ marginRight: "auto", textAlign: "left" }}>
          <Backdrop />
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: "italic", fontSize: quoteSize, lineHeight: 2, color: "#d4a574", textShadow: "0 1px 12px rgba(0,0,0,0.6)" }}>
            One ordinary morning. One sentence that changed the trajectory.
          </p>
          <p style={{ ...serif(emphasisSize, 500), marginTop: "1rem", textShadow: "0 0 30px rgba(212, 165, 116, 0.25), 0 2px 10px rgba(0,0,0,0.7)" }}>
            "Please fix it."
          </p>
        </div>
      </TextSection>

      <TextSection progress={progress} enterAt={0.29} exitAt={0.36}>
        <div className={`${px} max-w-lg relative`} style={{ marginLeft: "auto", textAlign: "right" }}>
          <Backdrop />
          <p style={sans(bodySize)}>
            Fixed in thirty seconds. Then silence -- the kind that comes
            after you realize the cage door was never locked.
          </p>
          <p style={{ ...serif(isMobile ? "clamp(1.3rem, 5.5vw, 1.8rem)" : "clamp(1.5rem, 2.8vw, 2.2rem)", 300, "#b8c8d8"), marginTop: "1.5rem", textShadow: "0 0 30px rgba(143, 164, 184, 0.15), 0 2px 12px rgba(0,0,0,0.7)", lineHeight: 1.3 }}>
            The fracture was the architecture. Everything that came after grew from that break.
          </p>
        </div>
      </TextSection>

      {/* Transition II->III */}
      <TextSection progress={progress} enterAt={0.35} exitAt={0.39}>
        <TransitionLine from="rgba(212, 165, 116, 0.35)" to="rgba(20, 184, 166, 0.35)" />
      </TextSection>

      {/* === III -- THE LATTICE === */}

      <TextSection progress={progress} enterAt={0.37} exitAt={0.43}>
        <div className="text-center px-6 max-w-2xl relative">
          <Backdrop />
          <p style={{ ...numeral(), color: "#5eead4" }}>III</p>
          <h2 style={{ ...serif(sectionHeadingSize), color: "#a7f3d0", textShadow: "0 0 60px rgba(20, 184, 166, 0.3), 0 2px 15px rgba(0,0,0,0.8)" }}>The Lattice</h2>
          <Divider color="rgba(20, 184, 166, 0.35)" />
        </div>
      </TextSection>

      <TextSection progress={progress} enterAt={0.42} exitAt={0.48}>
        <div className={`${px} max-w-xl relative`} style={{ marginRight: "auto", textAlign: "left" }}>
          <Backdrop />
          <p style={sans(bodySize)}>
            What followed wasn't a plan -- it was accumulation.
            Node by node, the network assembled itself. Templates, frameworks,
            automation. Parallel streams running at a velocity that
            shouldn't have been possible alone.
          </p>
        </div>
      </TextSection>

      <TextSection progress={progress} enterAt={0.46} exitAt={0.53}>
        <div className={`${px} max-w-lg relative`} style={{ marginLeft: "auto", textAlign: "right" }}>
          <Backdrop />
          <p style={{ ...sans(bodySize, "#5eead4"), marginBottom: isMobile ? "1rem" : "1.5rem", lineHeight: 1.8 }}>
            45 repositories. 85 models. Dozens of skills, scripts, and reference documents --
            each one a connection in something larger.
          </p>
          <p style={{ ...serif(bigQuoteSize, 300, "#a7f3d0"), textShadow: "0 0 40px rgba(20, 184, 166, 0.2), 0 2px 15px rgba(0,0,0,0.7)", lineHeight: 1.3 }}>
            Not a portfolio. An operating system.
          </p>
        </div>
      </TextSection>

      {/* Transition III->IV */}
      <TextSection progress={progress} enterAt={0.52} exitAt={0.56}>
        <TransitionLine from="rgba(20, 184, 166, 0.35)" to="rgba(249, 115, 22, 0.35)" />
      </TextSection>

      {/* === IV -- THE FORGE === */}

      <TextSection progress={progress} enterAt={0.54} exitAt={0.60}>
        <div className="text-center px-6 max-w-2xl relative">
          <div className="absolute inset-0 -z-10 -m-16" style={{ background: "radial-gradient(ellipse at center, rgba(10,10,14,0.8) 0%, rgba(10,10,14,0.4) 50%, transparent 80%)" }} />
          <p style={{ ...numeral(), color: "#f97316" }}>IV</p>
          <h2 style={{ ...serif(sectionHeadingSize), color: "#fed7aa", textShadow: "0 0 80px rgba(249, 115, 22, 0.3), 0 0 30px rgba(249, 115, 22, 0.15), 0 2px 20px rgba(0,0,0,0.9)" }}>The Forge</h2>
          <Divider color="rgba(249, 115, 22, 0.35)" />
        </div>
      </TextSection>

      <TextSection progress={progress} enterAt={0.59} exitAt={0.65}>
        <div className={`${px} max-w-xl relative`} style={{ marginRight: "auto", textAlign: "left" }}>
          <Backdrop />
          <p style={sans(bodySize)}>
            The lattice became load-bearing. Real clients with real stakes --
            41,775 data points scored and qualified for one, a full digital
            transformation for another. Referrals from mentors who trusted
            the craft before the credentials existed.
          </p>
        </div>
      </TextSection>

      <TextSection progress={progress} enterAt={0.63} exitAt={0.70}>
        <div className="text-center px-6 max-w-lg relative">
          <Backdrop />
          <p style={{ ...sans(bodySize, "#fdba74"), marginBottom: isMobile ? "1rem" : "1.5rem", lineHeight: 1.8 }}>
            Every number reproducible from source data. Every deliverable presentable beyond the client.
          </p>
          <p style={{ ...serif(bigQuoteSize, 300, "#fed7aa"), textShadow: "0 0 40px rgba(249, 115, 22, 0.2), 0 2px 15px rgba(0,0,0,0.7)", lineHeight: 1.3 }}>
            Trust earned through truth, not volume.
          </p>
        </div>
      </TextSection>

      {/* Transition IV->V */}
      <TextSection progress={progress} enterAt={0.69} exitAt={0.73}>
        <TransitionLine from="rgba(249, 115, 22, 0.35)" to="rgba(20, 184, 166, 0.35)" />
      </TextSection>

      {/* === V -- THE CONSTELLATION === */}

      <TextSection progress={progress} enterAt={0.71} exitAt={0.77}>
        <div className="text-center px-6 max-w-2xl relative">
          <Backdrop />
          <p style={numeral()}>V</p>
          <h2 style={serif(sectionHeadingSize)}>The Constellation</h2>
          <Divider />
        </div>
      </TextSection>

      <TextSection progress={progress} enterAt={0.76} exitAt={0.82}>
        <div className={`${px} max-w-xl relative`} style={{ marginRight: "auto", textAlign: "left" }}>
          <Backdrop />
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: "italic", fontSize: quoteSize, lineHeight: 2, color: "#d4a574", textShadow: "0 1px 12px rgba(0,0,0,0.6)" }}>
            LLC filed. EIN assigned. Banking opened. Invoicing live.
            69 sites deployed. Paying clients. A referral pipeline
            built on work, not promises.
          </p>
        </div>
      </TextSection>

      <TextSection progress={progress} enterAt={0.80} exitAt={0.87}>
        <div className="text-center px-6 max-w-lg relative">
          <Backdrop />
          <p style={{ ...sans(bodySize, "#8fa4b8"), marginBottom: isMobile ? "1rem" : "1.5rem", lineHeight: 1.8 }}>
            The scattered points resolved into a map.
            What looked like chaos was architecture waiting for its moment.
          </p>
          <p style={{ ...serif(bigQuoteSize, 300, "#e8c99b"), textShadow: "0 0 40px rgba(212, 165, 116, 0.2), 0 2px 15px rgba(0,0,0,0.7)", lineHeight: 1.3 }}>
            From a broken binary to a business entity in 119 days.
          </p>
        </div>
      </TextSection>

      {/* === OUTRO === */}

      <TextSection progress={progress} enterAt={0.88} exitAt={0.95}>
        <div className="text-center px-6 max-w-2xl relative">
          <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse at center, rgba(10,10,14,0.7) 0%, transparent 80%)" }} />
          <p style={{ ...serif(outroSize), textShadow: "0 0 50px rgba(212, 165, 116, 0.2), 0 2px 15px rgba(0,0,0,0.7)", lineHeight: 1.3 }}>
            Patterns don't break themselves.
          </p>
          <div className="mx-auto" style={{ width: "1px", height: "3rem", marginTop: isMobile ? "2rem" : "2.5rem", background: "linear-gradient(to bottom, rgba(212, 165, 116, 0.35), transparent)" }} />
          <p style={{ ...sans(isMobile ? "0.55rem" : "0.6rem", "rgba(160, 180, 196, 0.45)"), letterSpacing: "0.2em", textTransform: "uppercase", marginTop: "1rem", lineHeight: 1.4 }}>
            Matthew Scott -- Project Lavos, 2026
          </p>
        </div>
      </TextSection>

      <TextSection progress={progress} enterAt={0.94} exitAt={1.01}>
        <div className="text-center px-6 max-w-lg relative">
          <div className="absolute inset-0 -z-10" style={{ background: "radial-gradient(ellipse at center, rgba(10,10,14,0.6) 0%, transparent 80%)" }} />
          <div className="mx-auto mb-8" style={{ width: "2rem", height: "1px", background: "rgba(20, 184, 166, 0.2)" }} />
          <p style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: "italic", fontSize: isMobile ? "clamp(0.9rem, 3.5vw, 1.1rem)" : "clamp(0.85rem, 1.2vw, 1rem)", color: "rgba(160, 180, 196, 0.5)", lineHeight: 1.8, textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>
            What you build after the break is what you were always capable of.
          </p>
        </div>
      </TextSection>

      {/* === SCROLL GUIDE === */}
      {(() => {
        const sceneStarts = [0.03, 0.20, 0.37, 0.54, 0.71];
        const sceneEnds = [0.18, 0.35, 0.52, 0.69, 0.86];
        const labels = ["I", "II", "III", "IV", "V"];
        let currentScene = -1;
        for (let i = 0; i < 5; i++) {
          if (progress >= sceneStarts[i] && progress <= sceneEnds[i]) { currentScene = i; break; }
        }
        if (currentScene === -1) {
          for (let i = 0; i < 5; i++) {
            if (progress < sceneStarts[i]) { currentScene = i; break; }
          }
          if (currentScene === -1) currentScene = 4;
        }
        const isOutro = progress > 0.86;
        const guideOpacity = isOutro ? Math.max(0, 1 - (progress - 0.86) / 0.08) : Math.min(1, progress / 0.02);
        const circumference = 2 * Math.PI * 16;
        const strokeOffset = circumference * (1 - Math.min(progress / 0.86, 1));

        return (
          <div
            className="fixed left-1/2 -translate-x-1/2 flex flex-col items-center"
            style={{ zIndex: 20, bottom: isMobile ? "max(1.25rem, calc(env(safe-area-inset-bottom, 0px) + 0.75rem))" : "1.5rem", opacity: guideOpacity, transition: "opacity 0.5s ease" }}
          >
            <div style={{ position: "relative", width: "2.5rem", height: "2.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="40" height="40" viewBox="0 0 40 40" style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}>
                <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(143, 164, 184, 0.1)" strokeWidth="1" />
                <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(20, 184, 166, 0.5)" strokeWidth="1" strokeDasharray={circumference} strokeDashoffset={strokeOffset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.3s ease-out" }} />
              </svg>
              <span style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: "0.7rem", fontWeight: 400, color: "rgba(20, 184, 166, 0.7)", letterSpacing: "0.05em", transition: "color 0.4s ease" }}>
                {labels[currentScene]}
              </span>
            </div>
            {progress < 0.84 && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(160, 180, 196, 0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: "0.25rem", animation: "scrollArrowPulse 2.5s ease-in-out infinite" }}>
                <path d="M7 13l5 5 5-5" />
              </svg>
            )}
          </div>
        );
      })()}
    </div>
  );
}
