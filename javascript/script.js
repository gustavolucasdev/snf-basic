// Sistema de Geração de Notas Fiscais
class NotaFiscalSystem {
    constructor() {
        this.notasFiscais = [];
        this.nextNumber = 1;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadFromStorage();
        this.updateNotasList();
    }

    setupEventListeners() {
        const form = document.getElementById('notaForm');
        const addItemBtn = document.getElementById('addItem');
        const tipoOperacao = document.getElementById('tipoOperacao');

        form.addEventListener('submit', (e) => this.handleSubmit(e));
        addItemBtn.addEventListener('click', () => this.addItemRow());
        tipoOperacao.addEventListener('change', () => this.updateFormForOperationType());


        this.addItemRow();
    }

    updateFormForOperationType() {
        const tipo = document.getElementById('tipoOperacao').value;
        const clienteSection = document.getElementById('clienteSection');
        const fornecedorSection = document.getElementById('fornecedorSection');

        if (tipo === 'servico' || tipo === 'venda') {
            clienteSection.style.display = 'block';
            fornecedorSection.style.display = 'none';
        } else if (tipo === 'compra') {
            clienteSection.style.display = 'none';
            fornecedorSection.style.display = 'block';
        }
    }

    addItemRow() {
        const container = document.getElementById('itensContainer');
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-row';

        itemDiv.innerHTML = `
            <input type="text" placeholder="Descrição do item/serviço" class="item-descricao" required>
            <input type="number" placeholder="Quantidade" class="item-quantidade" min="1" value="1" required>
            <input type="number" placeholder="Valor unitário" class="item-valor" step="0.01" min="0" required>
            <span class="item-total">R$ 0,00</span>
            <button type="button" class="remove-item" onclick="notaSystem.removeItemRow(this)">×</button>
        `;

        container.appendChild(itemDiv);

        const quantidade = itemDiv.querySelector('.item-quantidade');
        const valor = itemDiv.querySelector('.item-valor');

        quantidade.addEventListener('input', () => this.calculateItemTotal(itemDiv));
        valor.addEventListener('input', () => this.calculateItemTotal(itemDiv));
    }

    removeItemRow(button) {
        const itemRow = button.parentElement;
        if (document.querySelectorAll('.item-row').length > 1) {
            itemRow.remove();
            this.calculateTotal();
        }
    }

    calculateItemTotal(itemDiv) {
        const quantidade = parseFloat(itemDiv.querySelector('.item-quantidade').value) || 0;
        const valor = parseFloat(itemDiv.querySelector('.item-valor').value) || 0;
        const total = quantidade * valor;

        itemDiv.querySelector('.item-total').textContent = this.formatCurrency(total);
        this.calculateTotal();
    }

    calculateTotal() {
        const itemRows = document.querySelectorAll('.item-row');
        let total = 0;

        itemRows.forEach(row => {
            const quantidade = parseFloat(row.querySelector('.item-quantidade').value) || 0;
            const valor = parseFloat(row.querySelector('.item-valor').value) || 0;
            total += quantidade * valor;
        });

        document.getElementById('totalGeral').textContent = this.formatCurrency(total);
    }

    async enviarNotaPorEmail(nota) {
        const destinatario = nota.cliente?.email || nota.fornecedor?.email;
        if (!destinatario) return;

        try {
            await fetch('http://localhost:3000/enviar-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: destinatario,
                    assunto: `Nota Fiscal #${nota.numero}`,
                    corpo: this.formatarNotaParaEmail(nota)
                })
            });

            console.log('E-mail enviado com sucesso');
        } catch (error) {
            console.error('Erro ao enviar e-mail:', error);
        }
    }

    formatarNotaParaEmail(nota) {
        return `
            Nota Fiscal #${nota.numero}
            Tipo: ${this.getTipoOperacaoText(nota.tipoOperacao)}
            Data: ${nota.data} - ${nota.hora}
            ${nota.cliente ? `Cliente: ${nota.cliente.nome} - ${nota.cliente.email}` : ''}
            ${nota.fornecedor ? `Fornecedor: ${nota.fornecedor.nome} - ${nota.fornecedor.email}` : ''}

            Itens:
            ${nota.itens.map(item => `- ${item.descricao} (${item.quantidade} x R$${item.valorUnitario.toFixed(2)}) = R$${item.valorTotal.toFixed(2)}`).join('\n')}

            Valor Total: R$ ${nota.valorTotal.toFixed(2)}

            ${nota.observacoes ? `Observações: ${nota.observacoes}` : ''}
        `;
    }


    handleSubmit(e) {
        e.preventDefault();

        const formData = this.getFormData();
        const nota = this.createNota(formData);

        this.notasFiscais.push(nota);
        this.saveToStorage();
        this.updateNotasList();
        this.resetForm();
        this.enviarNotaPorEmail(nota);

        alert('Nota fiscal gerada com sucesso!');
    }

    getFormData() {
        const form = document.getElementById('notaForm');
        const formData = new FormData(form);

        const itens = [];
        const itemRows = document.querySelectorAll('.item-row');

        itemRows.forEach(row => {
            const descricao = row.querySelector('.item-descricao').value;
            const quantidade = parseFloat(row.querySelector('.item-quantidade').value);
            const valor = parseFloat(row.querySelector('.item-valor').value);

            if (descricao && quantidade && valor) {
                itens.push({
                    descricao,
                    quantidade,
                    valorUnitario: valor,
                    valorTotal: quantidade * valor
                });
            }
        });

        return {
            tipoOperacao: formData.get('tipoOperacao'),
            nomeCliente: formData.get('nomeCliente') || '',
            emailCliente: formData.get('emailCliente') || '',
            nomeFornecedor: formData.get('nomeFornecedor') || '',
            emailFornecedor: formData.get('emailFornecedor') || '',
            observacoes: formData.get('observacoes') || '',
            itens
        };
    }

    createNota(data) {
        const valorTotal = data.itens.reduce((sum, item) => sum + item.valorTotal, 0);

        return {
            numero: this.nextNumber++,
            data: new Date().toLocaleDateString('pt-BR'),
            hora: new Date().toLocaleTimeString('pt-BR'),
            tipoOperacao: data.tipoOperacao,
            cliente: data.nomeCliente ? {
                nome: data.nomeCliente,
                email: data.emailCliente
            } : null,
            fornecedor: data.nomeFornecedor ? {
                nome: data.nomeFornecedor,
                email: data.emailFornecedor
            } : null,
            itens: data.itens,
            valorTotal,
            observacoes: data.observacoes
        };
    }

    updateNotasList() {
        const container = document.getElementById('notasLista');

        if (this.notasFiscais.length === 0) {
            container.innerHTML = '<p>Nenhuma nota fiscal cadastrada ainda.</p>';
            return;
        }

        container.innerHTML = this.notasFiscais.map(nota => `
            <div class="nota-item">
                <div class="nota-header">
                    <h3>Nota Fiscal #${nota.numero} - ${this.getTipoOperacaoText(nota.tipoOperacao)}</h3>
                    <div class="nota-actions">
                        <button onclick="notaSystem.viewNota(${nota.numero})" class="btn-view">Ver Detalhes</button>
                        <button onclick="notaSystem.deleteNota(${nota.numero})" class="btn-delete">Excluir</button>
                    </div>
                </div>
                <div class="nota-info">
                    <p><strong>Data:</strong> ${nota.data} - ${nota.hora}</p>
                    <p><strong>Tipo:</strong> ${this.getTipoOperacaoText(nota.tipoOperacao)}</p>
                    <p><strong>Valor Total:</strong> ${this.formatCurrency(nota.valorTotal)}</p>
                    ${nota.cliente ? `<p><strong>Cliente:</strong> ${nota.cliente.nome}</p>` : ''}
                    ${nota.fornecedor ? `<p><strong>Fornecedor:</strong> ${nota.fornecedor.nome}</p>` : ''}
                </div>
            </div>
        `).join('');
    }

    viewNota(numero) {
        const nota = this.notasFiscais.find(n => n.numero === numero);
        if (!nota) return;

        const modal = document.getElementById('notaModal');
        const content = document.getElementById('notaContent');

        content.innerHTML = `
            <div class="nota-detail">
                <div class="nota-detail-header">
                    <h2>Nota Fiscal #${nota.numero}</h2>
                    <p>${nota.data} - ${nota.hora}</p>
                </div>
                
                <div class="nota-detail-info">
                    <h3>Informações da ${this.getTipoOperacaoText(nota.tipoOperacao)}</h3>
                    <p><strong>Tipo de Operação:</strong> ${this.getTipoOperacaoText(nota.tipoOperacao)}</p>
                    
                    ${nota.cliente ? `
                        <h4>Cliente:</h4>
                        <p><strong>Nome:</strong> ${nota.cliente.nome}</p>
                        <p><strong>Email:</strong> ${nota.cliente.email}</p>
                    ` : ''}
                    
                    ${nota.fornecedor ? `
                        <h4>Fornecedor:</h4>
                        <p><strong>Nome:</strong> ${nota.fornecedor.nome}</p>
                        <p><strong>Email:</strong> ${nota.fornecedor.email}</p>
                    ` : ''}
                </div>
                
                <div class="nota-detail-itens">
                    <h3>Itens/Serviços:</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Descrição</th>
                                <th>Quantidade</th>
                                <th>Valor Unitário</th>
                                <th>Valor Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${nota.itens.map(item => `
                                <tr>
                                    <td>${item.descricao}</td>
                                    <td>${item.quantidade}</td>
                                    <td>${this.formatCurrency(item.valorUnitario)}</td>
                                    <td>${this.formatCurrency(item.valorTotal)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="nota-detail-total">
                    <h3>Valor Total: ${this.formatCurrency(nota.valorTotal)}</h3>
                </div>
                
                ${nota.observacoes ? `
                    <div class="nota-detail-obs">
                        <h4>Observações:</h4>
                        <p>${nota.observacoes}</p>
                    </div>
                ` : ''}
            </div>
        `;

        modal.style.display = 'block';
    }

    deleteNota(numero) {
        if (confirm('Tem certeza que deseja excluir esta nota fiscal?')) {
            this.notasFiscais = this.notasFiscais.filter(n => n.numero !== numero);
            this.saveToStorage();
            this.updateNotasList();
        }
    }

    getTipoOperacaoText(tipo) {
        const tipos = {
            'servico': 'Prestação de Serviço',
            'venda': 'Venda',
            'compra': 'Compra'
        };
        return tipos[tipo] || tipo;
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    resetForm() {
        document.getElementById('notaForm').reset();
        document.getElementById('itensContainer').innerHTML = '';
        document.getElementById('totalGeral').textContent = 'R$ 0,00';
        this.addItemRow();
        this.updateFormForOperationType();
    }

    saveToStorage() {
        const data = {
            notasFiscais: this.notasFiscais,
            nextNumber: this.nextNumber
        };
        localStorage.setItem('notasFiscaisSystem', JSON.stringify(data));
    }

    loadFromStorage() {
        const data = localStorage.getItem('notasFiscaisSystem');
        if (data) {
            const parsed = JSON.parse(data);
            this.notasFiscais = parsed.notasFiscais || [];
            this.nextNumber = parsed.nextNumber || 1;
        }
    }

    closeModal() {
        document.getElementById('notaModal').style.display = 'none';
    }

    imprimirPagina() {
        window.print();
    }
}

let notaSystem;
document.addEventListener('DOMContentLoaded', () => {
    notaSystem = new NotaFiscalSystem();
});

window.addEventListener('click', (e) => {
    const modal = document.getElementById('notaModal');
    if (e.target === modal) {
        notaSystem.closeModal();
    }
});