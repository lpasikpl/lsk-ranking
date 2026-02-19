export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          strava_id: number;
          username: string | null;
          firstname: string | null;
          lastname: string | null;
          profile_medium: string | null;
          profile: string | null;
          city: string | null;
          country: string | null;
          is_active: boolean;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          strava_id: number;
          username?: string | null;
          firstname?: string | null;
          lastname?: string | null;
          profile_medium?: string | null;
          profile?: string | null;
          city?: string | null;
          country?: string | null;
          is_active?: boolean;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          strava_id?: number;
          username?: string | null;
          firstname?: string | null;
          lastname?: string | null;
          profile_medium?: string | null;
          profile?: string | null;
          city?: string | null;
          country?: string | null;
          is_active?: boolean;
          is_admin?: boolean;
          updated_at?: string;
        };
      };
      strava_tokens: {
        Row: {
          id: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          access_token: string;
          refresh_token: string;
          expires_at: number;
          updated_at?: string;
        };
        Update: {
          access_token?: string;
          refresh_token?: string;
          expires_at?: number;
          updated_at?: string;
        };
      };
      lsk_activities: {
        Row: {
          id: string;
          strava_id: number;
          user_id: string;
          name: string | null;
          type: string;
          distance: number;
          moving_time: number;
          elapsed_time: number;
          total_elevation_gain: number;
          start_date: string;
          start_date_local: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          strava_id: number;
          user_id: string;
          name?: string | null;
          type: string;
          distance: number;
          moving_time: number;
          elapsed_time: number;
          total_elevation_gain: number;
          start_date: string;
          start_date_local: string;
          created_at?: string;
        };
        Update: {
          name?: string | null;
          type?: string;
          distance?: number;
          moving_time?: number;
          elapsed_time?: number;
          total_elevation_gain?: number;
        };
      };
      sync_logs: {
        Row: {
          id: string;
          user_id: string | null;
          status: string;
          activities_synced: number | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          status: string;
          activities_synced?: number | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: never;
      };
    };
  };
}

export type User = Database["public"]["Tables"]["users"]["Row"];
export type StravaToken = Database["public"]["Tables"]["strava_tokens"]["Row"];
export type Activity = Database["public"]["Tables"]["lsk_activities"]["Row"];
export type SyncLog = Database["public"]["Tables"]["sync_logs"]["Row"];

export interface RankingEntry {
  user_id: string;
  firstname: string | null;
  lastname: string | null;
  profile_medium: string | null;
  strava_id: number;
  country: string | null;
  total_distance: number;
  total_elevation: number;
  total_time: number;
  activity_count: number;
  avg_speed: number;
  longest_ride: number;
}
