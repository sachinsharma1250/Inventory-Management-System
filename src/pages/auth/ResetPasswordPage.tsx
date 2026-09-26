import React from "react"
import { LoginPage } from "./LoginPage"

export const ResetPasswordPage: React.FC = () => {
  return <LoginPage initialView="forgot" />
}

export default ResetPasswordPage
