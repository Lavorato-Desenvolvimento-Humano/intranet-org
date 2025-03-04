"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("https://dev.lavorato.app.br:8080/api/hello")
      .then((res) => res.text())
      .then((data) => setMessage(data));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold text-blue-600">
        Frontend conectado ao Backend!
      </h1>
      <p className="mt-4 text-lg text-gray-700">
        Resposta do Backend: {message}
      </p>
    </div>
  );
}
