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

    console.log('=== INÍCIO DEBUG ===');
    console.log('Requisição recebida:', req.body);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('API Key existe:', !!process.env.SENDGRID_API_KEY);
    console.log('API Key prefixo:', process.env.SENDGRID_API_KEY?.substring(0, 5));

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
        console.error('Email inválido:', email);
        return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // Verificar se a API Key está configurada
    if (!process.env.SENDGRID_API_KEY) {
        console.error('SENDGRID_API_KEY não está configurada');
        return res.status(500).json({ error: 'Configuração de email não encontrada' });
    }

    try {
        console.log('Preparando email...');
        console.log('Para:', email);
        console.log('De:', 'informaticagustavolucas@gmail.com');
        console.log('Assunto:', assunto);

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

        console.log('Objeto msg criado:', JSON.stringify(msg, null, 2));
        console.log('Enviando email...');

        const result = await sgMail.send(msg);

        console.log('Email enviado com sucesso!');
        console.log('Status code:', result[0].statusCode);
        console.log('Headers:', result[0].headers);

        return res.status(200).json({
            message: 'Email enviado com sucesso!',
            destinatario: email,
            status: result[0].statusCode
        });

    } catch (error) {
        console.error('=== ERRO DETALHADO ===');
        console.error('Tipo do erro:', typeof error);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error stack:', error.stack);

        // Log completo da resposta do SendGrid
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
            console.error('Response body:', JSON.stringify(error.response.body, null, 2));
        }

        // Tratamento de erros específicos do SendGrid
        if (error.code === 401) {
            return res.status(500).json({
                error: 'Erro de autenticação SendGrid - Verifique a API Key',
                debug: { code: error.code, message: error.message }
            });
        }

        if (error.code === 403) {
            return res.status(500).json({
                error: 'Email remetente não verificado no SendGrid',
                debug: { code: error.code, message: error.message }
            });
        }

        if (error.code === 400) {
            return res.status(500).json({
                error: 'Dados inválidos para o SendGrid',
                details: error.response?.body?.errors || error.message,
                debug: { code: error.code, message: error.message }
            });
        }

        return res.status(500).json({
            error: 'Erro ao enviar email',
            details: error.message,
            debug: {
                code: error.code,
                type: typeof error,
                hasResponse: !!error.response
            }
        });
    }
}