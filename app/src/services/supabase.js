import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function fetchReadings(limit = 50) {
  const { data, error } = await supabase
    .from('sensor_reading')  
    .select('id, device_id, co2, temperature, humidity, measured_at')
    .order('measured_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Erro ao consultar Supabase:', error)
    return []
  }
  
  return (data || []).map((item) => ({
    id: item.id,
    deviceId: item.device_id,
    data: item.measured_at,
    co2: item.co2,
    temperature: Number(item.temperature),
    humidity: Number(item.humidity),
  }))
}