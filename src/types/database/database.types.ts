/**
 * Supabase Database Types
 * 
 * This file should be generated from your Supabase project using:
 * npx supabase gen types typescript --project-id <your-project-id> > src/types/database/database.types.ts
 * 
 * For now, this provides placeholder types that match the PRD data models.
 * Replace with generated types after setting up Supabase project.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          subdomain: string | null
          status: string
          subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subdomain?: string | null
          status?: string
          subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          subdomain?: string | null
          status?: string
          subscription_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          tenant_id: string
          email: string
          name: string
          role: string
          status: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          tenant_id: string
          email: string
          name: string
          role?: string
          status?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          email?: string
          name?: string
          role?: string
          status?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tenant_records: {
        Row: {
          id: string
          tenant_id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          avatar: string | null
          status: 'active' | 'inactive' | 'pending'
          property_id: string | null
          unit_id: string | null
          unit_no: string | null
          move_in_date: string | null
          move_out_date: string | null
          emergency_contact: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          avatar?: string | null
          status?: 'active' | 'inactive' | 'pending'
          property_id?: string | null
          unit_id?: string | null
          unit_no?: string | null
          move_in_date?: string | null
          move_out_date?: string | null
          emergency_contact?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          avatar?: string | null
          status?: 'active' | 'inactive' | 'pending'
          property_id?: string | null
          unit_id?: string | null
          unit_no?: string | null
          move_in_date?: string | null
          move_out_date?: string | null
          emergency_contact?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          tenant_id: string
          name: string
          address: Json
          type: 'residential' | 'commercial' | 'mixed'
          ownership: 'own' | 'lease'
          total_units: number
          occupied_units: number
          status: 'active' | 'inactive' | 'maintenance'
          images: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          address: Json
          type?: 'residential' | 'commercial' | 'mixed'
          ownership?: 'own' | 'lease'
          total_units?: number
          occupied_units?: number
          status?: 'active' | 'inactive' | 'maintenance'
          images?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          address?: Json
          type?: 'residential' | 'commercial' | 'mixed'
          ownership?: 'own' | 'lease'
          total_units?: number
          occupied_units?: number
          status?: 'active' | 'inactive' | 'maintenance'
          images?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      units: {
        Row: {
          id: string
          tenant_id: string
          property_id: string
          unit_no: string
          type: string
          rent: number
          status: 'available' | 'occupied' | 'maintenance'
          tenant_record_id: string | null
          amenities: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          property_id: string
          unit_no: string
          type?: string
          rent?: number
          status?: 'available' | 'occupied' | 'maintenance'
          tenant_record_id?: string | null
          amenities?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          property_id?: string
          unit_no?: string
          type?: string
          rent?: number
          status?: 'available' | 'occupied' | 'maintenance'
          tenant_record_id?: string | null
          amenities?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      agreements: {
        Row: {
          id: string
          tenant_id: string
          agreement_number: string
          type: 'lease' | 'contract' | 'other'
          status: 'active' | 'expired' | 'pending' | 'terminated'
          tenant_record_id: string
          property_id: string
          unit_id: string
          start_date: string
          end_date: string
          signed_date: string | null
          amount: number
          rent: number
          security_deposit: number
          late_fee: number
          payment_frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time'
          terms: string | null
          conditions: string | null
          document_url: string | null
          attachments: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          agreement_number: string
          type?: 'lease' | 'contract' | 'other'
          status?: 'active' | 'expired' | 'pending' | 'terminated'
          tenant_record_id: string
          property_id: string
          unit_id: string
          start_date: string
          end_date: string
          signed_date?: string | null
          amount?: number
          rent?: number
          security_deposit?: number
          late_fee?: number
          payment_frequency?: 'monthly' | 'quarterly' | 'yearly' | 'one-time'
          terms?: string | null
          conditions?: string | null
          document_url?: string | null
          attachments?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          agreement_number?: string
          type?: 'lease' | 'contract' | 'other'
          status?: 'active' | 'expired' | 'pending' | 'terminated'
          tenant_record_id?: string
          property_id?: string
          unit_id?: string
          start_date?: string
          end_date?: string
          signed_date?: string | null
          amount?: number
          rent?: number
          security_deposit?: number
          late_fee?: number
          payment_frequency?: 'monthly' | 'quarterly' | 'yearly' | 'one-time'
          terms?: string | null
          conditions?: string | null
          document_url?: string | null
          attachments?: string[] | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          tenant_id: string
          invoice_number: string
          tenant_record_id: string
          property_id: string | null
          unit_id: string | null
          agreement_id: string | null
          type: 'rent' | 'utility' | 'maintenance' | 'other'
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          issue_date: string
          due_date: string
          paid_date: string | null
          items: Json
          subtotal: number
          tax: number
          discount: number
          total: number
          currency: string
          notes: string | null
          payment_method: string | null
          payment_gateway: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          invoice_number: string
          tenant_record_id: string
          property_id?: string | null
          unit_id?: string | null
          agreement_id?: string | null
          type?: 'rent' | 'utility' | 'maintenance' | 'other'
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          issue_date: string
          due_date: string
          paid_date?: string | null
          items?: Json
          subtotal?: number
          tax?: number
          discount?: number
          total?: number
          currency?: string
          notes?: string | null
          payment_method?: string | null
          payment_gateway?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          invoice_number?: string
          tenant_record_id?: string
          property_id?: string | null
          unit_id?: string | null
          agreement_id?: string | null
          type?: 'rent' | 'utility' | 'maintenance' | 'other'
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
          issue_date?: string
          due_date?: string
          paid_date?: string | null
          items?: Json
          subtotal?: number
          tax?: number
          discount?: number
          total?: number
          currency?: string
          notes?: string | null
          payment_method?: string | null
          payment_gateway?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          tenant_id: string
          invoice_id: string
          amount: number
          currency: string
          method: 'card' | 'bank_transfer' | 'mobile_money' | 'cash'
          gateway: string | null
          transaction_id: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          paid_at: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          invoice_id: string
          amount: number
          currency?: string
          method: 'card' | 'bank_transfer' | 'mobile_money' | 'cash'
          gateway?: string | null
          transaction_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          paid_at?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          invoice_id?: string
          amount?: number
          currency?: string
          method?: 'card' | 'bank_transfer' | 'mobile_money' | 'cash'
          gateway?: string | null
          transaction_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          paid_at?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          tenant_id: string
          category: string
          description: string
          amount: number
          currency: string
          date: string
          property_id: string | null
          unit_id: string | null
          vendor: string | null
          receipt_url: string | null
          tags: string[] | null
          status: 'pending' | 'approved' | 'rejected'
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          category: string
          description: string
          amount: number
          currency?: string
          date: string
          property_id?: string | null
          unit_id?: string | null
          vendor?: string | null
          receipt_url?: string | null
          tags?: string[] | null
          status?: 'pending' | 'approved' | 'rejected'
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          category?: string
          description?: string
          amount?: number
          currency?: string
          date?: string
          property_id?: string | null
          unit_id?: string | null
          vendor?: string | null
          receipt_url?: string | null
          tags?: string[] | null
          status?: 'pending' | 'approved' | 'rejected'
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      maintenance_requests: {
        Row: {
          id: string
          tenant_id: string
          request_number: string
          title: string
          description: string
          priority: 'low' | 'medium' | 'high' | 'urgent'
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          property_id: string
          unit_id: string | null
          tenant_record_id: string | null
          maintainer_id: string | null
          requested_by: string
          assigned_to: string | null
          scheduled_date: string | null
          completed_date: string | null
          images: string[] | null
          cost: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          request_number: string
          title: string
          description: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          property_id: string
          unit_id?: string | null
          tenant_record_id?: string | null
          maintainer_id?: string | null
          requested_by: string
          assigned_to?: string | null
          scheduled_date?: string | null
          completed_date?: string | null
          images?: string[] | null
          cost?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          request_number?: string
          title?: string
          description?: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          property_id?: string
          unit_id?: string | null
          tenant_record_id?: string | null
          maintainer_id?: string | null
          requested_by?: string
          assigned_to?: string | null
          scheduled_date?: string | null
          completed_date?: string | null
          images?: string[] | null
          cost?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          tenant_id: string
          company: Json | null
          payment: Json | null
          notification: Json | null
          recurring_invoice: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          company?: Json | null
          payment?: Json | null
          notification?: Json | null
          recurring_invoice?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          company?: Json | null
          payment?: Json | null
          notification?: Json | null
          recurring_invoice?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      set_tenant_context: {
        Args: { tenant_id: string }
        Returns: void
      }
      clear_tenant_context: {
        Args: Record<string, never>
        Returns: void
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

/**
 * Helper type for table rows.
 */
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

/**
 * Helper type for table inserts.
 */
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

/**
 * Helper type for table updates.
 */
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
