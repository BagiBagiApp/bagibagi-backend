import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qefbqrncbeeynkrnfjfs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlZmJxcm5jYmVleW5rcm5mamZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTYyMDM0NDAsImV4cCI6MjAzMTc3OTQ0MH0.QsYlflL3PUf8mIESslJNgFE3daAn1SgjHum3j_5DAv8';
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
