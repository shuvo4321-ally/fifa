import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local manually to avoid needing the dotenv package
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function upload() {
  const filePath = "C:\\Users\\Shuvo\\Downloads\\fifa_wc26_prediction.json";
  console.log(`Reading from ${filePath}...`);
  
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error("Failed to read JSON file:", err.message);
    process.exit(1);
  }

  const teamsArray = Object.values(data.teams);
  console.log(`Found ${teamsArray.length} teams. Preparing to insert...`);

  const records = teamsArray.map(team => ({
    code: team.code,
    country: team.country,
    metrics: team.metrics,
    players: team.players
  }));

  console.log("Inserting records into Supabase...");
  const { data: inserted, error } = await supabase
    .from('fifa_wc26_prediction')
    .insert(records);

  if (error) {
    console.error("Error inserting data into Supabase:", error);
    
    // Check if it's an RLS error
    if (error.code === '42501') {
      console.error("\n[!] ROW LEVEL SECURITY (RLS) ERROR:");
      console.error("The anonymous key does not have permission to insert data into the 'fifa_wc26_prediction' table.");
      console.error("Please either disable RLS for this table or add an insert policy for anon/authenticated roles in your Supabase dashboard.");
    }
  } else {
    console.log("Successfully inserted data into Supabase!");
  }
}

upload();
