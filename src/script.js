// Configurações e variáveis globais
const API_BASE_URL = "/api/v1";
const API_BUILD_URL_TO_REDIRECT = "/build-url-to-redirect";
let apiToken = "";
let accountId = "";

// Elementos DOM
const loadDataBtn = document.getElementById("load-data");
const apiTokenInput = document.getElementById("api-token");
const accountIdInput = document.getElementById("account-id");
const toggleApiTokenBtn = document.getElementById("toggle-api-token");
const kanbanColumns = document.querySelectorAll(".kanban-column");
const modal = document.getElementById("conversation-modal");
const closeModalBtn = document.querySelector(".close");
const conversationDetails = document.getElementById("conversation-details");

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  // Verificar se há token e account ID salvos no localStorage
  const savedToken = localStorage.getItem("chatwoot_api_token");
  const savedAccountId = localStorage.getItem("chatwoot_account_id");

  if (savedToken) {
    apiTokenInput.value = savedToken;
    apiToken = savedToken;
  }

  if (savedAccountId) {
    accountIdInput.value = savedAccountId;
    accountId = savedAccountId;
  }

  // Inicializar Sortable.js para cada coluna
  kanbanColumns.forEach((column) => {
    const columnId = column.id;
    const itemsContainer = column.querySelector(".kanban-items");

    new Sortable(itemsContainer, {
      group: "kanban",
      animation: 150,
      ghostClass: "sortable-ghost",
      onEnd: function (evt) {
        const itemId = evt.item.dataset.id;
        const newStatus = evt.to.parentElement.id;

        if (itemId && newStatus) {
          updateConversationStatus(itemId, newStatus);
        }
      },
    });
  });

  // Event listeners
  loadDataBtn.addEventListener("click", loadConversations);
  closeModalBtn.addEventListener("click", () => (modal.style.display = "none"));
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // Event listener para o botão de toggle do token
  toggleApiTokenBtn.addEventListener("click", toggleApiTokenVisibility);
});

// Funções principais
async function loadConversations() {
  apiToken = apiTokenInput.value.trim();
  accountId = accountIdInput.value.trim();

  if (!apiToken || !accountId) {
    alert("Por favor, insira o token de API e o ID da conta.");
    return;
  }

  // Salvar no localStorage para uso futuro
  localStorage.setItem("chatwoot_api_token", apiToken);
  localStorage.setItem("chatwoot_account_id", accountId);

  try {
    // Limpar colunas existentes
    document.querySelectorAll(".kanban-items").forEach((column) => {
      column.innerHTML = "";
    });

    // Mostrar loading
    showLoading();

    // Buscar conversas da API
    const conversations = await fetchConversations();

    // console.log("Conversas recebidas:", conversations);

    // Verificar se conversations é um array
    if (!Array.isArray(conversations)) {
      throw new Error(
        "Formato de dados inválido: esperado um array de conversas"
      );
    }

    // Agrupar conversas por status
    const groupedConversations = groupConversationsByStatus(conversations);

    // console.log("Conversas agrupadas:", groupedConversations);

    // Renderizar conversas nas colunas
    renderConversations(groupedConversations);

    // Esconder loading
    hideLoading();
  } catch (error) {
    console.error("Erro ao carregar conversas:", error);
    hideLoading();
    alert(`Erro ao carregar conversas: ${error.message}`);
  }
}

function showLoading() {
  document.querySelectorAll(".kanban-items").forEach((column) => {
    column.innerHTML = '<div class="loading">Carregando...</div>';
  });
}

function hideLoading() {
  document.querySelectorAll(".loading").forEach((loading) => {
    loading.remove();
  });
}

async function fetchConversations() {
  // Lista de todos os status possíveis no Chatwoot
  const statuses = ["pending", "open", "resolved", "snoozed"];
  let allConversations = [];

  // Fazer uma requisição para cada status
  for (const status of statuses) {
    try {
      const url = `${API_BASE_URL}/accounts/${accountId}/conversations?status=${status}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          api_access_token: apiToken,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.warn(
          `Erro ao buscar conversas com status ${status}: ${response.status} ${response.statusText}`
        );
        continue; // Continua com o próximo status mesmo se um falhar
      }

      const data = await response.json();

      // Verificar se a estrutura contém data.payload (como no seu JSON)
      let conversations = [];
      if (data.data && data.data.payload) {
        conversations = data.data.payload;
      } else {
        conversations = data.data || data.payload || [];
      }

      console.log(
        `Conversas encontradas com status ${status}:`,
        conversations.length
      );

      // Adicionar as conversas à lista geral
      allConversations = allConversations.concat(conversations);
    } catch (error) {
      console.error(`Erro ao buscar conversas com status ${status}:`, error);
      // Continua com o próximo status mesmo se um falhar
    }
  }

  // console.log(`Total de conversas encontradas: ${allConversations.length}`);
  // console.log("Todas as conversas:", JSON.stringify(allConversations, null, 2));

  return allConversations;
}

function groupConversationsByStatus(conversations) {
  const grouped = {
    pending: [],
    open: [],
    resolved: [],
    snoozed: [],
  };

  conversations.forEach((conversation) => {
    const status = conversation.status;
    if (grouped[status]) {
      grouped[status].push(conversation);
    }
  });

  return grouped;
}

function renderConversations(groupedConversations) {
  // Atualizar contadores e renderizar itens para cada coluna
  Object.keys(groupedConversations).forEach((status) => {
    const column = document.getElementById(status);
    const itemsContainer = column.querySelector(".kanban-items");
    const counter = column.querySelector(".counter");
    const conversations = groupedConversations[status];

    // Atualizar contador
    counter.textContent = conversations.length;

    // Renderizar cada conversa
    conversations.forEach((conversation) => {
      const item = createConversationItem(conversation);
      itemsContainer.appendChild(item);
    });
  });
}

function createConversationItem(conversation) {
  const item = document.createElement("div");
  item.className = "kanban-item";
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

  const priority = conversation.priority;
  // let priority = "low";
  // if (hoursDiff > 24) {
  //   priority = "high";
  // } else if (hoursDiff > 6) {
  //   priority = "medium";
  // }

  // Formatar data
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(createdAt);

  // Obter última mensagem de forma mais segura
  let lastMessage = "Sem mensagens";
  if (
    conversation.messages &&
    Array.isArray(conversation.messages) &&
    conversation.messages.length > 0
  ) {
    const lastMsg = conversation.messages[conversation.messages.length - 1];
    lastMessage =
      lastMsg.content ||
      lastMsg.processed_message_content ||
      "Mensagem sem conteúdo";
  } else if (
    conversation.last_non_activity_message &&
    conversation.last_non_activity_message.content
  ) {
    lastMessage = conversation.last_non_activity_message.content;
  }

  // Truncar mensagem se for muito longa
  const truncatedMessage =
    lastMessage.length > 100
      ? lastMessage.substring(0, 100) + "..."
      : lastMessage;

  // Obter nome do remetente de forma mais robusta
  const senderName =
    conversation.meta?.sender?.name ||
    conversation.sender?.name ||
    `Cliente #${conversation.id}`;

  const calcPriority = (() => {
    if (priority) {
      const priorityOptions = {
        high: "Alta",
        medium: "Média",
        low: "Baixa",
      };
      const priorityDesc = priorityOptions[priority] || "";
      return `<span class="priority ${priority}">${priorityDesc}</span>`;
    }
    return "";
  })();

  item.innerHTML = `
    <h3>${senderName}</h3>
    <p>${truncatedMessage}</p>
    <div class="meta">
      <span>${formattedDate}</span>
      ${calcPriority}  
    </div>`;

  // Adicionar evento de clique para abrir modal com detalhes
  item.addEventListener("click", (e) => {
    // Evitar que o clique acione o drag and drop
    if (
      e.target.classList.contains("kanban-item") ||
      e.target.parentElement.classList.contains("kanban-item")
    ) {
      showConversationDetails(conversation);
    }
  });

  return item;
}

async function showConversationDetails(conversation) {
  const { id, account_id } = conversation;
  const url = await fetch(
    `${API_BUILD_URL_TO_REDIRECT}?accountId=${account_id}&conversationId=${id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const { url: urlChat } = await url.json();
  open(urlChat, "_blank");

  // console.log(process.env.BASE_URL, id, account_id);
  // try {
  //   // Buscar detalhes completos da conversa
  //   const fullConversation = await fetchConversationDetails(conversation.id);
  //   // Renderizar detalhes no modal
  //   renderConversationDetails(fullConversation);
  //   // Mostrar modal
  //   modal.style.display = "block";
  // } catch (error) {
  //   console.error("Erro ao buscar detalhes da conversa:", error);
  //   alert("Erro ao buscar detalhes da conversa.");
  // }
}

async function fetchConversationDetails(conversationId) {
  const url = `${API_BASE_URL}/accounts/${accountId}/conversations/${conversationId}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      api_access_token: apiToken,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

function renderConversationDetails(conversation) {
  conversationDetails.innerHTML = "";

  // Obter informações do cliente de forma mais robusta
  const sender = conversation.meta?.sender || conversation.sender || {};
  const clientName = sender.name || `Cliente #${conversation.id}`;
  const clientEmail = sender.email || "N/A";
  const clientPhone = sender.phone_number || "N/A";

  // Informações do cliente
  const clientInfo = document.createElement("div");
  clientInfo.className = "client-info";
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
  if (
    conversation.messages &&
    Array.isArray(conversation.messages) &&
    conversation.messages.length > 0
  ) {
    const messagesContainer = document.createElement("div");
    messagesContainer.className = "messages-container";

    conversation.messages.forEach((message) => {
      const messageEl = document.createElement("div");

      // Determinar tipo de mensagem de forma mais robusta
      const isIncoming =
        message.sender_type === "Contact" || message.sender_type === "User";
      const isBot = message.sender_type === "AgentBot";

      let messageClass = "message ";
      if (isIncoming) {
        messageClass += "incoming";
      } else if (isBot) {
        messageClass += "bot";
      } else {
        messageClass += "outgoing";
      }

      messageEl.className = messageClass;

      // Formatar timestamp corretamente
      let messageTime;
      if (message.created_at) {
        // Se created_at é timestamp Unix
        if (typeof message.created_at === "number") {
          messageTime = new Date(message.created_at * 1000);
        } else {
          messageTime = new Date(message.created_at);
        }
      } else {
        messageTime = new Date();
      }

      const formattedTime = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(messageTime);

      // Obter nome do remetente
      let senderName = "Desconhecido";
      if (isIncoming) {
        senderName = message.sender?.name || sender.name || "Cliente";
      } else if (isBot) {
        senderName = message.sender?.name || "Bot";
      } else {
        senderName = message.sender?.name || "Atendente";
      }

      // Obter conteúdo da mensagem
      const messageContent =
        message.content ||
        message.processed_message_content ||
        "Mensagem sem conteúdo";

      messageEl.innerHTML = `
                <div class="sender">${senderName}</div>
                <div class="content">${messageContent}</div>
                <div class="time">${formattedTime}</div>
            `;

      messagesContainer.appendChild(messageEl);
    });

    conversationDetails.appendChild(messagesContainer);
  } else {
    const noMessages = document.createElement("p");
    noMessages.textContent = "Não há mensagens nesta conversa.";
    conversationDetails.appendChild(noMessages);
  }
}

async function updateConversationStatus(conversationId, newStatus) {
  try {
    const url = `${API_BASE_URL}/accounts/${accountId}/conversations/${conversationId}/status`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        api_access_token: apiToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
    }

    // Atualizar contadores
    updateCounters();
  } catch (error) {
    console.error("Erro ao atualizar status da conversa:", error);
    alert("Erro ao atualizar status. A conversa será recarregada.");
    loadConversations();
  }
}

function updateCounters() {
  kanbanColumns.forEach((column) => {
    const itemsCount = column.querySelectorAll(".kanban-item").length;
    column.querySelector(".counter").textContent = itemsCount;
  });
}

function getStatusLabel(status) {
  const statusMap = {
    pending: "Pendente",
    open: "Em Aberto",
    resolved: "Resolvido",
    closed: "Fechado",
    snoozed: "Adiado",
  };

  return statusMap[status] || status;
}

// Função para alternar visibilidade do token de API
function toggleApiTokenVisibility() {
  const icon = toggleApiTokenBtn.querySelector('i');
  
  if (apiTokenInput.type === 'password') {
    apiTokenInput.type = 'text';
    icon.className = 'fas fa-eye-slash';
    toggleApiTokenBtn.title = 'Esconder Token';
  } else {
    apiTokenInput.type = 'password';
    icon.className = 'fas fa-eye';
    toggleApiTokenBtn.title = 'Mostrar Token';
  }
}

