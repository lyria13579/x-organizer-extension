import React, { Suspense, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame } from "@react-three/fiber";
import { motion, useScroll, useTransform } from "motion/react";
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

function ProductStack() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -110]);
  return (
    <motion.div className="product-stack" style={{ y }}>
      <div className="screen main-screen">
        <img src={libraryLight} alt="X Organizer card library interface" />
      </div>
      <div className="screen floating-screen floating-one">
        <img src={aiChat} alt="Ask Library card result interface" />
      </div>
      <div className="screen floating-screen floating-two">
        <img src={settings} alt="Bring your own API key settings" />
      </div>
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

function FeatureGrid() {
  return (
    <section className="section" id="features">
      <div className="section-heading">
        <span className="eyebrow">Product surface</span>
        <h2>Built for people who save too much and retrieve too little.</h2>
      </div>
      <div className="feature-grid">
        {features.map((feature, index) => (
          <motion.article
            className="feature-card"
            key={feature.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: index * 0.06 }}
          >
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function Workflow() {
  return (
    <section className="section workflow-section" id="workflow">
      <div className="workflow-visual">
        <img src={libraryDark} alt="Dark mode X Organizer library" />
        <div className="scan-line" />
      </div>
      <div className="workflow-copy">
        <span className="eyebrow">Five minute setup</span>
        <h2>From scattered saves to a living research desk.</h2>
        <div className="timeline">
          {workflow.map(([number, title, body]) => (
            <motion.div
              className="timeline-item"
              key={title}
              initial={{ opacity: 0, x: 28 }}
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
      </div>
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
        initial={{ opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
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
  return (
    <motion.div
      className="dock"
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1, duration: 0.55 }}
      aria-label="Quick actions"
    >
      <a href={githubUrl} target="_blank" rel="noreferrer" aria-label="Open GitHub">
        <GitBranch size={20} />
      </a>
      <a href={downloadUrl} aria-label="Download source">
        <Download size={20} />
      </a>
      <a href="#ai" aria-label="View AI features">
        <Brain size={20} />
      </a>
      <a href="#features" aria-label="View features">
        <Box size={20} />
      </a>
    </motion.div>
  );
}

function App() {
  return (
    <main id="top">
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
            X bookmarks and likes, rebuilt as a beautiful AI library.
          </h1>
          <p>
            Capture what you save on X, organize it into cards and categories, then ask your own LLM to retrieve the ideas
            you almost forgot.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href={downloadUrl}>
              <Download size={18} />
              Download extension
              <ArrowRight size={18} />
            </a>
            <a className="ghost-button" href={githubUrl} target="_blank" rel="noreferrer">
              <GitBranch size={18} />
              View on GitHub
            </a>
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
      </section>
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
