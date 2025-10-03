# Chatwoot Kanban - Sistema de Gerenciamento de Conversas

## Descrição
Este é um sistema de interface Kanban para visualizar e gerenciar conversas do Chatwoot. O sistema permite organizar conversas por status (Pendente, Em Aberto, Resolvido, Fechado) usando uma interface drag-and-drop.

## Principais Correções Realizadas

### 1. Estrutura de Dados do Chatwoot
- **Problema**: O código original esperava uma estrutura `data` simples, mas o Chatwoot retorna `data.payload`
- **Solução**: Implementada detecção automática da estrutura de dados:
```javascript
if (data.data && data.data.payload) {
    return data.data.payload;
}
return data.data || data.payload || [];
```

### 2. Tratamento de Timestamps
- **Problema**: Timestamps Unix não eram convertidos corretamente para objetos Date
- **Solução**: Implementada conversão automática multiplicando por 1000:
```javascript
if (conversation.created_at) {
    createdAt = new Date(conversation.created_at * 1000);
}
```

### 3. Acesso Seguro a Propriedades
- **Problema**: Erros ao acessar propriedades aninhadas que poderiam ser `undefined`
- **Solução**: Implementado acesso seguro com fallbacks:
```javascript
const senderName = conversation.meta?.sender?.name || 
                  conversation.sender?.name || 
                  `Cliente #${conversation.id}`;
```

### 4. Tratamento de Mensagens
- **Problema**: Diferentes tipos de mensagens (Contact, AgentBot, User) não eram tratados adequadamente
- **Solução**: Implementada detecção de tipos de mensagem e estilos específicos:
```javascript
const isIncoming = message.sender_type === 'Contact' || message.sender_type === 'User';
const isBot = message.sender_type === 'AgentBot';
```

### 5. Validação de Dados
- **Problema**: Não havia validação se os dados recebidos eram um array válido
- **Solução**: Adicionada validação e mensagens de erro claras:
```javascript
if (!Array.isArray(conversations)) {
    throw new Error('Formato de dados inválido: esperado um array de conversas');
}
```

## Como Usar

### 1. Configuração
1. Insira seu **Token de API** do Chatwoot
2. Insira o **ID da Conta** do Chatwoot
3. Clique em "Carregar Dados" para buscar as conversas reais

### 2. Teste com Dados Simulados
- Clique no botão "Testar com Dados Simulados" para ver o sistema funcionando com dados de exemplo

### 3. Funcionalidades
- **Visualização Kanban**: Conversas organizadas por status
- **Drag & Drop**: Mova conversas entre colunas para alterar status
- **Detalhes da Conversa**: Clique em uma conversa para ver mensagens completas
- **Contadores**: Cada coluna mostra a quantidade de conversas
- **Priorização**: Cores diferentes baseadas no tempo de espera

## Estrutura de Arquivos

```
/
├── index.html          # Interface principal
├── script.js           # Lógica JavaScript corrigida
├── styles.css          # Estilos CSS melhorados
├── server.js           # Servidor Node.js (opcional)
├── package.json        # Dependências do projeto
└── README.md          # Esta documentação
```

## Tipos de Status Suportados

- **pending**: Conversas pendentes
- **open**: Conversas em aberto
- **resolved**: Conversas resolvidas
- **closed**: Conversas fechadas

## Tipos de Mensagem Suportados

- **Contact/User**: Mensagens do cliente (estilo azul claro)
- **AgentBot**: Mensagens do bot (estilo amarelo)
- **Agent**: Mensagens do atendente (estilo azul escuro)

## API do Chatwoot

### Endpoints Utilizados:
- `GET /api/v1/accounts/{account_id}/conversations` - Lista conversas
- `GET /api/v1/accounts/{account_id}/conversations/{id}` - Detalhes da conversa
- `POST /api/v1/accounts/{account_id}/conversations/{id}/status` - Atualiza status

### Headers Necessários:
```javascript
{
    'api_access_token': 'SEU_TOKEN_AQUI',
    'Content-Type': 'application/json'
}
```

## Melhorias Implementadas

1. **Interface Responsiva**: Funciona bem em desktop e mobile
2. **Loading States**: Indicadores visuais durante carregamento
3. **Tratamento de Erros**: Mensagens claras para debugging
4. **Dados de Teste**: Função para testar sem API real
5. **Persistência**: Token e Account ID salvos no localStorage
6. **Validação Robusta**: Verificações de integridade dos dados

## Debugging

O sistema inclui logs detalhados no console:
- Dados recebidos da API
- Conversas agrupadas por status
- Erros com stack trace completo

Para debugar, abra o Console do Navegador (F12) e observe as mensagens durante o carregamento.

## Próximos Passos Sugeridos

1. Implementar filtros por agente/equipe
2. Adicionar busca por texto nas conversas
3. Implementar notificações em tempo real
4. Adicionar métricas de performance
5. Implementar cache local para melhor performance