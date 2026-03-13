import { Orbit, Rocket, Timer, GitCompareArrows, KeyRound } from "lucide-react";

const EXAMPLE_PROMPTS = [
  {
    icon: Orbit,
    text: "What delta-v do I need for LEO to GEO?",
  },
  {
    icon: Rocket,
    text: "How much propellant for a 4 km/s burn with a 10,000 kg spacecraft?",
  },
  {
    icon: Timer,
    text: "What is the orbital period at 400 km altitude?",
  },
  {
    icon: GitCompareArrows,
    text: "Compare Hohmann vs bi-elliptic for LEO to a 100,000 km orbit",
  },
];

interface WelcomeScreenProps {
  onPromptClick: (text: string) => void;
}

export function WelcomeScreen({ onPromptClick }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-6">
      <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
        <Orbit className="w-8 h-8 text-blue-400" />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-1">Ask ARIA about orbital mechanics</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          AI-powered aerospace engineering assistant with a high-precision C++ physics engine.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground/70 bg-muted/30 rounded-lg px-4 py-2.5 max-w-md">
        <KeyRound className="w-4 h-4 shrink-0" />
        <span>
          ARIA uses your own API key — enter one in the sidebar to get started.
          Your key never leaves your browser. Gemini and Groq offer free tiers.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
        {EXAMPLE_PROMPTS.map(({ icon: Icon, text }) => (
          <button
            key={text}
            onClick={() => onPromptClick(text)}
            className="flex items-start gap-3 text-left text-sm p-3 rounded-lg
                       bg-muted/50 border border-border
                       hover:bg-muted hover:border-blue-500/30
                       transition-colors cursor-pointer"
          >
            <Icon className="w-4 h-4 mt-0.5 text-blue-400 shrink-0" />
            <span className="text-muted-foreground">{text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
