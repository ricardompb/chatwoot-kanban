# Chatwoot Kanban - Sistema de Gerenciamento de Conversas

## 📋 Descrição
Sistema de interface Kanban para visualizar e gerenciar conversas do Chatwoot. Permite organizar conversas por status (Pendente, Em Aberto, Adiado, Resolvido) usando uma interface drag-and-drop moderna e responsiva.

## ✨ Funcionalidades Principais

### 🎯 Interface Kanban
- **Visualização por Status**: Conversas organizadas em colunas por status
- **Drag & Drop**: Mova conversas entre colunas para alterar status automaticamente
- **Contadores Dinâmicos**: Cada coluna mostra a quantidade de conversas em tempo real
- **Interface Responsiva**: Funciona perfeitamente em desktop e mobile

### 🔐 Segurança e Usabilidade
- **Toggle de Visibilidade**: Botão para mostrar/esconder o token de API
- **Persistência Local**: Token e Account ID salvos automaticamente no localStorage
- **Validação de Dados**: Verificações robustas de integridade dos dados
- **Tratamento de Erros**: Mensagens claras e logs detalhados para debugging

### 🚀 Performance e UX
- **Loading de Tela Inteira**: Overlay profissional com spinner animado durante carregamento
- **Busca Multi-Status**: Recupera conversas de todos os status (pending, open, resolved, snoozed)
- **Detalhes Completos**: Modal com informações detalhadas da conversa e histórico de mensagens
- **Priorização Visual**: Cores diferentes baseadas no tempo de espera

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5**: Estrutura semântica moderna
- **CSS3**: Variáveis CSS, Flexbox, Grid, animações
- **JavaScript ES6+**: Async/await, destructuring, optional chaining
- **Font Awesome**: Ícones profissionais
- **SortableJS**: Biblioteca para drag-and-drop

### Backend
- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web minimalista
- **Axios**: Cliente HTTP para requisições
- **CORS**: Middleware para Cross-Origin Resource Sharing
- **dotenv**: Gerenciamento de variáveis de ambiente

## 📁 Estrutura do Projeto

```
chatwoot-kanban/
├── src/
│   ├── index.html          # Interface principal
│   ├── script.js           # Lógica JavaScript
│   ├── styles.css          # Estilos CSS
│   └── server.js           # Servidor proxy Node.js
├── .env                    # Variáveis de ambiente (não versionado)
├── .gitignore             # Arquivos ignorados pelo Git
├── package.json           # Dependências e scripts
├── package-lock.json      # Lock das dependências
└── README.md              # Esta documentação
```

## 🚀 Como Usar

### 1. Instalação
```bash
# Clone o repositório
git clone <repository-url>
cd chatwoot-kanban

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com sua BASE_URL do Chatwoot
```

### 2. Configuração
1. Crie um arquivo `.env` na raiz do projeto:
```env
BASE_URL=sua-instancia.chatwoot.com
PORT=3000
```

2. Inicie o servidor:
```bash
npm start
```

3. Acesse `http://localhost:3000` no navegador

### 3. Uso da Interface
1. **Insira suas credenciais**:
   - Token de API do Chatwoot
   - ID da Conta
   - Use o botão 👁️ para mostrar/esconder o token

2. **Carregue os dados**:
   - Clique em "Atualizar" para buscar conversas
   - Aguarde o loading de tela inteira

3. **Gerencie conversas**:
   - Arraste conversas entre colunas para alterar status
   - Clique em uma conversa para ver detalhes completos
   - Observe os contadores atualizarem automaticamente

## 🔧 Principais Correções Implementadas

### 1. Busca Multi-Status
- **Problema**: API do Chatwoot só retornava conversas "open" por padrão
- **Solução**: Implementada busca sequencial por todos os status
```javascript
const statuses = ["pending", "open", "resolved", "snoozed"];
for (const status of statuses) {
  // Busca individual por status
}
```

### 2. Estrutura de Dados Robusta
- **Problema**: Diferentes estruturas de resposta da API
- **Solução**: Detecção automática da estrutura
```javascript
if (data.data && data.data.payload) {
    return data.data.payload;
}
return data.data || data.payload || [];
```

### 3. Tratamento de Timestamps
- **Problema**: Timestamps Unix não convertidos corretamente
- **Solução**: Conversão automática multiplicando por 1000
```javascript
if (conversation.created_at) {
    createdAt = new Date(conversation.created_at * 1000);
}
```

### 4. Acesso Seguro a Propriedades
- **Problema**: Erros ao acessar propriedades aninhadas undefined
- **Solução**: Optional chaining e fallbacks
```javascript
const senderName = conversation.meta?.sender?.name || 
                  conversation.sender?.name || 
                  `Cliente #${conversation.id}`;
```

### 5. Loading UX Melhorado
- **Problema**: Textos "Carregando..." espalhados pelos cartões
- **Solução**: Overlay de tela inteira com spinner profissional

## 🎨 Tipos de Status Suportados

| Status | Descrição | Cor |
|--------|-----------|-----|
| **pending** | Conversas pendentes | Padrão |
| **open** | Conversas em aberto | Padrão |
| **snoozed** | Conversas adiadas | Padrão |
| **resolved** | Conversas resolvidas | Padrão |

## 💬 Tipos de Mensagem Suportados

| Tipo | Descrição | Estilo |
|------|-----------|--------|
| **Contact/User** | Mensagens do cliente | Fundo cinza claro, alinhado à esquerda |
| **AgentBot** | Mensagens do bot | Fundo amarelo, centralizado |
| **Agent** | Mensagens do atendente | Fundo azul, alinhado à direita |

## 🔌 API do Chatwoot

### Endpoints Utilizados
```javascript
// Listar conversas por status
GET /api/v1/accounts/{account_id}/conversations?status={status}

// Atualizar status da conversa
POST /api/v1/accounts/{account_id}/conversations/{id}/status
```

### Headers Necessários
```javascript
{
    'api_access_token': 'SEU_TOKEN_AQUI',
    'Content-Type': 'application/json'
}
```

### Proxy CORS
O servidor Node.js atua como proxy para contornar limitações de CORS:
```javascript
// Todas as requisições /api/v1/* são redirecionadas para o Chatwoot
app.use("/api/v1", async (req, res) => {
  const chatwootUrl = `https://${process.env.BASE_URL}/api/v1${req.url}`;
  // ... lógica do proxy
});
```

## 🎯 Melhorias Implementadas

### Interface e UX
- ✅ **Design Responsivo**: Funciona em todos os dispositivos
- ✅ **Loading Profissional**: Overlay de tela inteira com spinner
- ✅ **Toggle de Senha**: Botão para mostrar/esconder token
- ✅ **Persistência**: Credenciais salvas automaticamente
- ✅ **Feedback Visual**: Contadores, animações, estados de hover

### Funcionalidade
- ✅ **Busca Completa**: Todos os status de conversa
- ✅ **Drag & Drop**: Interface intuitiva para mudança de status
- ✅ **Modal Detalhado**: Visualização completa das conversas
- ✅ **Tratamento de Erros**: Logs detalhados e mensagens claras
- ✅ **Validação Robusta**: Verificações de integridade dos dados

### Performance
- ✅ **Proxy Otimizado**: Servidor Node.js para contornar CORS
- ✅ **Carregamento Assíncrono**: Busca paralela por status
- ✅ **Cache Local**: localStorage para credenciais
- ✅ **Animações Suaves**: Transições CSS otimizadas

## 🐛 Debugging

### Console Logs
O sistema inclui logs detalhados no console do navegador:
- Dados recebidos da API por status
- Conversas agrupadas por status
- Erros com stack trace completo
- Status das requisições HTTP

### Como Debugar
1. Abra o Console do Navegador (F12)
2. Clique em "Atualizar" para carregar conversas
3. Observe as mensagens de log durante o carregamento
4. Verifique erros de rede na aba Network

## 🔮 Próximos Passos Sugeridos

### Funcionalidades
- [ ] Filtros por agente/equipe
- [ ] Busca por texto nas conversas
- [ ] Notificações em tempo real (WebSocket)
- [ ] Métricas de performance e SLA
- [ ] Exportação de relatórios

### Melhorias Técnicas
- [ ] Cache inteligente com TTL
- [ ] Paginação para grandes volumes
- [ ] Testes automatizados (Jest/Cypress)
- [ ] Docker para deployment
- [ ] CI/CD pipeline

### UX/UI
- [ ] Tema escuro
- [ ] Atalhos de teclado
- [ ] Arrastar múltiplas conversas
- [ ] Filtros visuais avançados
- [ ] Dashboard de métricas

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor:
1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

**Desenvolvido com ❤️ para melhorar a gestão de conversas no Chatwoot**