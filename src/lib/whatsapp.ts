// // src/lib/whatsapp.ts

// const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
// const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
// const API_URL = process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v19.0";

// interface SendMessagePayload {
//   to: string; // Customer's mobile number
//   templateName: string; // Your approved template name (e.g., 'offer_launch')
//   components: {
//     type: 'body' | 'header'; // Where the variable is placed
//     parameters: { type: 'text'; text: string }[]; // List of variables
//   }[];
// }

// export async function sendTemplatedMessage({ to, templateName, components }: SendMessagePayload): Promise<{ success: boolean; message: string; }> {
//     if (!ACCESS_TOKEN || !PHONE_ID) {
//         console.error("WhatsApp API credentials are not configured.");
//         return { success: false, message: "Server-side WhatsApp credentials missing." };
//     }

//     const url = `${API_URL}/${PHONE_ID}/messages`;
    
//     // The mobile number must be prefixed with the country code (e.g., 919876543210)
//     const formattedTo = to.startsWith('91') ? to : `91${to}`; 

//     const payload = {
//         messaging_product: "whatsapp",
//         to: formattedTo,
//         type: "template",
//         template: {
//             name: templateName,
//             language: { code: "en_US" },
//             components: components,
//         },
//     };

//     try {
//         const response = await fetch(url, {
//             method: 'POST',
//             headers: {
//                 'Authorization': `Bearer ${ACCESS_TOKEN}`,
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(payload),
//         });

//         const data = await response.json();

//         if (response.ok && data.messages) {
//             return { success: true, message: "WhatsApp message sent successfully." };
//         } else {
//             console.error("WhatsApp API Error:", data);
//             return { success: false, message: data.error?.message || "Failed to send WhatsApp message." };
//         }
//     } catch (error) {
//         console.error("Network or Fetch Error:", error);
//         return { success: false, message: "A network error occurred while sending the message." };
//     }
// }