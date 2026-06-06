"use client";

import dynamic from "next/dynamic";

const JitsiRoom = dynamic(() => import("./JitsiRoom"), { ssr: false });

export default function JitsiRoomClientWrapper(props) {
  return <JitsiRoom {...props} />;
}
