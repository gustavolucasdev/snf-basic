// Importação correta do SendGrid
import sgMail from '@sendgrid/mail';

// Configure a API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
    // Headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    console.log('Requisição recebida:', req.body);

    const { email, assunto, corpo } = req.body;

    // Validação
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

    // Verificar se a API Key está configurada
    if (!process.env.SENDGRID_API_KEY) {
        console.error('SENDGRID_API_KEY não está configurada');
        return res.status(500).json({ error: 'Configuração de email não encontrada' });
    }

    try {
        console.log('Tentando enviar email para:', email);
        console.log('API Key configurada:', process.env.SENDGRID_API_KEY ? 'SIM' : 'NÃO');

        const msg = {
            to: email,
            from: {
                email: 'informaticagustavolucas@gmail.com',
                name: 'Sistema de Notas Fiscais'
            },
            subject: assunto,
            text: corpo,
            html: corpo.replace(/\n/g, '<br>')
        };

        const result = await sgMail.send(msg);

        console.log('Email enviado com sucesso:', result[0].statusCode);
        return res.status(200).json({
            message: 'Email enviado com sucesso!',
            destinatario: email,
            status: result[0].statusCode
        });

    } catch (error) {
        console.error('Erro detalhado ao enviar email:', {
            message: error.message,
            code: error.code,
            response: error.response?.body || error.response
        });

        // Tratamento de erros específicos do SendGrid
        if (error.code === 401) {
            return res.status(500).json({
                error: 'Erro de autenticação SendGrid - Verifique a API Key'
            });
        }

        if (error.code === 403) {
            return res.status(500).json({
                error: 'Email remetente não verificado no SendGrid'
            });
        }

        if (error.code === 400) {
            return res.status(500).json({
                error: 'Dados inválidos para o SendGrid',
                details: error.response?.body?.errors || error.message
            });
        }

        return res.status(500).json({
            error: 'Erro ao enviar email',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno do servidor'
        });
    }
}