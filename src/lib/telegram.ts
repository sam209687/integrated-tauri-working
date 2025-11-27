export async function sendTelegram(chatId: string, msg: string) {
  return await fetch("/api/telegram/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatId, message: msg }),
  });
}
