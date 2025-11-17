// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import mongoose from "mongoose";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Define the type for a cleaned MongoDB document
type MongooseDoc = mongoose.Document;
type CleanedDoc<T> = Omit<T, keyof MongooseDoc> & { _id: string };

// Define the return type based on the input type T
type FormatReturnType<T> = 
  T extends (infer U)[] ? CleanedDoc<U>[] : 
  T extends MongooseDoc ? CleanedDoc<T> : 
  T;

export const formatMongoData = <T extends MongooseDoc | T[] | null | undefined>(
  data: T
): FormatReturnType<T> => {
  if (!data) {
    return data as FormatReturnType<T>;
  }

  // 💡 FIX: Replaced 'any' with 'unknown' for safer typing
  const processObject = (item: MongooseDoc | unknown): CleanedDoc<MongooseDoc> | unknown => {
    // 💡 FIX: Simplified the type check to avoid using the 'Function' type explicitly.
    // We check if it is an object, has 'toObject', and 'toObject' is a function.
    if (item && typeof item === 'object' && 'toObject' in item && typeof (item as { toObject: unknown }).toObject === 'function') {
      const doc = item as MongooseDoc;
      
      // Convert it to a plain object with getters
      const obj = doc.toObject({ getters: true });
      
      // ✅ FIX: Explicitly cast doc._id to ObjectId to resolve 'unknown' error and call toString()
      obj._id = (doc._id as mongoose.Types.ObjectId).toString(); 
      
      return obj as CleanedDoc<MongooseDoc>;
    }
    return item;
  };

  if (Array.isArray(data)) {
    // Process each item in the array, asserting to the array return type
    return data.map(processObject) as FormatReturnType<T>;
  } else {
    // Process single object, asserting to the single object return type
    return processObject(data) as FormatReturnType<T>;
  }
};