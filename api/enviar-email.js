import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).end('Método não permitido');
    }

    const { email, assunto, corpo } = req.body;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'informaticagustavolucas@gmail.com',
            pass: '@Informaticagst184250'
        }
    });

    try {
        await transporter.sendMail({
            from: '"Gustavo Lucas Téc. Informática" <informaticagustavolucas@gmail.com>',
            to: email,
            subject: assunto,
            text: corpo
        });

        res.status(200).json({ message: 'Email enviado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao enviar o e-mail' });
    }
}
