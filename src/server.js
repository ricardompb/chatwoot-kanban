const express = require("express");
const cors = require("cors");
const axios = require("axios");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do CORS
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Proxy para a API do Chatwoot
app.use("/api/v1", async (req, res) => {
  const apiToken = req.headers["api_access_token"];

  if (!apiToken) {
    return res.status(401).json({ error: "Token de API não fornecido" });
  }

  try {
    const chatwootUrl = `https://${process.env.BASE_URL}/api/v1${req.url}`;

    const config = {
      method: req.method,
      url: chatwootUrl,
      headers: {
        api_access_token: apiToken,
        "Content-Type": "application/json",
      },
    };

    if (["POST", "PUT", "PATCH"].includes(req.method)) {
      config.data = req.body;
    }

    const response = await axios(config);
    res.json(response.data);
  } catch (error) {
    console.error("Erro na requisição para o Chatwoot:", error.message);

    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }

    res.status(500).json({ error: "Erro ao processar a requisição" });
  }
});

// app.post('/api/v1/get-url-to-chat', (req, res) => {
//   const { accountId, conversationId } = req.body;
//   res.send(
//     `https://${process.env.BASE_URL}/app/accounts/${accountId}/conversations/${conversationId}`
//   );
// })

app.use("/build-url-to-redirect", async (req, res) => {
  const { accountId, conversationId } = req.query;
  res.json({ 
    url: `https://${process.env.BASE_URL}/app/accounts/${accountId}/conversations/${conversationId}`
  });
});


// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
