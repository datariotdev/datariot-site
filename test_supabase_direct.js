
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Service Role Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLS() {
    console.log('--- Testing Chat Creation with Service Role ---');

    const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({ type: 'direct' })
        .select()
        .single();

    if (chatError) {
        console.error('FAILED to create chat even with Service Role:', chatError);
        return;
    }

    console.log('SUCCESS: Created chat:', newChat.id);

    console.log('\n--- Testing Participant Addition ---');
    // Use a dummy UUID to avoid profile foreign key issues if needed, 
    // but let's try a real one from logs if available.
    // From logs: 7eb0e5c5-f4ed-4f0f-b092-0dedaf343b03
    const userId = '7eb0e5c5-f4ed-4f0f-b092-0dedaf343b03';

    const { error: partError } = await supabase
        .from('chat_participants')
        .insert({ chat_id: newChat.id, user_id: userId });

    if (partError) {
        console.error('FAILED to add participant:', partError);
    } else {
        console.log('SUCCESS: Added participant');
    }

    console.log('\n--- Cleaning up test data ---');
    await supabase.from('chats').delete().eq('id', newChat.id);
    console.log('Test data cleaned up.');
}

testRLS();
