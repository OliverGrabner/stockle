import { Game } from "@/components/game"

export default function Home() {
  return (
    <div className="bg-background flex min-h-svh flex-col items-center justify-start gap-6 p-6 md:p-10 pt-20">
      <Game />
    </div>
  )
}
