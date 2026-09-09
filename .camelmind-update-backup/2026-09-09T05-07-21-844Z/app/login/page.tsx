import { redirect } from "next/navigation"
import { getAuthConfig, isAuthEnabled } from "@/lib/config"
import { LoginForm } from "./LoginForm"

export default function LoginPage() {
  if (!isAuthEnabled()) redirect("/home")
  const { provider } = getAuthConfig()
  return <LoginForm provider={provider} />
}
