require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
async function test() {
  const { data: { user } } = await supabase.auth.getUser(); // need auth, but it's a script.
  // We can't easily auth as the user in a script without their token.
}
