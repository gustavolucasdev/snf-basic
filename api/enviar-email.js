import sendgrid from '@sendgrid/mail';

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { email, assunto, corpo } = req.body;

  if (!email || !assunto || !corpo) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    await sendgrid.send({
      to: email,
      from: 'informaticagustavolucas@gmail.com', // e-mail verificado no SendGrid
      subject: assunto,
      text: corpo,
    });

    return res.status(200).json({ message: 'Email enviado com sucesso!' });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return res.status(500).json({ error: 'Erro ao enviar email' });
  }
}
