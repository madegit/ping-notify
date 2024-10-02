'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCustomToast } from "@/hooks/use-toast"
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User } from 'lucide-react'

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSigningUp, setIsSigningUp] = useState(false)
  const toast = useCustomToast()
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSigningUp(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, password })
      })
      if (res.ok) {
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
        })
        if (result?.ok) {
          router.push('/app')
          toast.success("Account created", "You've been successfully signed up and logged in.")
        } else {
          toast.error("Login failed", result?.error || "Please try logging in manually.")
        }
      } else {
        const errorData = await res.json()
        toast.error("Sign up failed", errorData.message || "Please try again.")
      }
    } catch (error) {
      console.error(error)
      toast.error("An error occurred", "Please try again later.")
    } finally {
      setIsSigningUp(false)
    }
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">Name</label>
        <div className="relative">
          <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="pl-8"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <div className="relative">
          <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-8"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <div className="relative">
          <Lock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            value={password}
            placeholder="•••••"
            onChange={(e) => setPassword(e.target.value)}
            className="pl-8"
            required
          />
        </div>
      </div>
      <Button 
        type="submit" 
        className="w-full bg-[#0500FF]" 
        disabled={isSigningUp}
      >
        {isSigningUp ? 'Signing up...' : 'Sign Up'}
      </Button>
    </form>
  )
}