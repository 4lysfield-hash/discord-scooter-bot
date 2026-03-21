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

const VALID_CHARACTERS = [
  "IceWitchEsdeath",
  "GwenProm",
  "PromRaven",
  "RavenSparrow",
  "Roman",
  "ConanGray",
  "Olivia",
  "ElevenCarrie",
  "ZatProm",
  "DarkPhoenixCosmic",
  "Y2KMadison",
  "InvisibleWomanBride",
  "ScarletWitchZombieHuman",
  "ZeZeZatanna",
  "GwenSunny",
  "DrStrangeClea",
  "SakuraPsylocke",    
  "GoldenRulerSabrina",
  "CivilAgathaLight",
  "RavenTrigon",
  "RavenBombshell",
];

const VALID_TITLES = [
  "iconic",
  "gnarly",
  "feathers",
  "fangs",
  "bombshell",
  "queenofdead",
  "prestigious"
];

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

function memberHasPermission(member) {
  if (!ALLOWED_ROLE_IDS.length) return true;
  return member.roles.cache.some(role => ALLOWED_ROLE_IDS.includes(role.id));
}

function normalizeText(text) {
  return String(text || "").trim().toLowerCase();
}

function findMatchingCharacters(query) {
  const q = normalizeText(query);
  if (!q) return [];

  return VALID_CHARACTERS.filter(name =>
    name.toLowerCase().includes(q)
  ).slice(0, 25);
}

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
    grantedByDiscordId,
    grantedAt: new Date().toISOString()
  };

console.log("grantScooter", {
  universeId: ROBLOX_UNIVERSE_ID,
  datastoreName: "PermanentScooter",
  entryKey: `scooter_${userId}`
});

  await axios.post(url, JSON.stringify(body), {
    headers: {
      "x-api-key": ROBLOX_OPEN_CLOUD_API_KEY,
      "Content-Type": "application/json"
    },
    params: {
      datastoreName: "PermanentScooter",
      scope: "global",
      entryKey: `scooter_${userId}`
    }
  });
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

async function grantCharacter(userId, characterNames, grantedByDiscordId) {
  const url = `https://apis.roblox.com/datastores/v1/universes/${ROBLOX_UNIVERSE_ID}/standard-datastores/datastore/entries/entry`;

  const existing = await getExistingCharacterGrants(userId);

  let grants = [];
  if (existing && Array.isArray(existing.characters)) {
    grants = existing.characters;
  }

console.log("grantCharacter", {
  universeId: ROBLOX_UNIVERSE_ID,
  datastoreName: "DiscordCharacterGrants",
  entryKey: `chars_${userId}`,
  characterName
});

  for (const characterName of characterNames) {
    if (!grants.includes(characterName)) {
      grants.push(characterName);
    }
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

async function getExistingCharacterRemovals(userId) {
  const url = `https://apis.roblox.com/datastores/v1/universes/${ROBLOX_UNIVERSE_ID}/standard-datastores/datastore/entries/entry`;

  try {
    const response = await axios.get(url, {
      headers: {
        "x-api-key": ROBLOX_OPEN_CLOUD_API_KEY
      },
      params: {
        datastoreName: "DiscordCharacterRemovals",
        scope: "global",
        entryKey: `removechars_${userId}`
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

async function removeCharacterGrant(userId, characterName, grantedByDiscordId) {
  const url = `https://apis.roblox.com/datastores/v1/universes/${ROBLOX_UNIVERSE_ID}/standard-datastores/datastore/entries/entry`;

  const existing = await getExistingCharacterRemovals(userId);

  let removals = [];
  if (existing && Array.isArray(existing.characters)) {
    removals = existing.characters;
  }

console.log("removeCharacterGrant", {
  universeId: ROBLOX_UNIVERSE_ID,
  datastoreName: "DiscordCharacterRemovals",
  entryKey: `removechars_${userId}`,
  characterName
});

  if (!removals.includes(characterName)) {
    removals.push(characterName);
  }

  const body = {
    characters: removals,
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
      datastoreName: "DiscordCharacterRemovals",
      scope: "global",
      entryKey: `removechars_${userId}`
    }
  });
}

function findMatchingTitles(query) {
  const q = normalizeText(query);
  if (!q) return [];

  return VALID_TITLES.filter(name =>
    name.toLowerCase().includes(q)
  );
}

async function getExistingTitleGrants(userId) {
  const url = `https://apis.roblox.com/datastores/v1/universes/${ROBLOX_UNIVERSE_ID}/standard-datastores/datastore/entries/entry`;

  try {
    const response = await axios.get(url, {
      headers: {
        "x-api-key": ROBLOX_OPEN_CLOUD_API_KEY
      },
      params: {
        datastoreName: "DiscordTitleGrants",
        scope: "global",
        entryKey: `titles_${userId}`
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

async function grantTitle(userId, titleName, grantedByDiscordId) {
  const url = `https://apis.roblox.com/datastores/v1/universes/${ROBLOX_UNIVERSE_ID}/standard-datastores/datastore/entries/entry`;

  const existing = await getExistingTitleGrants(userId);

  let grants = [];
  if (existing && Array.isArray(existing.titles)) {
    grants = existing.titles;
  }

console.log("grantTitle", {
  universeId: ROBLOX_UNIVERSE_ID,
  datastoreName: "DiscordTitleGrants",
  entryKey: `titles_${userId}`,
  titleName
});

  if (!grants.includes(titleName)) {
    grants.push(titleName);
  }

  const body = {
    titles: grants,
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
      datastoreName: "DiscordTitleGrants",
      scope: "global",
      entryKey: `titles_${userId}`
    }
  });
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

    const validCommands = [
      "ping",
      "character",
      "scooter",
      "givecharacter",
      "removecharacter",
      "givetitle"
    ];

    // Se não for um comando real, ignora totalmente
    if (!validCommands.includes(command)) {
      return;
    }

    if (!memberHasPermission(message.member)) {
      await message.reply("Você não tem permissão para usar esse comando.");
      return;
    }

    if (command === "ping") {
      await message.reply("Pong! Bot online.");
      return;
    }

    if (command === "character") {
      const query = args.join(" ");

      if (!query) {
        await message.reply("Use assim: `:character parteDoNome`");
        return;
      }

      const matches = findMatchingCharacters(query);

      if (!matches.length) {
        await message.reply(`Não achei nenhum personagem com \`${query}\`.`);
        return;
      }

      await message.reply(
        `Personagens encontrados para \`${query}\`:\n` +
        matches.map(name => `- ${name}`).join("\n")
      );
      return;
    }

    if (command === "scooter") {
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
      return;
    }

    if (command === "givecharacter") {
      const robloxUsername = args[0];
      const rawCharacters = args.slice(1).join(" ");

      if (!robloxUsername || !rawCharacters) {
        await message.reply(
          "Use assim: `:givecharacter nomedoplayerdoroblox personagem1,personagem2,personagem3`"
        );
        return;
      }

      const characterNames = rawCharacters
        .split(",")
        .map(name => name.trim())
        .filter(Boolean);

      if (!characterNames.length) {
        await message.reply("Você precisa informar pelo menos um personagem.");
        return;
      }

      const invalidCharacters = characterNames.filter(
        name => !VALID_CHARACTERS.includes(name)
      );

      if (invalidCharacters.length > 0) {
        let errorMessage = "Estes personagens são inválidos:\n";

        for (const invalid of invalidCharacters) {
          const suggestions = findMatchingCharacters(invalid);
          errorMessage += `\n- \`${invalid}\``;

          if (suggestions.length) {
            errorMessage += `\n  Talvez você quis dizer:\n${suggestions.map(name => `  • ${name}`).join("\n")}`;
          }
        }

        await message.reply(errorMessage);
        return;
      }

      const { userId, username } = await getRobloxUserIdFromUsername(robloxUsername);
      await grantCharacter(userId, characterNames, message.author.id);

      await message.reply(
        `Personagens concedidos para **${username}** (UserId: ${userId}):\n${characterNames.map(name => `- ${name}`).join("\n")}\n\nEles serão aplicados quando o player entrar no jogo.`
      );
      return;
    }

    if (command === "removecharacter") {
      const robloxUsername = args[0];
      const characterName = args[1];

      if (!robloxUsername || !characterName) {
        await message.reply("Use assim: `:removecharacter nomedoplayerdoroblox nomedopersonagem`");
        return;
      }

      if (!VALID_CHARACTERS.includes(characterName)) {
        const suggestions = findMatchingCharacters(characterName);
        const suggestionText = suggestions.length
          ? `\nTalvez você quis dizer:\n${suggestions.map(name => `- ${name}`).join("\n")}`
          : "";

        await message.reply(`Personagem inválido: \`${characterName}\`${suggestionText}`);
        return;
      }

      const { userId, username } = await getRobloxUserIdFromUsername(robloxUsername);
      await removeCharacterGrant(userId, characterName, message.author.id);

      await message.reply(
        `Remoção do personagem **${characterName}** marcada para **${username}** (UserId: ${userId}). Ela será aplicada quando o player entrar no jogo.`
      );
      return;
    }

    if (command === "givetitle") {
      const robloxUsername = args[0];
      const titleName = normalizeText(args[1]);

      if (!robloxUsername || !titleName) {
        await message.reply("Use assim: `:givetitle nomedouser nomedotitulo`");
        return;
      }

      if (!VALID_TITLES.includes(titleName)) {
        const suggestions = findMatchingTitles(titleName);
        const suggestionText = suggestions.length
          ? `\nTítulos válidos parecidos:\n${suggestions.map(name => `- ${name}`).join("\n")}`
          : `\nTítulos válidos:\n${VALID_TITLES.map(name => `- ${name}`).join("\n")}`;

        await message.reply(`Título inválido: \`${titleName}\`${suggestionText}`);
        return;
      }

      const { userId, username } = await getRobloxUserIdFromUsername(robloxUsername);
      await grantTitle(userId, titleName, message.author.id);

      await message.reply(
        `Título **${titleName}** concedido para **${username}** (UserId: ${userId}). Ele será aplicado quando o player entrar no jogo.`
      );
      return;
    }
  } catch (error) {
    console.error("Erro no comando:", error?.response?.data || error);

console.error("Erro completo Roblox:", JSON.stringify(error?.response?.data, null, 2));
console.error("Mensagem:", error?.message);

    const robloxError =
      error?.response?.data?.errors?.[0]?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "Erro desconhecido";

    await message.reply(`Não consegui completar o comando. Erro: ${robloxError}`);
  }
});

client.login(DISCORD_BOT_TOKEN);
