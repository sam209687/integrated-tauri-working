// src/actions/message.actions.ts

"use server";

import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import Message from "@/lib/models/message";
import { getUserModel } from "@/lib/models/user";
import { messageSchema } from "@/lib/schemas";
import { z } from "zod";
import { Types } from "mongoose";
import { auth } from "@/lib/auth";

const User = getUserModel();

// Define ActionResponse type for consistent returns
interface ActionResponse<T = void> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

// ✅ FIX: New type for the user data returned by getAllUsersForMessaging
type UserMessagingData = {
  _id: Types.ObjectId | string; // Mongoose ID becomes string after JSON.stringify
  name: string;
  role: 'admin' | 'cashier' | 'other'; // Assuming roles based on context
};


export const getConversations = async (userId: string) => {
  try {
    await connectToDatabase();
    const session = await auth();
    if (!session?.user) {
      throw new Error("Not authenticated");
    }

    const currentUserRole = session.user.role;
    const userObjectId = new Types.ObjectId(userId);

    type Recipient = {
      _id: Types.ObjectId;
      name?: string; 
      email: string;
      role: string;
      storeLocation?: string;
    };

    let potentialRecipients: Recipient[] = [];

    if (currentUserRole === 'admin') {
      potentialRecipients = await User.find(
        { role: 'cashier' },
        '_id name email role storeLocation'
      ).lean();
    } else if (currentUserRole === 'cashier') {
      const admins = await User.find(
        { role: 'admin' },
        '_id name email role storeLocation'
      ).lean();
      
      const otherCashiers = await User.find(
        { role: 'cashier', _id: { $ne: userObjectId } },
        '_id name email role storeLocation'
      ).lean();

      potentialRecipients = [...admins, ...otherCashiers];
    }

    const unreadCounts = await Message.aggregate([
      {
        $match: {
          recipient: userObjectId,
          read: false,
        },
      },
      {
        $group: {
          _id: '$sender',
          count: { $sum: 1 },
        },
      },
    ]);

    const unreadMap = new Map<string, number>();
    unreadCounts.forEach(item => {
      unreadMap.set(item._id.toString(), item.count);
    });

    const conversations = potentialRecipients.map(user => ({
      user: {
        ...user,
        name: user.name || user.email, 
      },
      unreadCount: unreadMap.get(user._id.toString()) || 0,
      lastMessageAt: null,
    }));

    return { success: true, data: JSON.parse(JSON.stringify(conversations)) };
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return { success: false, message: "Failed to fetch conversations." };
  }
};

// 🚀 FIX APPLIED: Changed return type from ActionResponse<any[]> to ActionResponse<UserMessagingData[]>
export const getAllUsersForMessaging = async (): Promise<ActionResponse<UserMessagingData[]>> => {
    try {
        await connectToDatabase();
        const users = await User.find({}, '_id name role').lean();
        // Cast the serialized data to the new specific type
        return { success: true, data: JSON.parse(JSON.stringify(users)) as UserMessagingData[] };
    } catch (error) {
        console.error("Failed to fetch all users:", error);
        return { success: false, message: "Failed to fetch users." };
    }
};

export const getMessages = async (userId: string, recipientId: string) => {
  try {
    await connectToDatabase();
    const userObjectId = new Types.ObjectId(userId);
    const recipientObjectId = new Types.ObjectId(recipientId);

    const messages = await Message.find({
      $or: [
        { sender: userObjectId, recipient: recipientObjectId },
        { sender: recipientObjectId, recipient: userObjectId },
      ],
    }).sort({ createdAt: 1 }).lean();

    await Message.updateMany(
      { sender: recipientObjectId, recipient: userObjectId, read: false },
      { $set: { read: true } }
    );

    return { success: true, data: JSON.parse(JSON.stringify(messages)) };
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return { success: false, message: "Failed to fetch messages." };
  }
};

export const createMessage = async (data: z.infer<typeof messageSchema>) => {
  try {
    const validatedData = messageSchema.parse(data);
    await connectToDatabase();

    const newMessage = new Message({
      ...validatedData,
      sender: new Types.ObjectId(validatedData.sender),
      recipient: new Types.ObjectId(validatedData.recipient),
    });
    await newMessage.save();

    revalidatePath("/admin/messages");
    revalidatePath("/cashier/message");

    return { success: true, data: JSON.parse(JSON.stringify(newMessage)), message: "Message sent successfully!" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, message: error.errors[0].message };
    }
    console.error("Failed to create message:", error);
    return { success: false, message: "Failed to send message." };
  }
};

export const getTotalUnreadMessages = async (userId: string) => {
  try {
    await connectToDatabase();
    const userObjectId = new Types.ObjectId(userId);
    const count = await Message.countDocuments({
      recipient: userObjectId,
      read: false,
    });
    return { success: true, count };
  } catch (error) {
    console.error("Failed to fetch unread message count:", error); 
    return { success: false, count: 0 };
  }
};