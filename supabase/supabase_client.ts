import {createClient} from "@supabase/supabase-js"

const supabaseUrl = "https://tgcrwgarkhzogfwelrlb.supabase.co"

export const supabase = createClient(supabaseUrl,"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnY3J3Z2Fya2h6b2dmd2VscmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDEyNzYsImV4cCI6MjA2NTQxNzI3Nn0.1_pF68SSEd-nBsAI_soXT_o7MgDH8-ippW_cQL9fxR0")