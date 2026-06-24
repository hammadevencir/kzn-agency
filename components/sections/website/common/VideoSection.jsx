import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { playIcon, verifiedIcon } from "@/components/icons";

const VideoSection = ({ renderStars }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const iframeRef = useRef(null);
  const hideControlsTimeoutRef = useRef(null);

  const handlePlay = () => {
    setIsPlaying(true);
    setShowControls(true);

    // Send play command to Vimeo iframe
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage('{"method":"play"}', "*");
    }

    // Hide controls after 2 seconds
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2000);
  };

  const handlePause = () => {
    setIsPlaying(false);
    setShowControls(true);

    // Clear the hide timeout when pausing
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }

    // Send pause command to Vimeo iframe
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage('{"method":"pause"}', "*");
    }
  };

  const handleMouseEnter = () => {
    if (isPlaying) {
      setShowControls(true);
      // Clear any existing timeout
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      // Hide controls after 2 seconds when mouse leaves
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="card-gradient-bg backdrop-blur-sm rounded-xl border-x border-[#F8F8F80D] p-6 flex flex-col gap-4 h-full w-full max-w-6xl min-h-[320px] mb-20">
      {/* Golden Icon */}
      <div className="flex mb-4">
        <Image
          className="size-12"
          src="/icon.png"
          alt="icon"
          width={55}
          height={55}
        />
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col">
        <div
          className="bg-black rounded-lg aspect-video mb-4 overflow-hidden flex items-center justify-center relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <iframe
            ref={iframeRef}
            src="https://player.vimeo.com/video/1123965496?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479&amp;controls=0"
            width="100%"
            height="100%"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            title="RW x KAZAN - Made with Clipchamp (1)"
            className="w-full h-full"
          ></iframe>

          {/* Custom Controls Overlay */}
          <div className="absolute inset-0 flex items-center justify-center z-20">
            {!isPlaying && (
              <button
                onClick={handlePlay}
                className="size-16 bg-[#D4B060] rounded-full flex items-center justify-center hover:bg-[#B8944F] transition-colors duration-200 shadow-lg"
                aria-label="Play video"
              >
                {playIcon}
              </button>
            )}
            {isPlaying && showControls && (
              <button
                onClick={handlePause}
                className="size-16 bg-[#D4B060] rounded-full flex items-center justify-center hover:bg-[#B8944F] transition-all duration-300 shadow-lg"
                aria-label="Pause video"
              >
                <svg
                  className="w-6 h-6 text-black"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="flex items-stretch mt-5 gap-3 w-full">
          <Image
            src="/russian-wizard.png"
            alt="russian wizard"
            width={68}
            height={68}
            className="size-17 rounded-full min-w-17 min-h-17"
          />
          <div className="w-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span className="text-whi text-sm">Russian Wizard</span>
                {verifiedIcon}
              </div>
              <div className="flex gap-0.5">
                <Image src="/image.png" alt="stars" width={90} height={18} />
              </div>
            </div>

            <div className="flex gap-2 justify-between mb-2">
              <span className="text-[#7E808A] text-xs md:text-sm max-w-[812px]">
                Kazan made it possible to let me scale to €1.000.000+/months
                consistent without any performance dips or spend issues. Results
                don't lie, thank you guys!
              </span>
              <span className="text-nowrap text-[#7E808A] text-md">Verified by Trust Pilot</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSection;
