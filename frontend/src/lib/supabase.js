
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fzqihojvdfxtihkjfwrb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6cWlob2p2ZGZ4dGloa2pmd3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NTg3MDAsImV4cCI6MjA4NjUzNDcwMH0.AlPpdIAV35qV5NR_jkGUXHVc-ImKu25dGAwBiJQVP-U';

export const supabase = createClient(supabaseUrl, supabaseKey);
