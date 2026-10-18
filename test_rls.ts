require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Use the user ID from the logs
const userId = '7eb0e5c5-f4ed-4f0f-b092-0dedaf343b03';

async function testPolicies() {
    console.log("Testing chat_participants...");
    let res = await supabase.from('chat_participants').select('*').eq('user_id', userId).limit(1);
    console.log("chat_participants:", res.error ? res.error.message : "SUCCESS!");

    console.log("Testing messages...");
    res = await supabase.from('messages').select('*').eq('sender_id', userId).limit(1);
    console.log("messages:", res.error ? res.error.message : "SUCCESS!");

    console.log("Testing chats...");
    res = await supabase.from('chats').select('*').limit(1);
    console.log("chats:", res.error ? res.error.message : "SUCCESS!");
}

testPolicies();
