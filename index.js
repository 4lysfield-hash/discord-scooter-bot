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

async function grantScooter(userId, grantedByDiscordId) {
  const url = `https://apis.roblox.com/datastores/v1/universes/${ROBLOX_UNIVERSE_ID}/standard-datastores/datastore/entries/entry`;

  const body = {
    hasScooter: true,
    grantedByDiscord: true,
    grantedByDiscordId: grantedByDiscordId,
    grantedAt: new Date().toISOString()
  };

  await axios.post(url, JSON.stringify(body), {
    headers: {
      "x-api-key": ROBLOX_OPEN_CLOUD_API_KEY,
      "Content-Type": "application/json"
    },
    params: {
      datastoreName: DATASTORE_NAME,
      scope: DATASTORE_SCOPE,
      entryKey: `scooter_${userId}`
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
    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const command = (args.shift() || "").toLowerCase();

    if (command !== "scooter") return;

    if (!memberHasPermission(message.member)) {
      await message.reply("Você não tem permissão para usar esse comando.");
      return;
    }

    const robloxUsername = args[0];
    if (!robloxUsername) {
      await message.reply("Use assim: `:scooter nomedoroblox`");
      return;
    }

    const { userId, username } = await getRobloxUserIdFromUsername(robloxUsername);
    await grantScooter(userId, message.author.id);

    await message.reply(
      `Scooter concedida com sucesso para **${username}** (UserId: ${userId}). Ele vai receber \`HasScooter = true\` ao entrar no jogo.`
    );
  } catch (error) {
    console.error(error?.response?.data || error);

    const robloxError =
      error?.response?.data?.errors?.[0]?.message ||
      error?.message ||
      "Erro desconhecido";

    await message.reply(`Não consegui dar a scooter. Erro: ${robloxError}`);
  }
});

client.login(DISCORD_BOT_TOKEN);
