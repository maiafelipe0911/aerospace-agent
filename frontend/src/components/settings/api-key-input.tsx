import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

interface ApiKeyInputProps {
  provider: string;
  providerName: string;
  value: string;
  onChange: (key: string) => void;
}

export function ApiKeyInput({
  providerName,
  value,
  onChange,
}: ApiKeyInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {providerName}
      </label>
      <div className="relative">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`${providerName} API key`}
          className="pr-8 text-xs h-8"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          {visible ? (
            <EyeOff className="w-3.5 h-3.5" />
          ) : (
            <Eye className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
