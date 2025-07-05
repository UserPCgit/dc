const { Client, GatewayIntentBits, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

// Check for the key file
const keyFilePath = path.join(__dirname, 'silent-vent-458121-c6-ad325a0d972a.json');
if (!fs.existsSync(keyFilePath)) {
  console.error('Key file not found:', keyFilePath);
  process.exit(1); // Exit the program with an error
}

// Set up authentication
const auth = new google.auth.GoogleAuth({
  keyFile: keyFilePath,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets('v4'); // Initialize Google Sheets API

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Create buttons
const createButtons = (disabled = false) => {
  const infoButton = new ButtonBuilder()
    .setCustomId('get_user_info')
    .setLabel('Get Info')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(disabled); // Disable button if needed

  const sheetButton = new ButtonBuilder()
    .setURL('https://docs.google.com/spreadsheets/d/12jbeY4ENdD3-6RLe3Haek7aKK0uN5t5dvhj-U-bBeQM/edit?gid=0#gid=0')
    .setLabel('Go to Spreadsheet')
    .setStyle(ButtonStyle.Link);

  return new ActionRowBuilder().addComponents(infoButton, sheetButton);
};

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Handle the !myinfo command
client.on('messageCreate', async (message) => {
  if (message.content === '!myinfo') {
    await message.reply({
      content: `Hello ${message.author.username}! Use the buttons below to get user information or visit the spreadsheet.`,
      components: [createButtons()],
    });
  }

  // Handle user info requests
  if (message.content.startsWith('!infouser ')) {
    const query = message.content.split(' ')[1]; // Get the query (nickname, SSN, or ID)
    if (!query) {
      await message.reply({ content: 'Please specify a nickname, SSN, or user ID.', ephemeral: true });
      return;
    }

    try {
      const sheetsClient = await auth.getClient();
      const spreadsheetId = '12jbeY4ENdD3-6RLe3Haek7aKK0uN5t5dvhj-U-bBeQM'; // Your spreadsheet ID
      const range = 'Old Version!A:J'; // Ensure this is your sheet name and range

      const response = await sheets.spreadsheets.values.get({
        auth: sheetsClient,
        spreadsheetId,
        range,
      });

      const rows = response.data.values;
      console.log('Received rows:', rows); // Log received data

      if (rows && rows.length) {
        // Search for nickname, SSN, or Discord ID
        const userInfo = rows.find(row => 
          row[0].toLowerCase().includes(query.toLowerCase()) || // Search by nickname
          row[1] === query || // Search by SSN
          row[9] === query // Search by Discord ID
        );

        if (userInfo) {
          await message.reply({ 
            content: `User  Information:\nNickname: ${userInfo[0]}\nSSN: ${userInfo[1]}\nRank: ${userInfo[2]}\nAwards: ${userInfo[3]}\nPunishments: ${userInfo[4]}\nGovernment Support: ${userInfo[5]}\nNote: ${userInfo[6]}\nDate of Enter: ${userInfo[7]}\nDate of Retirement: ${userInfo[8]}`, 
            ephemeral: true // Make the message visible only to the user
          });
        } else {
          await message.reply({ content: 'User  not found.', ephemeral: true });
        }
      } else {
        await message.reply({ content: 'No data in the spreadsheet.', ephemeral: true });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
           await message.reply({ content: 'An error occurred while fetching data.', ephemeral: true });
    }
  }
});

// Handle button interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return; // Ignore everything except buttons

  if (interaction.customId === 'get_user_info') {
    const userId = interaction.user.id; // Get the ID of the user who clicked the button

    // Disable the button
    const row = createButtons(true); // Create buttons with the info button disabled

    await interaction.update({
      content: 'Fetching your information...',
      components: [row],
    });

    try {
      const sheetsClient = await auth.getClient();
      const spreadsheetId = '12jbeY4ENdD3-6RLe3Haek7aKK0uN5t5dvhj-U-bBeQM'; // Your spreadsheet ID
      const range = 'Old Version!A:J'; // Ensure this is your sheet name and range

      const response = await sheets.spreadsheets.values.get({
        auth: sheetsClient,
        spreadsheetId,
        range,
      });

      const rows = response.data.values;
      console.log('Received rows:', rows); // Log received data

      if (rows && rows.length) {
        // Search for the user by Discord ID
        const userInfo = rows.find(row => row[9] === userId); // Assuming Discord ID is in the 10th column (index 9)
        if (userInfo) {
          // Send user information as an ephemeral message
          await interaction.followUp({ 
            content: `User  Information:\nNickname: ${userInfo[0]}\nSSN: ${userInfo[1]}\nRank: ${userInfo[2]}\nAwards: ${userInfo[3]}\nPunishments: ${userInfo[4]}\nGovernment Support: ${userInfo[5]}\nNote: ${userInfo[6]}\nDate of Enter: ${userInfo[7]}\nDate of Retirement: ${userInfo[8]}`, 
            ephemeral: true // Make the message visible only to the user
          });
        } else {
          await interaction.followUp({ content: 'User  not found.', ephemeral: true });
        }
      } else {
        await interaction.followUp({ content: 'No data in the spreadsheet.', ephemeral: true });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      await interaction.followUp({ content: 'An error occurred while fetching data.', ephemeral: true });
    }

    // Re-enable the button after 30 seconds
    setTimeout(async () => {
      const reenabledRow = createButtons(); // Create buttons with the info button enabled
      await interaction.editReply({ content: 'You can now request your information again.', components: [reenabledRow] });
    }, 30000); // 30 seconds
  }
});


// Вход в Discord
client.login('MTE5MTQwMTEzMTM4MTg5NTI4OA.G7nUNw.kR_u35ojyCMMZfIFXQeyo7hi8V6ATWNShu3MX0'); // Замените на ваш токен бота
