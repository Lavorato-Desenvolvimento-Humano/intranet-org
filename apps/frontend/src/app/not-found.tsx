// src/app/not-found.tsx
import Link from "next/link";
import Image from "next/image";
import svg from "../../public/404.svg";

export default function NotFound(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100 px-5">
      <main className="flex flex-col justify-center items-center w-full max-w-4xl">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 w-full max-w-lg">
            <Image
              src={svg}
              alt="Ilustração de página não encontrada"
              width={500}
              height={300}
              priority
              className="w-full h-auto"
            />
          </div>

          <h1 className="font-inter text-9xl font-bold m-0 text-primary leading-none">
            404
          </h1>

          <p className="font-inter text-xs font-bold my-2.5 mb-8 tracking-wider text-black">
            P A G E &nbsp;&nbsp; N O T &nbsp;&nbsp; F O U N D
          </p>

          <div className="mt-5">
            <Link
              href="/"
              className="bg-primary text-white border-none py-3 px-6 text-base rounded-2xl cursor-pointer no-underline inline-block transition-colors hover:bg-primary-light font-inter">
              Voltar para a Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
