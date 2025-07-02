import { supabase } from '@/lib/store';

export async function fetchCategories() {
  return await supabase.from('categories').select('*').order('label');
}

export async function fetchPlayersByCategory(category: string) {
  return await supabase.from('t_players').select('*').eq('category', category);
}

export async function fetchPlayersByCategoryCode(categoryKey: string) {
  return await supabase.from('t_players').select('*').eq('category', categoryKey);
}

export async function fetchPoolsByCategoryId(selectedCategory: string) {
  return await supabase.from('pools').select('*, category:categories(*)').eq('category_id', selectedCategory);
}

export async function fetchTeams() {
  return await supabase.from('teams').select('*');
}

export async function fetchTeamPlayers() {
  return await supabase.from('team_players').select('*');
}

export async function fetchPlayersByCategoryAndStage(category: string, stage: string) {
  return await supabase.from('t_players').select('*').eq('category', category).eq('stage', stage);
} 