// telegram-bot.js

// ✅ Load environment variables from .env file
require('dotenv').config();

const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in .env file');
  console.error('Please add TELEGRAM_BOT_TOKEN=your_token_here to your .env file');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Telegram bot is running...');
console.log(`📡 App URL: ${appUrl}`);
console.log(`✅ Bot token loaded successfully`);

// Handle /start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || 'there';
  
  console.log(`👤 /start from: ${firstName} (Chat ID: ${chatId})`);
  
  bot.sendMessage(
    chatId,
    `👋 Welcome ${firstName}!\n\n` +
    `To receive your invoices via Telegram:\n\n` +
    `📱 Send your 10-digit mobile number\n` +
    `Example: 9876543210\n\n` +
    `⚠️ Your number must be registered in our store system.`
  );
});

// Handle /help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(
    chatId,
    `📚 **Help**\n\n` +
    `Commands:\n` +
    `/start - Start registration\n` +
    `/help - Show this help message\n` +
    `/status - Check registration status\n\n` +
    `To register, send your 10-digit mobile number.`,
    { parse_mode: 'Markdown' }
  );
});

// Handle /status command
bot.onText(/\/status/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(
    chatId,
    `ℹ️ Your Chat ID: \`${chatId}\`\n\n` +
    `If you've registered, you will receive invoices here automatically.`,
    { parse_mode: 'Markdown' }
  );
});

// Handle phone number messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const userName = msg.from?.first_name || 'Customer';

  // Skip if it's a command
  if (!text || text.startsWith('/')) {
    return;
  }

  // Check if message is a 10-digit phone number
  if (/^\d{10}$/.test(text)) {
    console.log(`📞 Registration attempt: ${text} from Chat ID: ${chatId}`);
    
    try {
      // Show processing message
      await bot.sendMessage(chatId, '⏳ Registering your number...');

      // Call your API to register this chat ID with the phone number
      const response = await fetch(`${appUrl}/api/telegram/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: text, 
          chatId: chatId.toString() 
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Registration successful: ${result.customer.name} (${text})`);
        
        await bot.sendMessage(
          chatId,
          `✅ **Registration Successful!**\n\n` +
          `👤 Name: ${result.customer.name}\n` +
          `📞 Phone: ${result.customer.phone}\n\n` +
          `You will now receive your invoices here automatically! 🎉\n\n` +
          `Future invoices will include:\n` +
          `• Invoice details\n` +
          `• Items purchased\n` +
          `• Prize notifications (if you win!)`,
          { parse_mode: 'Markdown' }
        );
      } else {
        console.log(`❌ Registration failed: ${text} - ${result.message}`);
        
        await bot.sendMessage(
          chatId,
          `❌ **Registration Failed**\n\n` +
          `${result.message}\n\n` +
          `Please ensure:\n` +
          `• You are a registered customer\n` +
          `• Phone number is correct (10 digits)\n` +
          `• You have made at least one purchase\n\n` +
          `Need help? Contact our store staff.`,
          { parse_mode: 'Markdown' }
        );
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      await bot.sendMessage(
        chatId,
        '❌ Technical error occurred. Please try again later or contact store staff.'
      );
    }
  } else if (/\d/.test(text)) {
    // Message contains numbers but not valid format
    await bot.sendMessage(
      chatId,
      '⚠️ Invalid phone number format.\n\n' +
      'Please send exactly 10 digits without spaces or special characters.\n\n' +
      'Example: 9876543210'
    );
  }
});

// Handle errors
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.code, error.message);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bot gracefully...');
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down bot gracefully...');
  bot.stopPolling();
  process.exit(0);
});