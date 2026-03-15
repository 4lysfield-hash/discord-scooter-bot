const { Client, GatewayIntentBits } = require("discord.js");
const axios = require("axios");

const http = require("http");

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot online");
}).listen(PORT, () => {
  console.log(`Servidor HTTP ouvindo na porta ${PORT}`);
});

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const ROBLOX_OPEN_CLOUD_API_KEY = process.env.ROBLOX_OPEN_CLOUD_API_KEY;
const ROBLOX_UNIVERSE_ID = process.env.ROBLOX_UNIVERSE_ID;
const ALLOWED_ROLE_IDS = (process.env.ALLOWED_ROLE_IDS || "")
  .split(",")
  .map(x => x.trim())
  .filter(Boolean);

const PREFIX = ":";
const DATASTORE_NAME = "PermanentScooter";
const DATASTORE_SCOPE = "global";

if (!DISCORD_BOT_TOKEN) throw new Error("Falta DISCORD_BOT_TOKEN");
if (!ROBLOX_OPEN_CLOUD_API_KEY) throw new Error("Falta ROBLOX_OPEN_CLOUD_API_KEY");
if (!ROBLOX_UNIVERSE_ID) throw new Error("Falta ROBLOX_UNIVERSE_ID");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

async function getRobloxUserIdFromUsername(username) {
  const response = await axios.post(
    "https://users.roblox.com/v1/usernames/users",
    {
      usernames: [username],
      excludeBannedUsers: false
    },
    {
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  const users = response.data?.data || [];
  if (!users.length) {
    throw new Error("Usuário Roblox não encontrado.");
  }

  return {
    userId: users[0].id,
    username: users[0].name
  };
}

console.log({
  universeId: ROBLOX_UNIVERSE_ID,
  datastoreName: "PermanentScooter",
  entryKey: `scooter_${userId}`
});

const crypto = require("crypto");

async function grantScooter(userId, grantedByDiscordId) {
  const url = `https://apis.roblox.com/datastores/v1/universes/${ROBLOX_UNIVERSE_ID}/standard-datastores/datastore/entries/entry`;

  const body = JSON.stringify({
    hasScooter: true,
    grantedByDiscord: true,
    grantedByDiscordId: grantedByDiscordId,
    grantedAt: new Date().toISOString()
  });

  const contentMd5 = crypto.createHash("md5").update(body).digest("base64");

  const response = await axios.post(url, body, {
    params: {
      datastoreName: "PermanentScooter",
      scope: "global",
      entryKey: `scooter_${userId}`
    },
    headers: {
      "x-api-key": ROBLOX_OPEN_CLOUD_API_KEY,
      "content-type": "application/json",
      "content-md5": contentMd5
    }
  });

  return response.data;
}

async function getExistingCharacterGrants(userId) {
  const url = `https://apis.roblox.com/datastores/v1/universes/${ROBLOX_UNIVERSE_ID}/standard-datastores/datastore/entries/entry`;

  try {
    const response = await axios.get(url, {
      headers: {
        "x-api-key": ROBLOX_OPEN_CLOUD_API_KEY
      },
      params: {
        datastoreName: "DiscordCharacterGrants",
        scope: "global",
        entryKey: `chars_${userId}`
      }
    });

    return response.data || null;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw error;
  }
}

async function grantCharacter(userId, characterName, grantedByDiscordId) {
  const url = `https://apis.roblox.com/datastores/v1/universes/${ROBLOX_UNIVERSE_ID}/standard-datastores/datastore/entries/entry`;

  const existing = await getExistingCharacterGrants(userId);

  let grants = [];
  if (existing && Array.isArray(existing.characters)) {
    grants = existing.characters;
  }

  if (!grants.includes(characterName)) {
    grants.push(characterName);
  }

  const body = {
    characters: grants,
    grantedByDiscord: true,
    grantedByDiscordId,
    grantedAt: new Date().toISOString()
  };

  await axios.post(url, JSON.stringify(body), {
    headers: {
      "x-api-key": ROBLOX_OPEN_CLOUD_API_KEY,
      "Content-Type": "application/json"
    },
    params: {
      datastoreName: "DiscordCharacterGrants",
      scope: "global",
      entryKey: `chars_${userId}`
    }
  });
}

function memberHasPermission(member) {
  if (!ALLOWED_ROLE_IDS.length) return true;
  return member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
}

client.once("clientReady", () => {
  console.log(`Bot online como ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  try {
    console.log("Mensagem recebida:", message.content);

    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const command = (args.shift() || "").toLowerCase();

    console.log("Comando detectado:", command, "Args:", args);

    if (!memberHasPermission(message.member)) {
      await message.reply("Você não tem permissão para usar esse comando.");
      return;
    }

    if (command === "scooter") {
      const robloxUsername = args[0];

      if (!robloxUsername) {
        await message.reply("Use assim: `:scooter nomedoroblox`");
        return;
      }

      const { userId, username } = await getRobloxUserIdFromUsername(robloxUsername);
      console.log("Scooter para:", username, userId);

      await grantScooter(userId, message.author.id);

      await message.reply(
        `Scooter concedida com sucesso para **${username}** (UserId: ${userId}). Ele vai receber \`HasScooter = true\` ao entrar no jogo.`
      );
      return;
    }

    if (command === "givecharacter") {
      const robloxUsername = args[0];
      const characterName = args[1];

      console.log("givecharacter chamado com:", robloxUsername, characterName);

      if (!robloxUsername || !characterName) {
        await message.reply("Use assim: `:givecharacter nomedoplayerdoroblox nomedopersonagem`");
        return;
      }

      const { userId, username } = await getRobloxUserIdFromUsername(robloxUsername);
      console.log("Jogador encontrado:", username, userId);

      await grantCharacter(userId, characterName, message.author.id);
      console.log("grantCharacter executado com sucesso");

      await message.reply(
        `Personagem **${characterName}** concedido para **${username}** (UserId: ${userId}). Ele vai receber ao entrar no jogo.`
      );
      return;
    }

    console.log("Comando não reconhecido:", command);
  } catch (error) {
    console.error("Erro no comando:", error?.response?.data || error);

    const robloxError =
      error?.response?.data?.errors?.[0]?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Erro desconhecido";

    await message.reply(`Não consegui completar o comando. Erro: ${robloxError}`);
  }
});

client.login(DISCORD_BOT_TOKEN);
