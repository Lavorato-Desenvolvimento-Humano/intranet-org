// components/ui/verificationInput.tsx
import React, { useState, useRef, useEffect } from "react";

interface VerificationInputProps {
  value?: string;
  onChange?: (value: string) => void;
  length?: number;
  containerClassName?: string;
  inputClassName?: string;
}

const VerificationInput: React.FC<VerificationInputProps> = ({
  value = "",
  onChange,
  length = 6,
  containerClassName = "flex gap-2 justify-center",
  inputClassName = "w-10 h-12 border border-gray-700 rounded-lg text-center text-xl font-semibold",
}) => {
  const [code, setCode] = useState(value.split(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array with the correct length
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
    // Fill the array with nulls if it's not long enough
    while (inputRefs.current.length < length) {
      inputRefs.current.push(null);
    }
  }, [length]);

  // Update code when value prop changes
  useEffect(() => {
    if (value) {
      const valueArray = value.split("");
      setCode(valueArray);
    }
  }, [value]);

  const focusInput = (index: number) => {
    if (index >= 0 && index < length) {
      inputRefs.current[index]?.focus();
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const newValue = e.target.value;

    // Only allow one character per input and only numbers
    if (newValue.length <= 1 && /^[0-9]*$/.test(newValue)) {
      const newCode = [...code];
      newCode[index] = newValue;

      setCode(newCode);

      // Call onChange with the joined code
      if (onChange) {
        onChange(newCode.join(""));
      }

      // Auto-focus next input if this one is filled
      if (newValue && index < length - 1) {
        focusInput(index + 1);
      }
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace") {
      // If input is empty and not the first input, go to previous input
      if (!code[index] && index > 0) {
        focusInput(index - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusInput(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").trim();

    // Only allow pasting numbers
    if (!/^\d+$/.test(pastedText)) return;

    const newCode = [...code];

    // Fill in as many inputs as possible with the pasted text
    for (let i = 0; i < Math.min(pastedText.length, length); i++) {
      newCode[i] = pastedText[i];
    }

    setCode(newCode);

    // Call onChange with the joined code
    if (onChange) {
      onChange(newCode.join(""));
    }

    // Focus the input after the last filled position
    const nextEmptyIndex = Math.min(pastedText.length, length - 1);
    focusInput(nextEmptyIndex);
  };

  return (
    <div className={containerClassName}>
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => {
            // Atribuir o elemento à posição no array de refs sem retornar valor
            inputRefs.current[index] = el;
          }}
          type="text"
          className={inputClassName}
          maxLength={1}
          value={code[index] || ""}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          autoComplete="off"
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
};

export default VerificationInput;
