import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function createNotification(
    toUserId: string,
    fromUserId: string,
    type: string,
    message: string
  ) {
    const { error } = await supabase
      .from("notifications")
      .insert({
        to_user_id: toUserId,
        from_user_id: fromUserId,
        type,
        message,
      });
  
    if (error) {
      console.error(error);
    }
  }