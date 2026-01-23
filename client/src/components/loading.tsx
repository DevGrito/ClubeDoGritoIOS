import Lottie from "lottie-react";
import animationData from "@assets/Animation.json";

export default function Loading() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-white">
      <div className="w-72 h-72">
        <Lottie animationData={animationData} loop={true} />
      </div>
    </div>
  );
}