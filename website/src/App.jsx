import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame } from "@react-three/fiber";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { Player } from "@remotion/player";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import {
  ArrowRight,
  Bot,
  Box,
  Brain,
  ChevronDown,
  Circle,
  Download,
  GitBranch,
  Layers3,
  LockKeyhole,
  Moon,
  Search,
  Sparkles,
  Sun,
  Tags,
  WandSparkles,
} from "lucide-react";
import "./styles.css";

import libraryLight from "../../docs/screenshots/en-library-light.png";
import libraryDark from "../../docs/screenshots/en-library-dark.png";
import aiChat from "../../docs/screenshots/en-ai-chat-light.png";
import settings from "../../docs/screenshots/en-settings-light.png";

const githubUrl = "https://github.com/lyria13579/x-organizer-extension";
const downloadUrl = "https://github.com/lyria13579/x-organizer-extension/archive/refs/heads/main.zip";
const contactEmail = "teresa4ever0127@gmail.com";
const headline = "Turn saved X posts into an AI-powered idea library.";
const subtitle =
  "Organize bookmarks, extract insights, and turn scattered tweets into product ideas, content drafts, and research notes.";
const themeOptions = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "black", label: "Black", icon: Circle },
];

const reveal = {
  hidden: { opacity: 0.32, y: 34, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

function TypewriterText({ text }) {
  const shouldReduceMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(shouldReduceMotion ? text.length : 0);

  useEffect(() => {
    if (shouldReduceMotion) {
      setVisibleCount(text.length);
      return undefined;
    }

    setVisibleCount(0);
    let frame = 0;
    const interval = window.setInterval(() => {
      frame += 1;
      setVisibleCount((current) => {
        if (current >= text.length) {
          window.clearInterval(interval);
          return current;
        }
        return Math.min(text.length, current + (frame % 4 === 0 ? 2 : 1));
      });
    }, 24);

    return () => window.clearInterval(interval);
  }, [shouldReduceMotion, text]);

  return (
    <span className="typewriter" aria-label={text}>
      <span aria-hidden="true">{text.slice(0, visibleCount)}</span>
      <span className="typewriter-cursor" aria-hidden="true" />
    </span>
  );
}

function LogoMark({ className = "" }) {
  return (
    <span className={`brand-mark ${className}`} aria-hidden="true">
      <span className="brand-mark__card" />
      <span className="brand-mark__hole" />
      <span className="brand-mark__line line-one" />
      <span className="brand-mark__line line-two" />
    </span>
  );
}

function MagneticLink({ className, href, target, rel, children }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 240, damping: 18, mass: 0.35 });
  const springY = useSpring(y, { stiffness: 240, damping: 18, mass: 0.35 });

  function handlePointerMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left - rect.width / 2) * 0.18);
    y.set((event.clientY - rect.top - rect.height / 2) * 0.18);
  }

  function handlePointerLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.a
      className={className}
      href={href}
      target={target}
      rel={rel}
      style={{ x: springX, y: springY }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      whileTap={{ scale: 0.96 }}
    >
      {children}
    </motion.a>
  );
}

function TiltCard({ children, className = "", index = 0 }) {
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const sheenX = useMotionValue(50);
  const sheenY = useMotionValue(50);
  const background = useMotionTemplate`radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255,255,255,0.92), rgba(255,255,255,0.46) 34%, rgba(255,255,255,0.18) 62%), radial-gradient(circle at 30% 12%, rgba(111,99,255,0.2), transparent 58%)`;

  function handlePointerMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    rotateX.set((0.5 - y) * 10);
    rotateY.set((x - 0.5) * 12);
    sheenX.set(x * 100);
    sheenY.set(y * 100);
  }

  function handlePointerLeave() {
    rotateX.set(0);
    rotateY.set(0);
    sheenX.set(50);
    sheenY.set(50);
  }

  return (
    <motion.article
      className={`tilt-card ${className}`}
      style={{ rotateX, rotateY, background }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      initial="hidden"
      whileInView="visible"
      whileHover={{ y: -12, scale: 1.015 }}
      viewport={{ once: true, margin: "-80px" }}
      variants={reveal}
      transition={{ duration: 0.65, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.article>
  );
}

function FloatingFeatureBadges() {
  const steps = [
    { label: "Capture", meta: "visible posts", icon: <Download size={18} /> },
    { label: "Classify", meta: "AI categories", icon: <Tags size={18} /> },
    { label: "Search", meta: "intent query", icon: <Search size={18} /> },
    { label: "Ask AI", meta: "local library", icon: <Brain size={18} /> },
  ];
  return (
    <div className="floating-feature-cluster" aria-label="Floating feature badges">
      {steps.map((step, index) => (
        <motion.div
          className={`floating-feature-badge badge-${index + 1}`}
          key={step.label}
          initial={{ opacity: 0, y: 18, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          whileHover={{ y: -10, scale: 1.04, rotate: 0 }}
          transition={{ type: "spring", stiffness: 190, damping: 18, delay: 0.42 + index * 0.08 }}
        >
          <span className="badge-orb">{step.icon}</span>
          <div className="badge-copy">
            <strong>{step.label}</strong>
            <small>{step.meta}</small>
          </div>
          <i className="badge-line long" />
          <i className="badge-line short" />
        </motion.div>
      ))}
    </div>
  );
}

function IntroLoader() {
  const shouldReduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(!shouldReduceMotion);

  useEffect(() => {
    if (shouldReduceMotion) return undefined;
    const timer = window.setTimeout(() => setVisible(false), 1450);
    return () => window.clearTimeout(timer);
  }, [shouldReduceMotion]);

  if (!visible) return null;

  return (
    <motion.div
      className="intro-loader"
      initial={{ clipPath: "inset(0 0 0 0)" }}
      animate={{ clipPath: "inset(0 0 100% 0)" }}
      transition={{ delay: 1.05, duration: 0.65, ease: [0.76, 0, 0.24, 1] }}
      aria-hidden="true"
    >
      <div className="intro-flow" />
      <div className="intro-canvas">
        <Canvas camera={{ position: [0, 0, 5.6], fov: 44 }} dpr={[1, 1.5]}>
          <ambientLight intensity={0.9} />
          <pointLight position={[2, 2, 3]} color="#8a76ff" intensity={7} />
          <Suspense fallback={null}>
            <IntroParticles />
          </Suspense>
        </Canvas>
      </div>
      <div className="intro-grid">
        <span>LOCAL SIGNALS ARE WAKING UP</span>
        <strong>X Organizer</strong>
        <div className="intro-meter"><i /></div>
        <small>CAPTURE / CLASSIFY / EXTRACT / ASK AI</small>
      </div>
    </motion.div>
  );
}

function IntroParticles() {
  const ref = useRef(null);
  const particles = useMemo(() => {
    const count = 720;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 4.8;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3.1;
      positions[i * 3 + 2] = Math.sin(angle) * radius * 0.72;
    }
    return positions;
  }, []);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (!ref.current) return;
    ref.current.rotation.y = time * 0.13;
    ref.current.rotation.z = Math.sin(time * 0.28) * 0.08;
    ref.current.position.y = Math.sin(time * 0.5) * 0.12;
  });

  return (
    <group ref={ref}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#f6f2ff" size={0.032} transparent opacity={0.72} />
      </points>
      <mesh>
        <torusKnotGeometry args={[1.12, 0.008, 220, 18]} />
        <meshBasicMaterial color="#8c7aff" transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

function CursorSpotlight() {
  const x = useMotionValue(50);
  const y = useMotionValue(50);
  const background = useMotionTemplate`radial-gradient(circle at ${x}% ${y}%, rgba(111, 99, 255, 0.18), rgba(17, 183, 255, 0.08) 16rem, transparent 28rem)`;

  useEffect(() => {
    function handleMove(event) {
      x.set((event.clientX / window.innerWidth) * 100);
      y.set((event.clientY / window.innerHeight) * 100);
    }
    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, [x, y]);

  return <motion.div className="cursor-spotlight" style={{ background }} aria-hidden="true" />;
}

function EnergyCore() {
  const groupRef = useRef(null);
  const meshRef = useRef(null);
  const ringOne = useRef(null);
  const ringTwo = useRef(null);
  const particles = useMemo(() => {
    const positions = new Float32Array(420 * 3);
    for (let i = 0; i < 420; i += 1) {
      const radius = 1.2 + Math.random() * 4.4;
      const angle = Math.random() * Math.PI * 2;
      const height = (Math.random() - 0.5) * 3.5;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return positions;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.18;
      groupRef.current.rotation.x = Math.sin(t * 0.26) * 0.12;
    }
    if (meshRef.current) {
      meshRef.current.rotation.x = t * 0.32;
      meshRef.current.rotation.z = t * 0.18;
      meshRef.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.035);
    }
    if (ringOne.current) ringOne.current.rotation.z = -t * 0.28;
    if (ringTwo.current) ringTwo.current.rotation.z = t * 0.2;
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#836dff" size={0.022} transparent opacity={0.55} />
      </points>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.38, 4]} />
        <meshStandardMaterial
          color="#f7f5ff"
          emissive="#4a32ff"
          emissiveIntensity={0.38}
          metalness={0.82}
          roughness={0.18}
          wireframe
        />
      </mesh>
      <mesh ref={ringOne}>
        <torusGeometry args={[2.05, 0.012, 16, 180]} />
        <meshBasicMaterial color="#725dff" transparent opacity={0.88} />
      </mesh>
      <mesh ref={ringTwo} rotation={[Math.PI / 2.8, 0, 0]}>
        <torusGeometry args={[2.72, 0.01, 16, 180]} />
        <meshBasicMaterial color="#0fb7ff" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0.12, 0.02, 0]}>
        <sphereGeometry args={[0.42, 48, 48]} />
        <meshStandardMaterial color="#ffffff" emissive="#7a66ff" emissiveIntensity={0.95} metalness={0.3} roughness={0.1} />
      </mesh>
    </group>
  );
}

function HeroCanvas() {
  return (
    <div className="hero-canvas" aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 6.4], fov: 42 }} dpr={[1, 1.75]}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[4, 4, 6]} intensity={2.6} />
        <pointLight position={[-3, -2, 3]} color="#7f62ff" intensity={8} />
        <Suspense fallback={null}>
          <EnergyCore />
        </Suspense>
      </Canvas>
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    const requestedTheme = new URLSearchParams(window.location.search).get("theme");
    if (themeOptions.some((option) => option.id === requestedTheme)) return requestedTheme;
    return window.localStorage.getItem("x-organizer-site-theme") || "light";
  });
  const items = ["Ideas", "Features", "Workflow", "AI", "Design"];

  useEffect(() => {
    document.body.dataset.theme = theme;
    window.localStorage.setItem("x-organizer-site-theme", theme);
  }, [theme]);

  return (
    <motion.header className="site-header" initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7 }}>
      <a className="brand" href="#top" aria-label="X Organizer home">
        <LogoMark />
        <span>X Organizer</span>
      </a>
      <nav className={open ? "nav open" : "nav"} aria-label="Primary navigation">
        {items.map((item) => (
          <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setOpen(false)}>
            {item}
          </a>
        ))}
      </nav>
      <div className="header-actions">
        <div className="theme-switch" aria-label="Theme switcher">
          {themeOptions.map(({ id, label, icon: Icon }) => (
            <button
              className={theme === id ? "active" : ""}
              key={id}
              type="button"
              aria-label={`Use ${label} mode`}
              aria-pressed={theme === id}
              title={`${label} mode`}
              onClick={() => setTheme(id)}
            >
              <Icon size={15} />
            </button>
          ))}
        </div>
        <a className="ghost-button compact" href={githubUrl} target="_blank" rel="noreferrer">
          <GitBranch size={18} />
          GitHub
        </a>
        <button className="menu-button" type="button" aria-label="Toggle navigation" onClick={() => setOpen((value) => !value)}>
          <span />
          <span />
        </button>
      </div>
    </motion.header>
  );
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return <motion.div className="scroll-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />;
}

function ProductStack() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -110]);
  return (
    <motion.div className="product-stack" style={{ y }}>
      <motion.div className="screen main-screen" whileHover={{ rotateY: -2, rotateX: 0, scale: 1.025 }} transition={{ type: "spring", stiffness: 160, damping: 18 }}>
        <img src={libraryLight} alt="X Organizer card library interface" />
      </motion.div>
      <motion.div className="screen floating-screen floating-one" whileHover={{ scale: 1.07, rotate: -2, y: -12 }} transition={{ type: "spring", stiffness: 220, damping: 18 }}>
        <img src={aiChat} alt="Ask Library card result interface" />
      </motion.div>
      <motion.div className="screen floating-screen floating-two" whileHover={{ scale: 1.07, rotate: 2, y: -12 }} transition={{ type: "spring", stiffness: 220, damping: 18 }}>
        <img src={settings} alt="Bring your own API key settings" />
      </motion.div>
    </motion.div>
  );
}

const features = [
  {
    icon: <Layers3 />,
    title: "Card library",
    body: "Turn dense X feeds into clean cards with source, author, tags, metrics, and category controls.",
  },
  {
    icon: <Tags />,
    title: "AI categories",
    body: "Use your own model API to generate up to 10 meaningful categories for bookmarks, likes, and reposts.",
  },
  {
    icon: <Search />,
    title: "Search by intent",
    body: "Ask for design posts, coding references, launch ideas, or anything already saved in your local library.",
  },
  {
    icon: <LockKeyhole />,
    title: "Local first",
    body: "Post data and API settings stay in your browser. No official X API is required for the MVP workflow.",
  },
];

const workflow = [
  ["01", "Save tweets", "Keep using X normally. Bookmarks, likes, and reposts become the raw material."],
  ["02", "AI categorize", "Your own model groups posts into meaningful topics instead of generic folders."],
  ["03", "Extract insights", "Each card keeps the source, metrics, topic, and the reason it matters."],
  ["04", "Generate notes", "Turn a useful post into a research note, product angle, or content draft."],
  ["05", "Build your library", "Search the archive later by intent, not by remembering exact keywords."],
];

const inspirationScenes = [
  {
    title: "Creator briefs",
    body: "Turn saved launch threads into angles, hooks, and drafts for your next post.",
    image: "/inspiration/workstation.jpg",
    credit: "Charles Deluvio / Unsplash",
  },
  {
    title: "Product signals",
    body: "Cluster APIs, agents, MCPs, and Web3 payments before they vanish into the feed.",
    image: "/inspiration/desktop.jpg",
    credit: "Luca Bravo / Unsplash",
  },
  {
    title: "Research notes",
    body: "Extract what matters from a tweet and keep it as reusable thinking.",
    image: "/inspiration/notebook.jpg",
    credit: "Nick Morrison / Unsplash",
  },
];

const beforeAfter = {
  before: ["Hundreds of saved tweets", "No clear topic map", "Hard to retrieve later", "Good ideas stay buried"],
  after: ["AI Agent", "Web3 Payment", "MCP / API", "Product Ideas", "Writing Drafts", "Job Research", "Founder Insights"],
};

const insightCards = [
  {
    label: "Tweet Insight Card",
    title: "Why this post matters",
    body: "Summarize the useful argument, keep the original source, and attach a category you can browse later.",
    meta: "Design systems / High saves",
  },
  {
    label: "Product Idea Card",
    title: "Signal to opportunity",
    body: "Turn repeated posts about one workflow into a concrete product angle, target user, and next test.",
    meta: "AI workflow / Builder tool",
  },
  {
    label: "Content Draft Card",
    title: "Idea to public build",
    body: "Convert your saved X research into a short post draft without losing the source context.",
    meta: "Writing / Source faithful",
  },
];

const askPrompt = "Find design-related bookmarks or likes and list them as cards.";

function frameIn(frame, start, end, from = 0, to = 1) {
  return interpolate(frame, [start, end], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
}

function AnimatedResultCard({ frame, start, top, left, title, meta, tag, tone = "violet" }) {
  const opacity = frameIn(frame, start, start + 16);
  const y = frameIn(frame, start, start + 18, 34, 0);
  const scale = frameIn(frame, start, start + 18, 0.92, 1);

  return (
    <div
      className={`remotion-result-card ${tone}`}
      style={{
        top,
        left,
        opacity,
        transform: `translateY(${y}px) scale(${scale})`,
      }}
    >
      <span className="remotion-result-avatar">{title.slice(0, 1)}</span>
      <div>
        <strong>{title}</strong>
        <p>{meta}</p>
        <small>{tag}</small>
      </div>
    </div>
  );
}

function AskAiComposition({ screenshot }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const typedLength = Math.floor(frameIn(frame, 10, 2 * fps, 0, askPrompt.length));
  const promptText = askPrompt.slice(0, typedLength);
  const dialogScale = frameIn(frame, 8, 28, 0.92, 1);
  const dialogOpacity = frameIn(frame, 5, 24);
  const dimOpacity = frameIn(frame, 0, 18, 0.18, 0.72);
  const thinkingOpacity = frameIn(frame, 2.15 * fps, 2.6 * fps);
  const answerOpacity = frameIn(frame, 2.95 * fps, 3.35 * fps);
  const scanY = frameIn(frame % (fps * 2), 0, fps * 2, -90, 450);
  const highlightScale = frameIn(frame, 3 * fps, 4 * fps, 0.9, 1.04);

  return (
    <AbsoluteFill className="remotion-ask-scene">
      <Img className="remotion-ask-bg" src={screenshot} />
      <div className="remotion-ask-dim" style={{ opacity: dimOpacity }} />
      <div className="remotion-scan" style={{ transform: `translateY(${scanY}px)` }} />

      <div
        className="remotion-question-panel"
        style={{
          opacity: dialogOpacity,
          transform: `translate(-50%, -50%) scale(${dialogScale})`,
        }}
      >
        <div className="remotion-window-bar">
          <span>Ask Library</span>
          <i />
        </div>
        <p>Ask questions across your captured bookmarks, likes, and reposts.</p>
        <div className="remotion-input">
          <span>{promptText}</span>
          <b style={{ opacity: frame % 18 < 10 ? 1 : 0 }} />
        </div>
        <div className="remotion-submit">Ask AI</div>
      </div>

      <Sequence from={Math.round(2.25 * fps)} durationInFrames={Math.round(2.8 * fps)} premountFor={fps}>
        <div className="remotion-thinking" style={{ opacity: thinkingOpacity }}>
          <Bot size={18} />
          Searching local library
          <span />
          <span />
          <span />
        </div>
      </Sequence>

      <div
        className="remotion-answer-orbit"
        style={{
          opacity: answerOpacity,
          transform: `translate(-50%, -50%) scale(${highlightScale})`,
        }}
      >
        <span />
        <strong>3 matched cards</strong>
      </div>

      <AnimatedResultCard
        frame={frame}
        start={Math.round(3.15 * fps)}
        top={320}
        left={62}
        title="Design systems"
        meta="High-save bookmarks about predictable spacing and stable UI states."
        tag="Design systems / Save 1.9K"
      />
      <AnimatedResultCard
        frame={frame}
        start={Math.round(3.5 * fps)}
        top={374}
        left={362}
        title="AI workflows"
        meta="Posts about turning messy Twitter research into reusable notes."
        tag="AI workflows / Like 2.8K"
        tone="cyan"
      />
      <AnimatedResultCard
        frame={frame}
        start={Math.round(3.85 * fps)}
        top={292}
        left={642}
        title="Writing"
        meta="A prompt pattern for content repurposing and source-faithful rewrite."
        tag="Writing / Score 80"
        tone="silver"
      />
    </AbsoluteFill>
  );
}

function InspirationLibrary() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="inspiration-section" id="ideas" aria-label="X Organizer inspiration library">
      <motion.div
        className="cinema-board"
        style={{ backgroundImage: `url(${inspirationScenes[0].image})` }}
        initial={{ opacity: 0.72, y: 38, scale: 0.98 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.82, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="cinema-copy left"
          initial={{ opacity: 0, x: -26 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12, duration: 0.7 }}
        >
          <span>2026 / PERSONAL IDEA OS</span>
          <h2>Make X your thinking library.</h2>
          <p>
            Your bookmarks and likes are not dead saves. They are creative references, research signals,
            and product clues waiting to be connected.
          </p>
        </motion.div>
        <motion.div
          className="cinema-copy right"
          initial={{ opacity: 0, x: 26 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.22, duration: 0.7 }}
        >
          <strong>From scattered posts to clear thinking</strong>
          <p>Capture what you save, let AI group the signal, then ask the archive when you need a new idea.</p>
        </motion.div>
        <div className="cinema-scan" />
      </motion.div>
      <div className="scene-rail">
        {inspirationScenes.map((scene, index) => (
          <motion.article
            className="scene-card"
            key={scene.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            whileHover={shouldReduceMotion ? undefined : { y: -12, rotate: index === 1 ? 0 : index === 0 ? -1.5 : 1.5 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ type: "spring", stiffness: 170, damping: 18, delay: index * 0.07 }}
          >
            <img src={scene.image} alt={`${scene.title} work scene`} />
            <span>0{index + 1}</span>
            <h3>{scene.title}</h3>
            <p>{scene.body}</p>
            <small>{scene.credit}</small>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function BeforeAfter() {
  return (
    <section className="section before-after-section" aria-label="Before and after X Organizer">
      <motion.div className="section-heading" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={reveal} transition={{ duration: 0.65 }}>
        <span className="eyebrow">Before / After</span>
        <h2>Not another bookmark manager. A signal workflow.</h2>
      </motion.div>
      <div className="compare-grid">
        <TiltCard className="compare-card before" index={0}>
          <span className="compare-label">Before</span>
          <h3>Saved, then forgotten.</h3>
          {beforeAfter.before.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </TiltCard>
        <TiltCard className="compare-card after" index={1}>
          <span className="compare-label">After</span>
          <h3>Structured into ideas, notes, and product signals.</h3>
          <div className="after-tags">
            {beforeAfter.after.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </TiltCard>
      </div>
    </section>
  );
}

function InsightCards() {
  return (
    <section className="section insight-section" aria-label="AI generated library cards">
      <motion.div className="section-heading" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={reveal} transition={{ duration: 0.65 }}>
        <span className="eyebrow">AI-native output</span>
        <h2>Three cards that make the product feel useful immediately.</h2>
      </motion.div>
      <div className="insight-grid">
        {insightCards.map((card, index) => (
          <TiltCard className="insight-card" key={card.label} index={index}>
            <span>{card.label}</span>
            <h3>{card.title}</h3>
            <p>{card.body}</p>
            <small>{card.meta}</small>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section className="section" id="features">
      <motion.div className="section-heading" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={reveal} transition={{ duration: 0.65 }}>
        <span className="eyebrow">Product surface</span>
        <h2>Built for people who save too much and retrieve too little.</h2>
      </motion.div>
      <div className="feature-grid">
        {features.map((feature, index) => (
          <TiltCard
            className="feature-card"
            key={feature.title}
            index={index}
          >
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}

function Workflow() {
  return (
    <section className="section workflow-section" id="workflow">
      <motion.div className="workflow-visual" initial={{ opacity: 0.45, x: -42, scale: 0.96 }} whileInView={{ opacity: 1, x: 0, scale: 1 }} viewport={{ once: true, margin: "-90px" }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
        <img src={libraryDark} alt="Dark mode X Organizer library" />
        <div className="scan-line" />
      </motion.div>
      <motion.div className="workflow-copy" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-90px" }} variants={reveal} transition={{ duration: 0.65, delay: 0.12 }}>
        <span className="eyebrow">Five minute setup</span>
        <h2>From scattered saves to a living research desk.</h2>
        <div className="timeline">
          {workflow.map(([number, title, body]) => (
            <motion.div
              className="timeline-item"
              key={title}
              initial={{ opacity: 0.36, x: 28 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55 }}
            >
              <span>{number}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function AiPanel() {
  return (
    <section className="section ai-section" id="ai">
      <div className="ai-copy">
        <span className="eyebrow">Bring your own model</span>
        <h2>Your API key turns the archive into an answer engine.</h2>
        <p>
          X Organizer supports OpenAI-compatible providers including DeepSeek, OpenAI, OpenRouter, SiliconFlow,
          Moonshot, Qwen, and custom endpoints. Ask in natural language and get matched posts as cards.
        </p>
        <div className="provider-row" aria-label="Supported provider examples">
          {["DeepSeek", "OpenAI", "SiliconFlow", "OpenRouter", "Qwen"].map((provider) => (
            <span key={provider}>{provider}</span>
          ))}
        </div>
      </div>
      <motion.div
        className="ask-remotion-shell"
        initial={{ opacity: 0.52, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -10, rotateX: 2, rotateY: -3 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ type: "spring", stiffness: 170, damping: 18 }}
      >
        <Player
          component={AskAiComposition}
          inputProps={{ screenshot: aiChat }}
          durationInFrames={210}
          compositionWidth={960}
          compositionHeight={540}
          fps={30}
          initialFrame={72}
          autoPlay
          loop
          initiallyMuted
          acknowledgeRemotionLicense
          clickToPlay={false}
          controls={false}
          style={{ width: "100%", aspectRatio: "16 / 9" }}
        />
        <div className="ask-remotion-caption">
          <Bot size={17} />
          Live-style AI search demo built from the real Ask Library interface.
        </div>
      </motion.div>
    </section>
  );
}

const faqs = [
  {
    title: "Does it need the official X API?",
    body: "No. The MVP captures posts already rendered in your browser, then stores them locally.",
  },
  {
    title: "Does it read my X account data?",
    body: "It works from pages you open yourself, such as Bookmarks or Likes. It does not need your X password or official X developer API.",
  },
  {
    title: "Is my library local or cloud hosted?",
    body: "The extension stores captured post data in Chrome extension storage on your machine. The website is just the product page.",
  },
  {
    title: "Will my posts be uploaded to an AI model?",
    body: "Only when you explicitly use AI features with your own API provider. The model request uses the saved local library context needed for the question.",
  },
  {
    title: "Where is my API key stored?",
    body: "In Chrome local extension storage. JSON exports do not include the key.",
  },
  {
    title: "Can I export or delete data?",
    body: "Yes. The extension supports local JSON export, and you can clear extension storage from Chrome when you want to remove local data.",
  },
  {
    title: "Can I download the extension today?",
    body: "Yes. Use the GitHub download button, then load the folder through Chrome developer mode.",
  },
];

function Accordion() {
  const [active, setActive] = useState(0);
  return (
    <section className="section faq-section" id="design">
      <div className="section-heading">
        <span className="eyebrow">Launch notes</span>
        <h2>Small enough to trust. Sharp enough to use every day.</h2>
      </div>
      <div className="accordion">
        {faqs.map((item, index) => (
          <div className={active === index ? "accordion-item active" : "accordion-item"} key={item.title}>
            <button type="button" onClick={() => setActive(active === index ? -1 : index)}>
              <span>{item.title}</span>
              <ChevronDown size={18} />
            </button>
            <motion.div
              initial={false}
              animate={{ height: active === index ? "auto" : 0, opacity: active === index ? 1 : 0 }}
              transition={{ duration: 0.28 }}
              className="accordion-body"
            >
              <p>{item.body}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <a className="brand" href="#top" aria-label="Back to X Organizer top">
          <LogoMark />
          <span>X Organizer</span>
        </a>
        <p>Turn saved tweets into ideas, notes, and product signals.</p>
      </div>
      <div className="footer-links">
        <a href={githubUrl} target="_blank" rel="noreferrer">GitHub</a>
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
      </div>
    </footer>
  );
}

function Dock() {
  const [hovered, setHovered] = useState(null);
  const actions = [
    { href: githubUrl, label: "Open GitHub", icon: <GitBranch size={20} />, external: true },
    { href: downloadUrl, label: "Download source", icon: <Download size={20} /> },
    { href: "#ai", label: "View AI features", icon: <Brain size={20} /> },
    { href: "#features", label: "View features", icon: <Box size={20} /> },
  ];
  return (
    <motion.div
      className="dock"
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1, duration: 0.55 }}
      aria-label="Quick actions"
      onPointerLeave={() => setHovered(null)}
    >
      {actions.map((action, index) => {
        const distance = hovered === null ? 3 : Math.abs(hovered - index);
        const scale = distance === 0 ? 1.28 : distance === 1 ? 1.12 : 1;
        return (
          <motion.a
            key={action.label}
            href={action.href}
            target={action.external ? "_blank" : undefined}
            rel={action.external ? "noreferrer" : undefined}
            aria-label={action.label}
            onPointerEnter={() => setHovered(index)}
            animate={{ scale, y: distance === 0 ? -8 : distance === 1 ? -3 : 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 22 }}
          >
            {action.icon}
          </motion.a>
        );
      })}
    </motion.div>
  );
}

function App() {
  useEffect(() => {
    if (!window.location.hash) return undefined;
    const timer = window.setTimeout(() => {
      const target = document.querySelector(window.location.hash);
      target?.scrollIntoView({ block: "start" });
    }, 1650);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main id="top">
      <IntroLoader />
      <ScrollProgress />
      <CursorSpotlight />
      <div className="mesh mesh-one" />
      <div className="mesh mesh-two" />
      <Header />
      <section className="hero">
        <div className="hero-copy">
          <div className="pill">
            <Sparkles size={16} />
            Local-first X research library
          </div>
          <h1>
            <TypewriterText text={headline} />
          </h1>
          <p>
            {subtitle}
          </p>
          <div className="hero-actions">
            <MagneticLink className="primary-button" href={downloadUrl}>
              <Download size={18} />
              Download extension
              <ArrowRight size={18} />
            </MagneticLink>
            <MagneticLink className="ghost-button" href={githubUrl} target="_blank" rel="noreferrer">
              <GitBranch size={18} />
              View on GitHub
            </MagneticLink>
          </div>
          <div className="metrics-strip" aria-label="Product highlights">
            <span>Bookmarks</span>
            <span>Likes</span>
            <span>Categories</span>
            <span>Ask Library</span>
          </div>
        </div>
        <div className="hero-stage">
          <HeroCanvas />
          <ProductStack />
        </div>
        <FloatingFeatureBadges />
      </section>
      <InspirationLibrary />
      <BeforeAfter />
      <FeatureGrid />
      <InsightCards />
      <Workflow />
      <AiPanel />
      <Accordion />
      <section className="closing">
        <WandSparkles size={26} />
        <h2>Make X saves useful again.</h2>
        <p>Open source, local-first, and ready to install from GitHub.</p>
        <a className="primary-button" href={githubUrl} target="_blank" rel="noreferrer">
          <GitBranch size={18} />
          Star the project
        </a>
      </section>
      <SiteFooter />
      <Dock />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
