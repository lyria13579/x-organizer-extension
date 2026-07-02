import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame } from "@react-three/fiber";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import {
  ArrowRight,
  Bot,
  Box,
  Brain,
  ChevronDown,
  Download,
  GitBranch,
  Layers3,
  LockKeyhole,
  Search,
  Sparkles,
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
const headline = "X Organizer";
const subtitle =
  "Turn your X bookmarks, likes, and reposts into a searchable, categorized, AI-queryable local library.";

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
      <div className="intro-grid">
        <span>INDEXING LOCAL ARCHIVE</span>
        <strong>X Organizer</strong>
        <div className="intro-meter"><i /></div>
        <small>BOOKMARKS / LIKES / REPOSTS / ASK AI</small>
      </div>
    </motion.div>
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
  const items = ["Features", "Workflow", "AI", "Design"];
  return (
    <motion.header className="site-header" initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7 }}>
      <a className="brand" href="#top" aria-label="X Organizer home">
        <span className="brand-mark">整</span>
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
  ["01", "Capture", "Open Bookmarks or Likes, then capture visible posts or start a scroll sync."],
  ["02", "Organize", "Sort by likes, reposts, saves, time, or recommendation score; switch categories instantly."],
  ["03", "Ask", "Connect your own LLM key and ask the saved library instead of searching X again."],
];

const queryCards = [
  ["Design saves", "Show me product design posts with high saves."],
  ["AI workflows", "List agent and RAG references from my bookmarks."],
  ["Launch ideas", "Find tweets about distribution, pricing, and product launches."],
  ["Code notes", "Pull out technical posts worth turning into docs."],
];

function KineticIndex() {
  const { scrollYProgress } = useScroll();
  const xLeft = useTransform(scrollYProgress, [0, 1], ["0%", "-28%"]);
  const xRight = useTransform(scrollYProgress, [0, 1], ["-24%", "4%"]);

  return (
    <section className="kinetic-section" aria-label="X Organizer creative index">
      <motion.div className="kinetic-word row-a" style={{ x: xLeft }}>
        BOOKMARKS / LIKES / REPOSTS / LOCAL ARCHIVE
      </motion.div>
      <motion.div className="kinetic-word row-b" style={{ x: xRight }}>
        SEARCHABLE / CATEGORIZED / AI QUERYABLE
      </motion.div>
      <div className="query-strip">
        {queryCards.map(([title, prompt], index) => (
          <motion.article
            className="query-card"
            key={title}
            initial={{ opacity: 0.52, y: 24, rotate: index % 2 ? 1.8 : -1.8 }}
            whileInView={{ opacity: 1, y: 0, rotate: index % 2 ? 0.8 : -0.8 }}
            whileHover={{ y: -12, rotate: 0, scale: 1.03 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ type: "spring", stiffness: 180, damping: 18, delay: index * 0.06 }}
          >
            <span>0{index + 1}</span>
            <h3>{title}</h3>
            <p>{prompt}</p>
          </motion.article>
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
        className="ask-card"
        initial={{ opacity: 0.52, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        whileHover={{ y: -10, rotateX: 2, rotateY: -3 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ type: "spring", stiffness: 170, damping: 18 }}
      >
        <div className="ask-topline">
          <Bot size={18} />
          Ask Library
        </div>
        <p className="ask-question">Find design-related bookmarks with high saves.</p>
        <div className="answer-card">
          <span className="mini-avatar">D</span>
          <div>
            <strong>Design system notes</strong>
            <p>Matched from bookmarks and likes, sorted by save count and relevance.</p>
          </div>
        </div>
        <div className="answer-card">
          <span className="mini-avatar violet">A</span>
          <div>
            <strong>AI workflow references</strong>
            <p>Useful posts about agents, retrieval, and personal knowledge systems.</p>
          </div>
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
    title: "Where is my API key stored?",
    body: "In Chrome local extension storage. JSON exports do not include the key.",
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
      <KineticIndex />
      <FeatureGrid />
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
      <Dock />
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
