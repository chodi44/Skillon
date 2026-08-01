import Editor from "@monaco-editor/react";
import { useState } from "react";

interface CodeEditorProps {
  initialValue?: string;
  language?: string;
  onChange?: (val: string) => void;
}

export function CodeEditor({ initialValue = "", language = "javascript", onChange }: CodeEditorProps) {
  const [value, setValue] = useState(initialValue);

  const handleEditorChange = (value: string | undefined) => {
    setValue(value || "");
    if (onChange) onChange(value || "");
  };

  return (
    <div className="h-[400px] w-full overflow-hidden rounded-lg border border-border">
      <Editor
        height="100%"
        defaultLanguage={language}
        value={value}
        theme="vs-dark"
        onChange={handleEditorChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "JetBrains Mono, monospace",
          padding: { top: 16 },
        }}
      />
    </div>
  );
}
