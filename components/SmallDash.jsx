import React from "react";

const SmallDash = () => {
  return (
    <svg
      width="60"
      height="1"
      viewBox="0 0 60 1"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line y1="0.5" x2="60" y2="0.5" stroke="url(#paint0_linear_400_6761)" />
      <defs>
        <linearGradient
          id="paint0_linear_400_6761"
          x1="0"
          y1="1"
          x2="60"
          y2="1"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="0.510417" stopColor="white" stopOpacity="0.53125" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default SmallDash;
