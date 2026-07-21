from app.core.logging import logger

class EmailService:
    """Mock email service with pre-configured HTML templates for portal notifications."""
    
    @staticmethod
    def _send_mock_email(to_email: str, subject: str, html_content: str) -> None:
        """Simulates SMTP transport logging."""
        logger.info(
            "email_sent_mock_telemetry",
            recipient=to_email,
            subject=subject,
            template_preview=html_content[:200] + "..."
        )

    def send_welcome_email(self, to_email: str, full_name: str) -> None:
        subject = "Welcome to INDUSMIND AI"
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 30px;">
                <h2 style="color: #1e3e62; margin-top: 0;">Welcome aboard, {full_name}!</h2>
                <p>Your INDUSMIND AI corporate account is active. You can now access your asset documentation center, upload SOPs, and ground your queries in the AI Copilot.</p>
                <div style="margin: 24px 0;">
                    <a href="http://localhost:3000/login" style="background-color: #4f46e5; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Access Portal</a>
                </div>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 11px; color: #64748b;">INDUSMIND AI Operations | Security Node</p>
            </div>
        </div>
        """
        self._send_mock_email(to_email, subject, html)

    def send_verification_email(self, to_email: str, token: str) -> None:
        subject = "Verify Your INDUSMIND AI Account"
        verification_link = f"http://localhost:3000/verify-email?token={token}"
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 30px;">
                <h2 style="color: #1e3e62; margin-top: 0;">Verify Corporate Email</h2>
                <p>Please click the button below to verify your corporate email address and activate your security permissions.</p>
                <div style="margin: 24px 0;">
                    <a href="{verification_link}" style="background-color: #4f46e5; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Verify Email</a>
                </div>
                <p style="font-size: 12px; color: #64748b;">Or copy this link to your browser: <br /> <a href="{verification_link}">{verification_link}</a></p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 11px; color: #64748b;">This verification token will expire in 24 hours.</p>
            </div>
        </div>
        """
        self._send_mock_email(to_email, subject, html)

    def send_password_reset_email(self, to_email: str, token: str) -> None:
        subject = "Reset Your INDUSMIND AI Password"
        reset_link = f"http://localhost:3000/reset-password?token={token}"
        html = f"""
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #1e293b; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; border: 1px solid #e2e8f0; padding: 30px;">
                <h2 style="color: #1e3e62; margin-top: 0;">Reset Portal Password</h2>
                <p>We received a request to reset your security credentials. Click the button below to choose a new password.</p>
                <div style="margin: 24px 0;">
                    <a href="{reset_link}" style="background-color: #ef4444; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p style="font-size: 12px; color: #64748b;">Or copy this link to your browser: <br /> <a href="{reset_link}">{reset_link}</a></p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                <p style="font-size: 11px; color: #64748b;">If you did not request this, you can ignore this email. The link expires in 1 hour.</p>
            </div>
        </div>
        """
        self._send_mock_email(to_email, subject, html)


email_service = EmailService()
