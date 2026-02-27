import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://bvqolatfjpixvmskmglc.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2cW9sYXRmanBpeHZtc2ttZ2xjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MjUyNTEsImV4cCI6MjA4NjQwMTI1MX0.fVLTsBekWiYTMWvacmr2V-LSL3_4YsXjMzNviWQDYKQ";

export const supabaseStrava = createClient(supabaseUrl, supabaseAnonKey);
