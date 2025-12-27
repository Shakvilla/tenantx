export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {

  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      agreements: {
        Row: {
          agreement_number: string
          amount: number
          attachments: string[] | null
          auto_renew: boolean | null
          conditions: string | null
          created_at: string
          currency: string | null
          document_url: string | null
          end_date: string
          expiry_date: string | null
          grace_period_days: number | null
          id: string
          late_fee: number | null
          late_fee_type: string | null
          metadata: Json | null
          payment_due_day: number | null
          payment_frequency: string
          property_id: string
          renewal_terms: string | null
          rent: number
          security_deposit: number | null
          signed_date: string | null
          special_clauses: string | null
          start_date: string
          status: string
          tenant_id: string
          tenant_record_id: string
          terms: string | null
          type: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          agreement_number: string
          amount?: number
          attachments?: string[] | null
          auto_renew?: boolean | null
          conditions?: string | null
          created_at?: string
          currency?: string | null
          document_url?: string | null
          end_date: string
          expiry_date?: string | null
          grace_period_days?: number | null
          id?: string
          late_fee?: number | null
          late_fee_type?: string | null
          metadata?: Json | null
          payment_due_day?: number | null
          payment_frequency?: string
          property_id: string
          renewal_terms?: string | null
          rent?: number
          security_deposit?: number | null
          signed_date?: string | null
          special_clauses?: string | null
          start_date: string
          status?: string
          tenant_id: string
          tenant_record_id: string
          terms?: string | null
          type?: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          agreement_number?: string
          amount?: number
          attachments?: string[] | null
          auto_renew?: boolean | null
          conditions?: string | null
          created_at?: string
          currency?: string | null
          document_url?: string | null
          end_date?: string
          expiry_date?: string | null
          grace_period_days?: number | null
          id?: string
          late_fee?: number | null
          late_fee_type?: string | null
          metadata?: Json | null
          payment_due_day?: number | null
          payment_frequency?: string
          property_id?: string
          renewal_terms?: string | null
          rent?: number
          security_deposit?: number | null
          signed_date?: string | null
          special_clauses?: string | null
          start_date?: string
          status?: string
          tenant_id?: string
          tenant_record_id?: string
          terms?: string | null
          type?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agreements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "occupancy_rates"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "agreements_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "agreements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_tenant_record_id_fkey"
            columns: ["tenant_record_id"]
            isOneToOne: false
            referencedRelation: "tenant_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      communications: {
        Row: {
          attachments: string[] | null
          channel: string | null
          content: string
          content_html: string | null
          created_at: string
          email_sent: boolean | null
          from_email: string | null
          from_name: string | null
          from_user_id: string
          id: string
          metadata: Json | null
          parent_id: string | null
          priority: string | null
          read_at: string | null
          sent_at: string | null
          sms_sent: boolean | null
          status: string
          subject: string
          tenant_id: string
          thread_id: string | null
          to_ids: string[] | null
          to_type: string
          type: string
          updated_at: string
        }
        Insert: {
          attachments?: string[] | null
          channel?: string | null
          content: string
          content_html?: string | null
          created_at?: string
          email_sent?: boolean | null
          from_email?: string | null
          from_name?: string | null
          from_user_id: string
          id?: string
          metadata?: Json | null
          parent_id?: string | null
          priority?: string | null
          read_at?: string | null
          sent_at?: string | null
          sms_sent?: boolean | null
          status?: string
          subject: string
          tenant_id: string
          thread_id?: string | null
          to_ids?: string[] | null
          to_type: string
          type?: string
          updated_at?: string
        }
        Update: {
          attachments?: string[] | null
          channel?: string | null
          content?: string
          content_html?: string | null
          created_at?: string
          email_sent?: boolean | null
          from_email?: string | null
          from_name?: string | null
          from_user_id?: string
          id?: string
          metadata?: Json | null
          parent_id?: string | null
          priority?: string | null
          read_at?: string | null
          sent_at?: string | null
          sms_sent?: boolean | null
          status?: string
          subject?: string
          tenant_id?: string
          thread_id?: string | null
          to_ids?: string[] | null
          to_type?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "communications_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "communications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communications_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "communications"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          expiry_date: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          metadata: Json | null
          mime_type: string | null
          name: string
          notes: string | null
          rejection_reason: string | null
          related_to: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          tags: string[] | null
          tenant_id: string
          type: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          name: string
          notes?: string | null
          rejection_reason?: string | null
          related_to?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tags?: string[] | null
          tenant_id: string
          type?: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          expiry_date?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          name?: string
          notes?: string | null
          rejection_reason?: string | null
          related_to?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          tags?: string[] | null
          tenant_id?: string
          type?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          metadata: Json | null
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          metadata?: Json | null
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          metadata?: Json | null
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "expense_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string
          category_id: string | null
          created_at: string
          currency: string | null
          date: string
          description: string
          id: string
          is_recurring: boolean | null
          metadata: Json | null
          property_id: string | null
          receipt_number: string | null
          receipt_url: string | null
          recurring_id: string | null
          rejection_reason: string | null
          status: string
          submitted_by: string | null
          tags: string[] | null
          tenant_id: string
          unit_id: string | null
          updated_at: string
          vendor: string | null
          vendor_contact: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category: string
          category_id?: string | null
          created_at?: string
          currency?: string | null
          date?: string
          description: string
          id?: string
          is_recurring?: boolean | null
          metadata?: Json | null
          property_id?: string | null
          receipt_number?: string | null
          receipt_url?: string | null
          recurring_id?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_by?: string | null
          tags?: string[] | null
          tenant_id: string
          unit_id?: string | null
          updated_at?: string
          vendor?: string | null
          vendor_contact?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string
          category_id?: string | null
          created_at?: string
          currency?: string | null
          date?: string
          description?: string
          id?: string
          is_recurring?: boolean | null
          metadata?: Json | null
          property_id?: string | null
          receipt_number?: string | null
          receipt_url?: string | null
          recurring_id?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_by?: string | null
          tags?: string[] | null
          tenant_id?: string
          unit_id?: string | null
          updated_at?: string
          vendor?: string | null
          vendor_contact?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "occupancy_rates"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "expenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          agreement_id: string | null
          amount_paid: number | null
          balance_due: number | null
          created_at: string
          currency: string | null
          discount: number | null
          discount_type: string | null
          due_date: string
          id: string
          internal_notes: string | null
          invoice_number: string
          issue_date: string
          items: Json
          metadata: Json | null
          notes: string | null
          paid_date: string | null
          payment_gateway: string | null
          payment_method: string | null
          property_id: string | null
          reminder_count: number | null
          reminder_sent: boolean | null
          reminder_sent_at: string | null
          status: string
          subtotal: number
          tax: number
          tax_rate: number | null
          tenant_id: string
          tenant_record_id: string
          total: number
          type: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          agreement_id?: string | null
          amount_paid?: number | null
          balance_due?: number | null
          created_at?: string
          currency?: string | null
          discount?: number | null
          discount_type?: string | null
          due_date: string
          id?: string
          internal_notes?: string | null
          invoice_number: string
          issue_date?: string
          items?: Json
          metadata?: Json | null
          notes?: string | null
          paid_date?: string | null
          payment_gateway?: string | null
          payment_method?: string | null
          property_id?: string | null
          reminder_count?: number | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          status?: string
          subtotal?: number
          tax?: number
          tax_rate?: number | null
          tenant_id: string
          tenant_record_id: string
          total?: number
          type?: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          agreement_id?: string | null
          amount_paid?: number | null
          balance_due?: number | null
          created_at?: string
          currency?: string | null
          discount?: number | null
          discount_type?: string | null
          due_date?: string
          id?: string
          internal_notes?: string | null
          invoice_number?: string
          issue_date?: string
          items?: Json
          metadata?: Json | null
          notes?: string | null
          paid_date?: string | null
          payment_gateway?: string | null
          payment_method?: string | null
          property_id?: string | null
          reminder_count?: number | null
          reminder_sent?: boolean | null
          reminder_sent_at?: string | null
          status?: string
          subtotal?: number
          tax?: number
          tax_rate?: number | null
          tenant_id?: string
          tenant_record_id?: string
          total?: number
          type?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "occupancy_rates"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "invoices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_record_id_fkey"
            columns: ["tenant_record_id"]
            isOneToOne: false
            referencedRelation: "tenant_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      maintainers: {
        Row: {
          address: Json | null
          company_name: string | null
          completed_jobs: number | null
          created_at: string
          currency: string | null
          email: string | null
          hourly_rate: number | null
          id: string
          license_number: string | null
          metadata: Json | null
          name: string
          notes: string | null
          phone: string
          rating: number | null
          specialization: string[] | null
          status: string
          tenant_id: string
          total_jobs: number | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          company_name?: string | null
          completed_jobs?: number | null
          created_at?: string
          currency?: string | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          license_number?: string | null
          metadata?: Json | null
          name: string
          notes?: string | null
          phone: string
          rating?: number | null
          specialization?: string[] | null
          status?: string
          tenant_id: string
          total_jobs?: number | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          company_name?: string | null
          completed_jobs?: number | null
          created_at?: string
          currency?: string | null
          email?: string | null
          hourly_rate?: number | null
          id?: string
          license_number?: string | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          phone?: string
          rating?: number | null
          specialization?: string[] | null
          status?: string
          tenant_id?: string
          total_jobs?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintainers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "maintainers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          actual_cost: number | null
          assigned_to: string | null
          attachments: string[] | null
          completed_by: string | null
          completed_date: string | null
          created_at: string
          currency: string | null
          description: string
          estimated_cost: number | null
          id: string
          images: string[] | null
          location_details: string | null
          maintainer_id: string | null
          metadata: Json | null
          notes: string | null
          priority: string
          property_id: string
          request_number: string
          requested_by: string
          resolution_notes: string | null
          scheduled_date: string | null
          scheduled_end_date: string | null
          status: string
          tenant_feedback: string | null
          tenant_id: string
          tenant_rating: number | null
          tenant_record_id: string | null
          title: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          assigned_to?: string | null
          attachments?: string[] | null
          completed_by?: string | null
          completed_date?: string | null
          created_at?: string
          currency?: string | null
          description: string
          estimated_cost?: number | null
          id?: string
          images?: string[] | null
          location_details?: string | null
          maintainer_id?: string | null
          metadata?: Json | null
          notes?: string | null
          priority?: string
          property_id: string
          request_number: string
          requested_by: string
          resolution_notes?: string | null
          scheduled_date?: string | null
          scheduled_end_date?: string | null
          status?: string
          tenant_feedback?: string | null
          tenant_id: string
          tenant_rating?: number | null
          tenant_record_id?: string | null
          title: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          assigned_to?: string | null
          attachments?: string[] | null
          completed_by?: string | null
          completed_date?: string | null
          created_at?: string
          currency?: string | null
          description?: string
          estimated_cost?: number | null
          id?: string
          images?: string[] | null
          location_details?: string | null
          maintainer_id?: string | null
          metadata?: Json | null
          notes?: string | null
          priority?: string
          property_id?: string
          request_number?: string
          requested_by?: string
          resolution_notes?: string | null
          scheduled_date?: string | null
          scheduled_end_date?: string | null
          status?: string
          tenant_feedback?: string | null
          tenant_id?: string
          tenant_rating?: number | null
          tenant_record_id?: string | null
          title?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_maintainer_id_fkey"
            columns: ["maintainer_id"]
            isOneToOne: false
            referencedRelation: "maintainers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "occupancy_rates"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "maintenance_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_tenant_record_id_fkey"
            columns: ["tenant_record_id"]
            isOneToOne: false
            referencedRelation: "tenant_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          gateway: string | null
          gateway_reference: string | null
          gateway_response: Json | null
          id: string
          invoice_id: string
          metadata: Json | null
          method: string
          notes: string | null
          paid_at: string | null
          refund_amount: number | null
          refund_reason: string | null
          refunded_at: string | null
          status: string
          tenant_id: string
          tenant_record_id: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          gateway?: string | null
          gateway_reference?: string | null
          gateway_response?: Json | null
          id?: string
          invoice_id: string
          metadata?: Json | null
          method: string
          notes?: string | null
          paid_at?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          status?: string
          tenant_id: string
          tenant_record_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          gateway?: string | null
          gateway_reference?: string | null
          gateway_response?: Json | null
          id?: string
          invoice_id?: string
          metadata?: Json | null
          method?: string
          notes?: string | null
          paid_at?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          status?: string
          tenant_id?: string
          tenant_record_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_record_id_fkey"
            columns: ["tenant_record_id"]
            isOneToOne: false
            referencedRelation: "tenant_records"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: Json
          amenities: string[] | null
          created_at: string
          currency: string | null
          current_value: number | null
          description: string | null
          documents: Json | null
          id: string
          images: string[] | null
          metadata: Json | null
          name: string
          occupied_units: number
          ownership: string
          purchase_price: number | null
          status: string
          tenant_id: string
          total_units: number
          type: string
          updated_at: string
        }
        Insert: {
          address: Json
          amenities?: string[] | null
          created_at?: string
          currency?: string | null
          current_value?: number | null
          description?: string | null
          documents?: Json | null
          id?: string
          images?: string[] | null
          metadata?: Json | null
          name: string
          occupied_units?: number
          ownership?: string
          purchase_price?: number | null
          status?: string
          tenant_id: string
          total_units?: number
          type?: string
          updated_at?: string
        }
        Update: {
          address?: Json
          amenities?: string[] | null
          created_at?: string
          currency?: string | null
          current_value?: number | null
          description?: string | null
          documents?: Json | null
          id?: string
          images?: string[] | null
          metadata?: Json | null
          name?: string
          occupied_units?: number
          ownership?: string
          purchase_price?: number | null
          status?: string
          tenant_id?: string
          total_units?: number
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "properties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          company: Json | null
          created_at: string
          features: Json | null
          id: string
          invoice: Json | null
          notification: Json | null
          payment: Json | null
          preferences: Json | null
          recurring_invoice: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          company?: Json | null
          created_at?: string
          features?: Json | null
          id?: string
          invoice?: Json | null
          notification?: Json | null
          payment?: Json | null
          preferences?: Json | null
          recurring_invoice?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          company?: Json | null
          created_at?: string
          features?: Json | null
          id?: string
          invoice?: Json | null
          notification?: Json | null
          payment?: Json | null
          preferences?: Json | null
          recurring_invoice?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string | null
          description: string | null
          display_order: number | null
          features: string[] | null
          id: string
          is_popular: boolean | null
          limits: Json
          metadata: Json | null
          name: string
          price_monthly: number
          price_quarterly: number | null
          price_yearly: number | null
          status: string
          tier: string
          trial_period_days: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          description?: string | null
          display_order?: number | null
          features?: string[] | null
          id?: string
          is_popular?: boolean | null
          limits?: Json
          metadata?: Json | null
          name: string
          price_monthly?: number
          price_quarterly?: number | null
          price_yearly?: number | null
          status?: string
          tier: string
          trial_period_days?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          description?: string | null
          display_order?: number | null
          features?: string[] | null
          id?: string
          is_popular?: boolean | null
          limits?: Json
          metadata?: Json | null
          name?: string
          price_monthly?: number
          price_quarterly?: number | null
          price_yearly?: number | null
          status?: string
          tier?: string
          trial_period_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          auto_renew: boolean | null
          billing_cycle: string
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          currency: string | null
          end_date: string
          id: string
          last_payment_id: string | null
          metadata: Json | null
          next_billing_date: string | null
          payment_method_id: string | null
          plan_id: string
          start_date: string
          status: string
          tenant_id: string
          trial_end_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          auto_renew?: boolean | null
          billing_cycle?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string | null
          end_date: string
          id?: string
          last_payment_id?: string | null
          metadata?: Json | null
          next_billing_date?: string | null
          payment_method_id?: string | null
          plan_id: string
          start_date?: string
          status?: string
          tenant_id: string
          trial_end_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          auto_renew?: boolean | null
          billing_cycle?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          currency?: string | null
          end_date?: string
          id?: string
          last_payment_id?: string | null
          metadata?: Json | null
          next_billing_date?: string | null
          payment_method_id?: string | null
          plan_id?: string
          start_date?: string
          status?: string
          tenant_id?: string
          trial_end_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_last_payment_id_fkey"
            columns: ["last_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_records: {
        Row: {
          avatar: string | null
          created_at: string
          email: string
          emergency_contact: Json | null
          first_name: string
          id: string
          last_name: string
          metadata: Json | null
          move_in_date: string | null
          move_out_date: string | null
          notes: string | null
          phone: string
          property_id: string | null
          status: string
          tags: string[] | null
          tenant_id: string
          unit_id: string | null
          unit_no: string | null
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          email: string
          emergency_contact?: Json | null
          first_name: string
          id?: string
          last_name: string
          metadata?: Json | null
          move_in_date?: string | null
          move_out_date?: string | null
          notes?: string | null
          phone: string
          property_id?: string | null
          status?: string
          tags?: string[] | null
          tenant_id: string
          unit_id?: string | null
          unit_no?: string | null
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          email?: string
          emergency_contact?: Json | null
          first_name?: string
          id?: string
          last_name?: string
          metadata?: Json | null
          move_in_date?: string | null
          move_out_date?: string | null
          notes?: string | null
          phone?: string
          property_id?: string | null
          status?: string
          tags?: string[] | null
          tenant_id?: string
          unit_id?: string | null
          unit_no?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_tenant_records_property"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "occupancy_rates"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "fk_tenant_records_property"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_tenant_records_unit"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "tenant_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          metadata: Json | null
          name: string
          plan: string | null
          settings: Json | null
          slug: string | null
          status: string
          subdomain: string | null
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          metadata?: Json | null
          name: string
          plan?: string | null
          settings?: Json | null
          slug?: string | null
          status?: string
          subdomain?: string | null
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          metadata?: Json | null
          name?: string
          plan?: string | null
          settings?: Json | null
          slug?: string | null
          status?: string
          subdomain?: string | null
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          amenities: string[] | null
          bathrooms: number | null
          bedrooms: number | null
          created_at: string
          currency: string | null
          deposit: number | null
          features: Json | null
          floor: number | null
          id: string
          images: string[] | null
          metadata: Json | null
          property_id: string
          rent: number
          size_sqft: number | null
          status: string
          tenant_id: string
          tenant_record_id: string | null
          type: string
          unit_no: string
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          currency?: string | null
          deposit?: number | null
          features?: Json | null
          floor?: number | null
          id?: string
          images?: string[] | null
          metadata?: Json | null
          property_id: string
          rent?: number
          size_sqft?: number | null
          status?: string
          tenant_id: string
          tenant_record_id?: string | null
          type?: string
          unit_no: string
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          created_at?: string
          currency?: string | null
          deposit?: number | null
          features?: Json | null
          floor?: number | null
          id?: string
          images?: string[] | null
          metadata?: Json | null
          property_id?: string
          rent?: number
          size_sqft?: number | null
          status?: string
          tenant_id?: string
          tenant_record_id?: string | null
          type?: string
          unit_no?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "occupancy_rates"
            referencedColumns: ["property_id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "units_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_tenant_record_id_fkey"
            columns: ["tenant_record_id"]
            isOneToOne: false
            referencedRelation: "tenant_records"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          last_login_at: string | null
          metadata: Json | null
          name: string
          phone: string | null
          role: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          last_login_at?: string | null
          metadata?: Json | null
          name: string
          phone?: string | null
          role?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          last_login_at?: string | null
          metadata?: Json | null
          name?: string
          phone?: string | null
          role?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      dashboard_stats: {
        Row: {
          active_agreements: number | null
          active_tenants: number | null
          available_units: number | null
          occupied_units: number | null
          overdue_invoices: number | null
          pending_maintenance: number | null
          revenue_this_month: number | null
          tenant_id: string | null
          total_outstanding: number | null
          total_properties: number | null
          total_units: number | null
        }
        Insert: {
          active_agreements?: never
          active_tenants?: never
          available_units?: never
          occupied_units?: never
          overdue_invoices?: never
          pending_maintenance?: never
          revenue_this_month?: never
          tenant_id?: string | null
          total_outstanding?: never
          total_properties?: never
          total_units?: never
        }
        Update: {
          active_agreements?: never
          active_tenants?: never
          available_units?: never
          occupied_units?: never
          overdue_invoices?: never
          pending_maintenance?: never
          revenue_this_month?: never
          tenant_id?: string | null
          total_outstanding?: never
          total_properties?: never
          total_units?: never
        }
        Relationships: []
      }
      occupancy_rates: {
        Row: {
          occupancy_rate: number | null
          occupied_units: number | null
          property_id: string | null
          property_name: string | null
          tenant_id: string | null
          total_units: number | null
        }
        Insert: {
          occupancy_rate?: never
          occupied_units?: number | null
          property_id?: string | null
          property_name?: string | null
          tenant_id?: string | null
          total_units?: number | null
        }
        Update: {
          occupancy_rate?: never
          occupied_units?: number | null
          property_id?: string | null
          property_name?: string | null
          tenant_id?: string | null
          total_units?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "properties_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_summary: {
        Row: {
          invoice_count: number | null
          month: string | null
          tenant_id: string | null
          total_billed: number | null
          total_collected: number | null
          total_outstanding: number | null
          type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "dashboard_stats"
            referencedColumns: ["tenant_id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      clear_tenant_context: { Args: never; Returns: undefined }
      generate_agreement_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_invoice_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_maintenance_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      get_current_tenant_id: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      set_tenant_context: { Args: { p_tenant_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
