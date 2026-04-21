const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const sendResetEmail = async (toEmail, resetUrl) => {
  await transporter.sendMail({
    from: `"MyBudget" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Recupera tu contraseña — MyBudget',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#f0f4f8;padding:32px 16px;">
        <div style="background:#fff;border-radius:16px;padding:40px 36px;box-shadow:0 4px 24px rgba(0,0,0,.08);">
          <div style="text-align:center;margin-bottom:28px;">
            <h1 style="font-size:24px;font-weight:800;color:#0f172a;margin:0;">MyBudget</h1>
            <p style="color:#64748b;margin:6px 0 0;font-size:14px;">Tu economía personal</p>
          </div>
          <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0 0 10px;">Recupera tu contraseña</h2>
          <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.
            Haz clic en el botón de abajo para crear una nueva contraseña.
          </p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#3b82f6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:700;font-size:15px;letter-spacing:.01em;">
              Restablecer contraseña
            </a>
          </div>
          <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0 0 8px;">
            Este enlace es válido durante <strong>1 hora</strong>. Si no solicitaste este cambio, puedes ignorar este email con total seguridad.
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
            © ${new Date().getFullYear()} MyBudget — Este es un email automático, no respondas a este mensaje.
          </p>
        </div>
      </div>
    `,
  })
}

module.exports = { sendResetEmail }
