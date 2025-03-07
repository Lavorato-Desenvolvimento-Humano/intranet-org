import Image from "next/image";
import Logo from "../../../public/logo.svg";

export default function Header() {
  return (
    <header className="bg-white relative w-full" style={{ height: "11.5rem" }}>
      <div className="container mx-auto px-4 h-full flex items-center justify-center">
        <div
          className="relative"
          style={{ width: "11.375rem", height: "6.875rem" }}>
          <Image
            src={Logo}
            alt="Logo"
            fill
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-6 bg-primary-light"></div>
      <div className="absolute bottom-0 left-0 right-0">
        <div className="h-6 bg-white rounded-bl-3xl rounded-br-3xl bottom-shadow"></div>
      </div>
    </header>
  );
}
