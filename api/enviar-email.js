// Importe o SendGrid (sintaxe ES6 para Vercel)
import sgMail from '@sendgrid/mail';

// Configure a API Key (adicione no .env ou variáveis de ambiente do Vercel)
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
    // Adicione CORS headers se necessário
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    console.log('Requisição recebida:', req.body);

    const { email, assunto, corpo } = req.body;

    // Validação mais robusta
    if (!email || !assunto || !corpo) {
        console.error('Dados incompletos:', { email: !!email, assunto: !!assunto, corpo: !!corpo });
        return res.status(400).json({
            error: 'Dados incompletos',
            details: {
                email: !email ? 'Email é obrigatório' : null,
                assunto: !assunto ? 'Assunto é obrigatório' : null,
                corpo: !corpo ? 'Corpo é obrigatório' : null
            }
        });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Formato de email inválido' });
    }

    try {
        console.log('Tentando enviar email para:', email);

        const msg = {
            to: email,
            from: {
                email: 'informaticagustavolucas@gmail.com',
                name: 'Sistema de Notas Fiscais' // Nome opcional
            },
            subject: assunto,
            text: corpo, // Versão texto
            html: corpo.replace(/\n/g, '<br>'), // Versão HTML simples
        };

        await sgMail.send(msg);

        console.log('Email enviado com sucesso para:', email);
        return res.status(200).json({
            message: 'Email enviado com sucesso!',
            destinatario: email
        });

    } catch (error) {
        console.error('Erro detalhado ao enviar email:', {
            message: error.message,
            code: error.code,
            response: error.response?.body
        });

        // Diferentes tipos de erro
        if (error.code === 401) {
            return res.status(500).json({
                error: 'Erro de autenticação SendGrid - Verifique a API Key'
            });
        }

        if (error.code === 403) {
            return res.status(500).json({
                error: 'Erro de permissão - Email remetente não verificado'
            });
        }

        return res.status(500).json({
            error: 'Erro ao enviar email',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}