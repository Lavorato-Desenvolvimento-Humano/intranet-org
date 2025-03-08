import React, { useState, useRef, KeyboardEvent, ClipboardEvent } from "react";

interface VerificationInputProps {
  length?: number;
  onChange?: (code: string) => void;
  onComplete?: (code: string) => void;
  containerClassName?: string;
  inputClassName?: string;
  inputStyle?: React.CSSProperties;
}

const VerificationInput: React.FC<VerificationInputProps> = ({
  length = 6,
  onChange,
  onComplete,
  // Default values for customization props
  containerClassName = "flex gap-2",
  inputClassName = "mb-8 w-12 h-12 border border-gray-700 rounded-lg text-center text-xl font-semibold",
  inputStyle = {
    aspectRatio: "1/1",
    outline: "none",
  },
}) => {
  const [code, setCode] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (inputRefs.current.length !== length) {
    inputRefs.current = Array(length).fill(null);
  }

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      const chars = value.split("");
      const newCode = [...code];

      for (let i = 0; i < chars.length && index + i < length; i++) {
        newCode[index + i] = chars[i];
      }

      setCode(newCode);

      const nextIndex = Math.min(index + chars.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      if (value && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    const updatedCode = [...code];
    updatedCode[index] = value;
    onChange?.(updatedCode.join(""));

    if (updatedCode.join("").length === length) {
      onComplete?.(updatedCode.join(""));
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (
    index: number,
    event: ClipboardEvent<HTMLInputElement>
  ) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData("text/plain").trim();

    if (pastedData) {
      const chars = pastedData.split("");
      const newCode = [...code];

      for (let i = 0; i < chars.length && index + i < length; i++) {
        newCode[index + i] = chars[i];
      }

      setCode(newCode);

      const lastFilledIndex = Math.min(index + chars.length - 1, length - 1);
      inputRefs.current[lastFilledIndex]?.focus();

      onChange?.(newCode.join(""));

      if (newCode.join("").length === length) {
        onComplete?.(newCode.join(""));
      }
    }
  };

  return (
    <div className={containerClassName}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={code[index]}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          className={inputClassName}
          style={inputStyle}
        />
      ))}
    </div>
  );
};

export default VerificationInput;
