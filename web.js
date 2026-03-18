require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});
const { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  EmbedBuilder 
} = require("discord.js");

client.once("ready", async () => {
  console.log("Bot ready!");

  const channel = await client.channels.fetch("1483601249466187877");

  const url = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify%20guilds%20guilds.join`;

  // 👇 Embed作成
  const embed = new EmbedBuilder()
  .setTitle("🔐 認証システム")
  .setDescription("下のボタンを押して認証してください")
  .setColor(0x5865F2)
  .setThumbnail("https://cdn.discordapp.com/attachments/1284639966042783817/1483876510602362972/logo.png");

  // 👇 ボタン
  const button = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("認証する")
      .setStyle(ButtonStyle.Link)
      .setURL(url)
  );

  await channel.send({
    embeds: [embed],
    components: [button]
  });
});
client.login(process.env.TOKEN);

// トップページ
app.get('/', (req, res) => {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}&response_type=code&scope=identify%20guilds%20guilds.join`;

  res.send("<h1>認証</h1><a href='" + url + "'>Discordでログイン</a>");
});

app.get('/callback', async (req, res) => {
  const code = req.query.code;

  try {
    const tokenRes = await axios.post('https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.REDIRECT_URI
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const access_token = tokenRes.data.access_token;

    const userRes = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: "Bearer " + access_token }
    });

    await axios.put(
      "https://discord.com/api/guilds/" + process.env.GUILD_ID + "/members/" + userRes.data.id,
      { access_token: access_token },
      {
        headers: {
          Authorization: "Bot " + process.env.TOKEN,
          "Content-Type": "application/json"
        }
      }
    );

    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    const member = await guild.members.fetch(userRes.data.id);

    await member.roles.add(process.env.ROLE_ID);

    res.send("認証成功！");
  } catch (err) {
    console.error(err);
    res.send("認証失敗");
  }
});

app.listen(3000, () => console.log("Server running"));