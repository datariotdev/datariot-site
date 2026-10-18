const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        env[key] = value;
    }
});

async function test() {
    const supabase = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

    // check posts
    const { data: post, error: perr } = await supabase.from('posts').select('*').limit(1);
    if (perr) {
        console.error("Post error:", perr);
    } else {
        console.log("Post schema columns:", post && post[0] ? Object.keys(post[0]) : "No posts found");
    }
}
test();
