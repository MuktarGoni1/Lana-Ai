"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/db"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [nickname, setNickname] = useState("")
  const [age, setAge] = useState<number | "">("")
  const [grade, setGrade] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname || !age || !grade) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      })
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return router.push("/login")
    }

    const child_uid = crypto.randomUUID() // anon child

    try {
      // 1. create child user (anon)
      const { error: userErr } = await supabase.from("users").insert({
        id: child_uid,
        email: `${child_uid}@child.lana`,
        user_metadata: { role: "child", nickname, age, grade },
      })
      if (userErr) throw userErr

      // 2. link parent → child
      const { error: guardianErr } = await supabase.from("guardians").insert({
        email: session.user.email,
        child_uid,
        weekly_report: true,
        monthly_report: false,
      })
      if (guardianErr) {
        // Compensate: remove child user to avoid orphaned record
        await supabase.from("users").delete().eq("id", child_uid)
        throw guardianErr
      }

      toast({ title: "Success", description: "Child linked to your account." })
      
      // Mark user as needing term plan onboarding
      localStorage.setItem('lana_first_time_term_plan', 'true');
      
      router.push("/term-plan")
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to set up child.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md bg-white/5 border-white/10 text-white">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl">Set up your child</CardTitle>
          <CardDescription className="text-white/60">This helps Lana explain at the right level.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="nickname" className="text-white/80">Nickname</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Child’s nickname"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/40"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="age" className="text-white/80">Age</Label>
              <Input
                id="age"
                type="number"
                min={6}
                max={18}
                value={age || ""}
                onChange={(e) => setAge(e.target.value ? Number(e.target.value) : "")}
                placeholder="Age"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/40"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="grade" className="text-white/80">Grade</Label>
              <select
                id="grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white ring-offset-background placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2"
                required
              >
                <option value="" disabled>
                  Select grade
                </option>
                <option value="6">Grade 6</option>
                <option value="7">Grade 7</option>
                <option value="8">Grade 8</option>
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
                <option value="12">Grade 12</option>
                <option value="college">College</option>
              </select>
            </div>

            <Button type="submit" className="bg-white text-black hover:bg-white/90 transition-colors" size="lg">
              Finish setup
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}