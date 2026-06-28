const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

// ── Config ──────────────────────────────────────────────
const ROLE_ID = '1517798466904915978';

// Keywords to look for in the status
const STATUS_KEYWORDS = [
  '/wemove',
  'https://discord.gg/wemove',
  'discord.gg/wemove',
];

function statusHasKeyword(status) {
  if (!status) return false;
  const lower = status.toLowerCase();
  return STATUS_KEYWORDS.some(k => lower.includes(k.toLowerCase()));
}

// ── Ready ───────────────────────────────────────────────
client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`🎯 Watching for status keywords: ${STATUS_KEYWORDS.join(', ')}`);
  console.log(`🏷️  Role ID: ${ROLE_ID}`);
});

// ── Presence Update ─────────────────────────────────────
client.on('presenceUpdate', async (oldPresence, newPresence) => {
  try {
    const guild = newPresence?.guild;
    if (!guild) return;

    const member = await guild.members.fetch(newPresence.userId).catch(() => null);
    if (!member) return;

    const role = guild.roles.cache.get(ROLE_ID);
    if (!role) {
      console.warn(`⚠️  Role ${ROLE_ID} not found in ${guild.name}`);
      return;
    }

    // Get the custom status text
    const customStatus = newPresence?.activities?.find(a => a.type === 4)?.state || null;
    const hasKeyword = statusHasKeyword(customStatus);
    const hasRole = member.roles.cache.has(ROLE_ID);

    if (hasKeyword && !hasRole) {
      await member.roles.add(role);
      console.log(`✅ Gave role to ${member.user.tag} (status: "${customStatus}")`);
    } else if (!hasKeyword && hasRole) {
      await member.roles.remove(role);
      console.log(`❌ Removed role from ${member.user.tag} (status no longer matches)`);
    }
  } catch (err) {
    console.error('Error in presenceUpdate:', err);
  }
});

client.login(process.env.TOKEN);
