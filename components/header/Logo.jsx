import React from "react";
import Link from "next/link";
import Image from "next/image";

const Logo = () => {
  return (
    <Link href="/">
      <Image
        src="/logo.png"
        alt="logo"
        width={200}
        height={100}
        priority
        className="h-auto w-[120px] md:w-[200px]"
      />
    </Link>
  );
};

export default Logo;
