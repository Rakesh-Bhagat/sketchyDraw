import CanvasBoard from "./CanvasBoard"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "SketchyDraw – Collaborative Whiteboarding made simple",
  description: "Draw diagrams with a hand-drawn feel",
  openGraph: {
    title: "SketchyDraw Board",
    description: "Open this collaborative board in SketchyDraw",
    url: "https://sketchydraw.com",
    siteName: "SketchyDraw",
    images: [
      {
        url: "https://sketchydraw.com/preview.jpg",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
}

export default function Page() {
  return <CanvasBoard />
}