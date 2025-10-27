// Configurações e variáveis globais
const API_BASE_URL = '/api/v1';
let apiToken = '';
let accountId = '';

// Elementos DOM
const loadDataBtn = document.getElementById('load-data');
const apiTokenInput = document.getElementById('api-token');
const accountIdInput = document.getElementById('account-id');
const kanbanColumns = document.querySelectorAll('.kanban-column');
const modal = document.getElementById('conversation-modal');
const closeModalBtn = document.querySelector('.close');
const conversationDetails = document.getElementById('conversation-details');

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se há token e account ID salvos no localStorage
    const savedToken = localStorage.getItem('chatwoot_api_token');
    const savedAccountId = localStorage.getItem('chatwoot_account_id');
    
    if (savedToken) {
        apiTokenInput.value = savedToken;
        apiToken = savedToken;
    }
    
    if (savedAccountId) {
        accountIdInput.value = savedAccountId;
        accountId = savedAccountId;
    }
    
    // Inicializar Sortable.js para cada coluna
    kanbanColumns.forEach(column => {
        const columnId = column.id;
        const itemsContainer = column.querySelector('.kanban-items');
        
        new Sortable(itemsContainer, {
            group: 'kanban',
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function(evt) {
                const itemId = evt.item.dataset.id;
                const newStatus = evt.to.parentElement.id;
                
                if (itemId && newStatus) {
                    updateConversationStatus(itemId, newStatus);
                }
            }
        });
    });
    
    // Event listeners
    loadDataBtn.addEventListener('click', loadConversations);
    closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
    
    // Adicionar botão para testar com dados simulados
    const testBtn = document.createElement('button');
    testBtn.textContent = 'Testar com Dados Simulados';
    testBtn.className = 'btn secondary';
    testBtn.addEventListener('click', loadTestData);
    document.querySelector('.header-controls').appendChild(testBtn);
});

// Funções principais
async function loadConversations() {
    apiToken = apiTokenInput.value.trim();
    accountId = accountIdInput.value.trim();
    
    if (!apiToken || !accountId) {
        alert('Por favor, insira o token de API e o ID da conta.');
        return;
    }
    
    // Salvar no localStorage para uso futuro
    localStorage.setItem('chatwoot_api_token', apiToken);
    localStorage.setItem('chatwoot_account_id', accountId);
    
    try {
        // Limpar colunas existentes
        document.querySelectorAll('.kanban-items').forEach(column => {
            column.innerHTML = '';
        });
        
        // Mostrar loading
        showLoading();
        
        // Buscar conversas da API
        const conversations = await fetchConversations();
        
        console.log('Conversas recebidas:', conversations);
        
        // Verificar se conversations é um array
        if (!Array.isArray(conversations)) {
            throw new Error('Formato de dados inválido: esperado um array de conversas');
        }
        
        // Agrupar conversas por status
        const groupedConversations = groupConversationsByStatus(conversations);
        
        console.log('Conversas agrupadas:', groupedConversations);
        
        // Renderizar conversas nas colunas
        renderConversations(groupedConversations);
        
        // Esconder loading
        hideLoading();
        
    } catch (error) {
        console.error('Erro ao carregar conversas:', error);
        hideLoading();
        alert(`Erro ao carregar conversas: ${error.message}`);
    }
}

function showLoading() {
    document.querySelectorAll('.kanban-items').forEach(column => {
        column.innerHTML = '<div class="loading">Carregando...</div>';
    });
}

function hideLoading() {
    document.querySelectorAll('.loading').forEach(loading => {
        loading.remove();
    });
}

async function fetchConversations() {
    const url = `${API_BASE_URL}/accounts/${accountId}/conversations`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'api_access_token': apiToken,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();

    console.log(JSON.stringify(data, null, 2));
    
    // Verificar se a estrutura contém data.payload (como no seu JSON)
    if (data.data && data.data.payload) {
        return data.data.payload;
    }
    // Fallback para estrutura simples
    return data.data || data.payload || [];
}

function groupConversationsByStatus(conversations) {
    const grouped = {
        pending: [],
        open: [],
        resolved: [],
        closed: []
    };
    
    conversations.forEach(conversation => {
        const status = conversation.status;
        if (grouped[status]) {
            grouped[status].push(conversation);
        }
    });
    
    return grouped;
}

function renderConversations(groupedConversations) {
    // Atualizar contadores e renderizar itens para cada coluna
    Object.keys(groupedConversations).forEach(status => {
        const column = document.getElementById(status);
        const itemsContainer = column.querySelector('.kanban-items');
        const counter = column.querySelector('.counter');
        const conversations = groupedConversations[status];
        
        // Atualizar contador
        counter.textContent = conversations.length;
        
        // Renderizar cada conversa
        conversations.forEach(conversation => {
            const item = createConversationItem(conversation);
            itemsContainer.appendChild(item);
        });
    });
}

function createConversationItem(conversation) {
    const item = document.createElement('div');
    item.className = 'kanban-item';
    item.dataset.id = conversation.id;
    
    // Verificar se existe created_at, senão usar timestamp ou data atual
    let createdAt;
    if (conversation.created_at) {
        createdAt = new Date(conversation.created_at * 1000); // Multiplicar por 1000 pois vem em timestamp Unix
    } else if (conversation.timestamp) {
        createdAt = new Date(conversation.timestamp * 1000);
    } else {
        createdAt = new Date();
    }
    
    // Determinar prioridade com base em algum critério (exemplo: tempo de espera)
    const now = new Date();
    const hoursDiff = Math.floor((now - createdAt) / (1000 * 60 * 60));
    
    let priority = 'low';
    if (hoursDiff > 24) {
        priority = 'high';
    } else if (hoursDiff > 6) {
        priority = 'medium';
    }
    
    // Formatar data
    const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(createdAt);
    
    // Obter última mensagem de forma mais segura
    let lastMessage = 'Sem mensagens';
    if (conversation.messages && Array.isArray(conversation.messages) && conversation.messages.length > 0) {
        const lastMsg = conversation.messages[conversation.messages.length - 1];
        lastMessage = lastMsg.content || lastMsg.processed_message_content || 'Mensagem sem conteúdo';
    } else if (conversation.last_non_activity_message && conversation.last_non_activity_message.content) {
        lastMessage = conversation.last_non_activity_message.content;
    }
    
    // Truncar mensagem se for muito longa
    const truncatedMessage = lastMessage.length > 100 
        ? lastMessage.substring(0, 100) + '...' 
        : lastMessage;
    
    // Obter nome do remetente de forma mais robusta
    const senderName = conversation.meta?.sender?.name || 
                      conversation.sender?.name || 
                      `Cliente #${conversation.id}`;
    
    item.innerHTML = `
        <h3>${senderName}</h3>
        <p>${truncatedMessage}</p>
        <div class="meta">
            <span>${formattedDate}</span>
            <span class="priority ${priority}">${priority === 'high' ? 'Alta' : priority === 'medium' ? 'Média' : 'Baixa'}</span>
        </div>
    `;
    
    // Adicionar evento de clique para abrir modal com detalhes
    item.addEventListener('click', (e) => {
        // Evitar que o clique acione o drag and drop
        if (e.target.classList.contains('kanban-item') || e.target.parentElement.classList.contains('kanban-item')) {
            showConversationDetails(conversation);
        }
    });
    
    return item;
}

async function showConversationDetails(conversation) {
    try {
        // Buscar detalhes completos da conversa
        const fullConversation = await fetchConversationDetails(conversation.id);
        
        // Renderizar detalhes no modal
        renderConversationDetails(fullConversation);
        
        // Mostrar modal
        modal.style.display = 'block';
    } catch (error) {
        console.error('Erro ao buscar detalhes da conversa:', error);
        alert('Erro ao buscar detalhes da conversa.');
    }
}

async function fetchConversationDetails(conversationId) {
    const url = `${API_BASE_URL}/accounts/${accountId}/conversations/${conversationId}`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'api_access_token': apiToken,
            'Content-Type': 'application/json'
        }
    });
    
    if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
}

function renderConversationDetails(conversation) {
    conversationDetails.innerHTML = '';
    
    // Obter informações do cliente de forma mais robusta
    const sender = conversation.meta?.sender || conversation.sender || {};
    const clientName = sender.name || `Cliente #${conversation.id}`;
    const clientEmail = sender.email || 'N/A';
    const clientPhone = sender.phone_number || 'N/A';
    
    // Informações do cliente
    const clientInfo = document.createElement('div');
    clientInfo.className = 'client-info';
    clientInfo.innerHTML = `
        <h3>Cliente: ${clientName}</h3>
        <p>Email: ${clientEmail}</p>
        <p>Telefone: ${clientPhone}</p>
        <p>Status: ${getStatusLabel(conversation.status)}</p>
        <p>ID da Conversa: ${conversation.id}</p>
        <hr>
    `;
    conversationDetails.appendChild(clientInfo);
    
    // Mensagens
    if (conversation.messages && Array.isArray(conversation.messages) && conversation.messages.length > 0) {
        const messagesContainer = document.createElement('div');
        messagesContainer.className = 'messages-container';
        
        conversation.messages.forEach(message => {
            const messageEl = document.createElement('div');
            
            // Determinar tipo de mensagem de forma mais robusta
            const isIncoming = message.sender_type === 'Contact' || message.sender_type === 'User';
            const isBot = message.sender_type === 'AgentBot';
            
            let messageClass = 'message ';
            if (isIncoming) {
                messageClass += 'incoming';
            } else if (isBot) {
                messageClass += 'bot';
            } else {
                messageClass += 'outgoing';
            }
            
            messageEl.className = messageClass;
            
            // Formatar timestamp corretamente
            let messageTime;
            if (message.created_at) {
                // Se created_at é timestamp Unix
                if (typeof message.created_at === 'number') {
                    messageTime = new Date(message.created_at * 1000);
                } else {
                    messageTime = new Date(message.created_at);
                }
            } else {
                messageTime = new Date();
            }
            
            const formattedTime = new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(messageTime);
            
            // Obter nome do remetente
            let senderName = 'Desconhecido';
            if (isIncoming) {
                senderName = message.sender?.name || sender.name || 'Cliente';
            } else if (isBot) {
                senderName = message.sender?.name || 'Bot';
            } else {
                senderName = message.sender?.name || 'Atendente';
            }
            
            // Obter conteúdo da mensagem
            const messageContent = message.content || 
                                 message.processed_message_content || 
                                 'Mensagem sem conteúdo';
            
            messageEl.innerHTML = `
                <div class="sender">${senderName}</div>
                <div class="content">${messageContent}</div>
                <div class="time">${formattedTime}</div>
            `;
            
            messagesContainer.appendChild(messageEl);
        });
        
        conversationDetails.appendChild(messagesContainer);
    } else {
        const noMessages = document.createElement('p');
        noMessages.textContent = 'Não há mensagens nesta conversa.';
        conversationDetails.appendChild(noMessages);
    }
}

async function updateConversationStatus(conversationId, newStatus) {
    try {
        const url = `${API_BASE_URL}/accounts/${accountId}/conversations/${conversationId}/status`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'api_access_token': apiToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        }
        
        // Atualizar contadores
        updateCounters();
    } catch (error) {
        console.error('Erro ao atualizar status da conversa:', error);
        alert('Erro ao atualizar status. A conversa será recarregada.');
        loadConversations();
    }
}

function updateCounters() {
    kanbanColumns.forEach(column => {
        const itemsCount = column.querySelectorAll('.kanban-item').length;
        column.querySelector('.counter').textContent = itemsCount;
    });
}

function getStatusLabel(status) {
    const statusMap = {
        'pending': 'Pendente',
        'open': 'Em Aberto',
        'resolved': 'Resolvido',
        'closed': 'Fechado'
    };
    
    return statusMap[status] || status;
}

// Função para testar com dados simulados baseados no JSON fornecido
function loadTestData() {
    const testData = {
        "data": {
            "meta": {
                "mine_count": 0,
                "assigned_count": 1,
                "unassigned_count": 1,
                "all_count": 2
            },
            "payload": [
                {
                    "meta": {
                        "sender": {
                            "additional_attributes": {
                                "avatar_url_hash": "b37549d5068def72b0bdb5e441937fb88727f51b45c7e8fd32207cd5c314d08c",
                                "last_avatar_sync_at": "2025-09-27T14:32:19Z"
                            },
                            "availability_status": "offline",
                            "email": null,
                            "id": 266834,
                            "name": "AZPost 6027",
                            "phone_number": "+553131576027",
                            "blocked": false,
                            "identifier": "116862201380899@lid",
                            "thumbnail": "https://chat.azpost.com.br/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBMmpRS0E9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--9cbb70fe01cd380d47b39de604cd75a1956dd1c0/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBTU0lJYW5CbkJqb0dSVlE2RTNKbGMybDZaVjkwYjE5bWFXeHNXd2RwQWZvdyIsImV4cCI6bnVsbCwicHVyIjoidmFyaWF0aW9uIn19--5599a8b35a3d95bafec1deb72b1d321fc80dfa85/442378694_1579891066296911_2168856446085271995_n.jpg",
                            "custom_attributes": {
                                "empresa": "teste"
                            },
                            "last_activity_at": 1758986898,
                            "created_at": 1754567203
                        },
                        "channel": "Channel::Whatsapp",
                        "assignee": {
                            "id": 1,
                            "account_id": 74,
                            "availability_status": "offline",
                            "auto_offline": true,
                            "confirmed": true,
                            "email": "contato@dlts.com.br",
                            "available_name": "System",
                            "name": "System",
                            "role": "administrator",
                            "thumbnail": "",
                            "custom_role_id": null
                        },
                        "team": {
                            "id": 84,
                            "name": "comercial",
                            "description": "orcamento, propostas, pos venda locação aluguel",
                            "allow_auto_assign": true,
                            "account_id": 74,
                            "is_member": false
                        },
                        "hmac_verified": false
                    },
                    "id": 226,
                    "messages": [
                        {
                            "id": 11259476,
                            "content": "aabbcc",
                            "account_id": 74,
                            "inbox_id": 559,
                            "conversation_id": 226,
                            "message_type": 0,
                            "created_at": 1758986898,
                            "updated_at": "2025-09-27T15:28:18.426Z",
                            "private": false,
                            "status": "sent",
                            "source_id": "wamid.HBgMNTUzMTMxNTc2MDI3FQIAEhgWM0VCMEM1MkIwOUM5OUY5MUI2MENGQQA=",
                            "content_type": "text",
                            "content_attributes": {},
                            "sender_type": "Contact",
                            "sender_id": 266834,
                            "external_source_ids": {},
                            "additional_attributes": {},
                            "processed_message_content": "aabbcc",
                            "sentiment": {},
                            "conversation": {
                                "assignee_id": 1,
                                "unread_count": 0,
                                "last_activity_at": 1758986898,
                                "contact_inbox": {
                                    "source_id": "553131576027"
                                }
                            },
                            "sender": {
                                "additional_attributes": {
                                    "avatar_url_hash": "b37549d5068def72b0bdb5e441937fb88727f51b45c7e8fd32207cd5c314d08c",
                                    "last_avatar_sync_at": "2025-09-27T14:32:19Z"
                                },
                                "custom_attributes": {
                                    "empresa": "teste"
                                },
                                "email": null,
                                "id": 266834,
                                "identifier": "116862201380899@lid",
                                "name": "AZPost 6027",
                                "phone_number": "+553131576027",
                                "thumbnail": "https://chat.azpost.com.br/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBMmpRS0E9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--9cbb70fe01cd380d47b39de604cd75a1956dd1c0/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBTU0lJYW5CbkJqb0dSVlE2RTNKbGMybDZaVjkwYjE5bWFXeHNXd2RwQWZvdyIsImV4cCI6bnVsbCwicHVyIjoidmFyaWF0aW9uIn19--5599a8b35a3d95bafec1deb72b1d321fc80dfa85/442378694_1579891066296911_2168856446085271995_n.jpg",
                                "blocked": false,
                                "type": "contact"
                            }
                        }
                    ],
                    "account_id": 74,
                    "uuid": "b927f8ed-63bc-438b-a413-7eafb84ec701",
                    "additional_attributes": {},
                    "agent_last_seen_at": 1759360160,
                    "assignee_last_seen_at": 1759360160,
                    "can_reply": false,
                    "contact_last_seen_at": 0,
                    "custom_attributes": {},
                    "inbox_id": 559,
                    "labels": [],
                    "muted": false,
                    "snoozed_until": null,
                    "status": "open",
                    "created_at": 1754567203,
                    "updated_at": 1758986898.5005481,
                    "timestamp": 1758986898,
                    "first_reply_created_at": 1758632349,
                    "unread_count": 0
                },
                {
                    "meta": {
                        "sender": {
                            "additional_attributes": {
                                "avatar_url_hash": "90161a6b34533852a6ce940915985301d1ab3c5934673a7418fdec22f2ed21d3",
                                "last_avatar_sync_at": "2025-10-01T23:15:43Z"
                            },
                            "availability_status": "offline",
                            "email": null,
                            "id": 244799,
                            "name": "Luciano Guimarães",
                            "phone_number": "+5531992376462",
                            "blocked": false,
                            "identifier": "87866541633788@lid",
                            "thumbnail": "https://chat.azpost.com.br/rails/active_storage/representations/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBOE5xS1E9PSIsImV4cCI6bnVsbCwicHVyIjoiYmxvYl9pZCJ9fQ==--95397df6f39de7c8b87759f50477a1d079484f1f/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaDdCem9MWm05eWJXRjBTU0lJYW5CbkJqb0dSVlE2RTNKbGMybDZaVjkwYjE5bWFXeHNXd2RwQWZvdyIsImV4cCI6bnVsbCwicHVyIjoidmFyaWF0aW9uIn19--5599a8b35a3d95bafec1deb72b1d321fc80dfa85/537697360_3250557931762211_7577457991443877921_n.jpg",
                            "custom_attributes": {
                                "skip_bot": true
                            },
                            "last_activity_at": 1759360542,
                            "created_at": 1752250807
                        },
                        "channel": "Channel::Whatsapp",
                        "team": {
                            "id": 84,
                            "name": "comercial",
                            "description": "orcamento, propostas, pos venda locação aluguel",
                            "allow_auto_assign": true,
                            "account_id": 74,
                            "is_member": false
                        },
                        "hmac_verified": false
                    },
                    "id": 221,
                    "messages": [
                        {
                            "id": 11259290,
                            "content": "Você foi transferido para o time comercial com sucesso! Se precisar de mais assistência, por favor, deixe-me saber. 😊",
                            "account_id": 74,
                            "inbox_id": 559,
                            "conversation_id": 221,
                            "message_type": 1,
                            "created_at": 1758986213,
                            "updated_at": "2025-09-27T15:16:55.736Z",
                            "private": false,
                            "status": "delivered",
                            "source_id": "wamid.HBgMNTUzMTkyMzc2NDYyFQIAERgSODNBNkIyNkZDMUFFMUNCNjE0AA==",
                            "content_type": "text",
                            "content_attributes": {},
                            "sender_type": "AgentBot",
                            "sender_id": 10,
                            "external_source_ids": {},
                            "additional_attributes": {},
                            "processed_message_content": "Você foi transferido para o time comercial com sucesso! Se precisar de mais assistência, por favor, deixe-me saber. 😊",
                            "sentiment": {},
                            "conversation": {
                                "assignee_id": null,
                                "unread_count": 0,
                                "last_activity_at": 1758986213,
                                "contact_inbox": {
                                    "source_id": "553192376462"
                                }
                            },
                            "sender": {
                                "id": 10,
                                "name": "Assistente Virtual",
                                "avatar_url": "",
                                "type": "agent_bot"
                            }
                        }
                    ],
                    "account_id": 74,
                    "uuid": "ed77507a-ca2d-46b5-a132-213a26c2e1dc",
                    "additional_attributes": {},
                    "agent_last_seen_at": 1758986214,
                    "assignee_last_seen_at": 0,
                    "can_reply": false,
                    "contact_last_seen_at": 0,
                    "custom_attributes": {},
                    "inbox_id": 559,
                    "labels": [],
                    "muted": false,
                    "snoozed_until": null,
                    "status": "open",
                    "created_at": 1752250807,
                    "updated_at": 1758986215.737872,
                    "timestamp": 1758986213,
                    "first_reply_created_at": 1752250811,
                    "unread_count": 0
                }
            ]
        }
    };
    
    try {
        // Limpar colunas existentes
        document.querySelectorAll('.kanban-items').forEach(column => {
            column.innerHTML = '';
        });
        
        // Processar dados de teste
        const conversations = testData.data.payload;
        console.log('Dados de teste carregados:', conversations);
        
        // Agrupar conversas por status
        const groupedConversations = groupConversationsByStatus(conversations);
        console.log('Conversas agrupadas (teste):', groupedConversations);
        
        // Renderizar conversas nas colunas
        renderConversations(groupedConversations);
        
        alert('Dados de teste carregados com sucesso!');
        
    } catch (error) {
        console.error('Erro ao carregar dados de teste:', error);
        alert(`Erro ao carregar dados de teste: ${error.message}`);
    }
}