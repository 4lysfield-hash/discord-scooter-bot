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
  "AgathaCasual",
  "AgathaHarkness",
  "AgathaHarknessBad",
  "AgathaHarknessWW",
  "AgathaHarknessYouth",
  "AgathaLight",
  "AgathaLightCivil",
  "AgathaLightSecond",
  "Ajak",
  "AjakArianna",
  "ArcherSkeleton",
  "AtomEve",
  "AtomEveXmas",
  "Azula",
  "Bella",
  "BlackPanther",
  "BlackWidow",
  "BlackWidowGreen",
  "BlackWidowRed",
  "BlackWidowYellow",
  "Bloom",
  "BlueMarvel",
  "Bonnie",
  "BonnieCheerleader",
  "BumbleBee",
  "BumbleBev",
  "BumbleWasp",
  "Cyborg",
  "DanSpooky",
  "DarkBloom",
  "DarkJosie",
  "DarkPhoenix",
  "DarkWitchLorelei",
  "IronManVday",
  "DarkWitch",
  "DarkPhoenixArmor",
  "DarkPhoenixMaleficent",
  "DarkPhoenixRage",
  "DarkPhoenixXMen",
  "DarkPhoenixXmas",
  "DrFate",
  "DrFateZat",
  "DrStrange",
  "DrStrangeAncient",
  "DragonFairy",
  "Dust",
  "DustAnubis",
  "DustCleopatra",
  "Eleven",
  "EmmaFrost",
  "EmmaFrostIceQueen",
  "Evanora",
  "FirePrincess",
  "FreyaMikaelson",
  "GwenBen10",
  "HarryWizard",
  "Hera",
  "Hermoi",
  "HumanTorch",
  "HumanTorchFuture",
  "HumanTorchZuko",
  "IceWitch",
  "Ikaris",
  "InvisibleWoman",
  "InvisibleWomanFuture",
  "InvisibleWomanViolet",
  "InvisibleWomanXmas",
  "IronMan",
  "IronManSuperior",
  "JavelinSkeleton",
  "JohnLanter",
  "Klarion",
  "LaurenStrucker",
  "Loki",
  "LokiSkinVariant",
  "LokiVday",
  "LokiXmas",
  "MadelynePryor",
  "Magik",
  "MagikDevil",
  "MagikXMen",
  "Magneto",
  "MagnetoY2K",
  "MaleficentAscended",
  "Mantis",
  "Mera",
  "MoMFortuneTeller",
  "MomWanda",
  "MomWandaCorrupted",
  "MomWandaJennifer",
  "MomWandaProdigy",
  "MotherNature",
  "Musa",
  "NatureFairy",
  "PercyJackson",
  "Player067",
  "PoisonIvy",
  "Polaris",
  "PolarisTheGifted",
  "PolarisVday",
  "Powergirl",
  "Psylocke",
  "PsylockeSakura",
  "Raven",
  "RavenWardrobe",
  "RavenWardrobeY2K",
  "RavenXmas",
  "RobotDoll",
  "Sabrina",
  "SabrinaDaenerys",
  "SabrinaGoldenRuler",
  "SabrinaJohnnyFire",
  "ScarletFortuneTeller",
  "ScarletUltron",
  "ScarletWitch",
  "ScarletWitchValentine",
  "ScarletWitchVariant",
  "ScarletWitchVariantUltron",
  "ScarletWitchVariantValentine",
  "ScarletWitchXmas",
  "ScarletWitchZombie",
  "ScarletWitchZombieVariant",
  "Shiklah",
  "Solaris",
  "SolarisY2K",
  "Spidergwen",
  "Spiderman",
  "SpidermanXmas",
  "SquidManager",
  "SquidSoldier",
  "SquidWorker",
  "StarSapphire",
  "Stella",
  "StellaEnchantix",
  "Storm",
  "StormBride",
  "StormChristmas",
  "StormValentine",
  "StormXSkin",
  "Stormy",
  "StormyNickiX",
  "SunnyGwen",
  "Supergirl",
  "SupergirlBreached",
  "SupergirlUpgraded",
  "SupergirlXmas",
  "Superman",
  "SupermanBizarre",
  "SupermanInjustice",
  "SylvieX",
  "Sypha",
  "SyphaNomad",
  "SyphaXmas",
  "TechFairy",
  "Tevin",
  "Thor",
  "ThorJaneFoster",
  "ThorZeus",
  "TrinityY2KBlue",
  "TrinityY2KGrey",
  "TrinityY2KPink",
  "Ultron",
  "VariantFortuneTeller",
  "Venom",
  "WandaVision",
  "WandaVisionWardrobe",
  "WandaVisionWardrobeVariant",
  "WaterFairy",
  "WaterMaster",
  "Wednesday",
  "WednesdayMadison",
  "WhiteRaven",
  "Zatanna",
  "ZatannaGlinda",
  "ZatannaJustice",
  "ZatannaXmas",
  "ZatannaZeZe",
  "DarkPhoenixSinister",
  "DarkWitchSlayer",
  "DarkWitchY2K"
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
      const characterName = args[1];

      if (!robloxUsername || !characterName) {
        await message.reply("Use assim: `:givecharacter nomedoplayerdoroblox nomedopersonagem`");
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
      await grantCharacter(userId, characterName, message.author.id);

      await message.reply(
        `Personagem **${characterName}** concedido para **${username}** (UserId: ${userId}). Ele vai receber ao entrar no jogo.`
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
