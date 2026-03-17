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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          agent: string
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          messages: Json
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          messages?: Json
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          messages?: Json
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_generations: {
        Row: {
          agent: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          input: Json | null
          model: string | null
          output: string | null
          prompt_hash: string | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          agent?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          input?: Json | null
          model?: string | null
          output?: string | null
          prompt_hash?: string | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          agent?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          input?: Json | null
          model?: string | null
          output?: string | null
          prompt_hash?: string | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      client_portal_access: {
        Row: {
          created_at: string | null
          granted_by: string | null
          id: string
          organisation_id: string
          permissions: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          organisation_id: string
          permissions?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_by?: string | null
          id?: string
          organisation_id?: string
          permissions?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_access_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_primary: boolean | null
          job_title: string | null
          name: string
          notes: string | null
          organisation_id: string
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          job_title?: string | null
          name: string
          notes?: string | null
          organisation_id: string
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean | null
          job_title?: string | null
          name?: string
          notes?: string | null
          organisation_id?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          organisation_id: string
          parent_contract_id: string | null
          project_id: string | null
          start_date: string | null
          status: string | null
          title: string
          type: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          organisation_id: string
          parent_contract_id?: string | null
          project_id?: string | null
          start_date?: string | null
          status?: string | null
          title: string
          type: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          organisation_id?: string
          parent_contract_id?: string | null
          project_id?: string | null
          start_date?: string | null
          status?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_parent_contract_id_fkey"
            columns: ["parent_contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_workshops: {
        Row: {
          created_at: string | null
          default_agenda: Json | null
          id: string
          materials: Json | null
          neuro_phase: string | null
          partner_variants: Json | null
          service_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          default_agenda?: Json | null
          id?: string
          materials?: Json | null
          neuro_phase?: string | null
          partner_variants?: Json | null
          service_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          default_agenda?: Json | null
          id?: string
          materials?: Json | null
          neuro_phase?: string | null
          partner_variants?: Json | null
          service_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_workshops_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_states: {
        Row: {
          created_at: string | null
          date: string
          energy_level: number | null
          focus_level: number | null
          id: string
          mood: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          energy_level?: number | null
          focus_level?: number | null
          id?: string
          mood?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          energy_level?: number | null
          focus_level?: number | null
          id?: string
          mood?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          created_at: string | null
          delegate_count: number | null
          delivery_date: string | null
          duration_minutes: number | null
          facilitator_id: string | null
          feedback_form_id: string | null
          id: string
          kirkpatrick_level: number | null
          location: string | null
          neuro_phase: string | null
          notes: string | null
          organisation_id: string
          project_id: string
          satisfaction_score: number | null
          service_id: string | null
          sort_order: number | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          delegate_count?: number | null
          delivery_date?: string | null
          duration_minutes?: number | null
          facilitator_id?: string | null
          feedback_form_id?: string | null
          id?: string
          kirkpatrick_level?: number | null
          location?: string | null
          neuro_phase?: string | null
          notes?: string | null
          organisation_id: string
          project_id: string
          satisfaction_score?: number | null
          service_id?: string | null
          sort_order?: number | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          delegate_count?: number | null
          delivery_date?: string | null
          duration_minutes?: number | null
          facilitator_id?: string | null
          feedback_form_id?: string | null
          id?: string
          kirkpatrick_level?: number | null
          location?: string | null
          neuro_phase?: string | null
          notes?: string | null
          organisation_id?: string
          project_id?: string
          satisfaction_score?: number | null
          service_id?: string | null
          sort_order?: number | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_feedback_form"
            columns: ["feedback_form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          name: string
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          name: string
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          name?: string
          uploaded_by?: string | null
          url?: string
        }
        Relationships: []
      }
      emails: {
        Row: {
          created_at: string | null
          from_address: string | null
          gmail_id: string | null
          id: string
          organisation_id: string | null
          project_id: string | null
          received_at: string | null
          snippet: string | null
          subject: string | null
          thread_id: string | null
          to_addresses: string[] | null
        }
        Insert: {
          created_at?: string | null
          from_address?: string | null
          gmail_id?: string | null
          id?: string
          organisation_id?: string | null
          project_id?: string | null
          received_at?: string | null
          snippet?: string | null
          subject?: string | null
          thread_id?: string | null
          to_addresses?: string[] | null
        }
        Update: {
          created_at?: string | null
          from_address?: string | null
          gmail_id?: string | null
          id?: string
          organisation_id?: string | null
          project_id?: string | null
          received_at?: string | null
          snippet?: string | null
          subject?: string | null
          thread_id?: string | null
          to_addresses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "emails_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      form_responses: {
        Row: {
          data: Json
          form_id: string
          id: string
          kirkpatrick_level: number | null
          submitted_at: string | null
        }
        Insert: {
          data: Json
          form_id: string
          id?: string
          kirkpatrick_level?: number | null
          submitted_at?: string | null
        }
        Update: {
          data?: Json
          form_id?: string
          id?: string
          kirkpatrick_level?: number | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_responses_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          active: boolean | null
          created_at: string | null
          delivery_id: string | null
          description: string | null
          fields: Json
          id: string
          kirkpatrick_level: number | null
          project_id: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          delivery_id?: string | null
          description?: string | null
          fields?: Json
          id?: string
          kirkpatrick_level?: number | null
          project_id?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          delivery_id?: string | null
          description?: string | null
          fields?: Json
          id?: string
          kirkpatrick_level?: number | null
          project_id?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forms_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forms_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string | null
          delivery_id: string
          description: string
          id: string
          invoice_id: string
          quantity: number | null
          service_id: string
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          delivery_id: string
          description: string
          id?: string
          invoice_id: string
          quantity?: number | null
          service_id: string
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          delivery_id?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number | null
          service_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          contract_id: string | null
          created_at: string | null
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string | null
          organisation_id: string
          paid_date: string | null
          project_id: string
          quickbooks_id: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string | null
          vat_amount: number
          vat_rate: number | null
        }
        Insert: {
          contract_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string | null
          organisation_id: string
          paid_date?: string | null
          project_id: string
          quickbooks_id?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string | null
          vat_amount?: number
          vat_rate?: number | null
        }
        Update: {
          contract_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string | null
          organisation_id?: string
          paid_date?: string | null
          project_id?: string
          quickbooks_id?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string | null
          vat_amount?: number
          vat_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_articles: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          id: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      meetings: {
        Row: {
          attendees: Json | null
          contact_id: string | null
          created_at: string | null
          duration_minutes: number | null
          gcal_event_id: string | null
          id: string
          location: string | null
          meeting_type: string
          notes: string | null
          organisation_id: string | null
          project_id: string | null
          scheduled_at: string
          title: string
        }
        Insert: {
          attendees?: Json | null
          contact_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          gcal_event_id?: string | null
          id?: string
          location?: string | null
          meeting_type: string
          notes?: string | null
          organisation_id?: string | null
          project_id?: string | null
          scheduled_at: string
          title: string
        }
        Update: {
          attendees?: Json | null
          contact_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          gcal_event_id?: string | null
          id?: string
          location?: string | null
          meeting_type?: string
          notes?: string | null
          organisation_id?: string | null
          project_id?: string | null
          scheduled_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          project_id: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          project_id?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organisations: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          sector: string | null
          status: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          sector?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          sector?: string | null
          status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          commission_rate: number | null
          contact_email: string | null
          created_at: string | null
          id: string
          name: string
          type: string | null
        }
        Insert: {
          commission_rate?: number | null
          contact_email?: string | null
          created_at?: string | null
          id?: string
          name: string
          type?: string | null
        }
        Update: {
          commission_rate?: number | null
          contact_email?: string | null
          created_at?: string | null
          id?: string
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          role: string
          telegram_chat_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          role?: string
          telegram_chat_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          role?: string
          telegram_chat_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_updates: {
        Row: {
          ai_generated: boolean | null
          author_id: string
          content: string
          created_at: string | null
          id: string
          project_id: string
          status_snapshot: Json | null
        }
        Insert: {
          ai_generated?: boolean | null
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          project_id: string
          status_snapshot?: Json | null
        }
        Update: {
          ai_generated?: boolean | null
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          project_id?: string
          status_snapshot?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          created_at: string | null
          end_date: string | null
          external_ref: string | null
          id: string
          intended_neuro_phase: string | null
          name: string
          notes: string | null
          organisation_id: string
          owner_id: string | null
          start_date: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          created_at?: string | null
          end_date?: string | null
          external_ref?: string | null
          id?: string
          intended_neuro_phase?: string | null
          name: string
          notes?: string | null
          organisation_id: string
          owner_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          created_at?: string | null
          end_date?: string | null
          external_ref?: string | null
          id?: string
          intended_neuro_phase?: string | null
          name?: string
          notes?: string | null
          organisation_id?: string
          owner_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean | null
          category: string
          created_at: string | null
          default_duration_minutes: number | null
          default_neuro_phase: string | null
          description: string | null
          id: string
          name: string
          price: number
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string | null
          default_duration_minutes?: number | null
          default_neuro_phase?: string | null
          description?: string | null
          id?: string
          name: string
          price: number
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          default_duration_minutes?: number | null
          default_neuro_phase?: string | null
          description?: string | null
          id?: string
          name?: string
          price?: number
        }
        Relationships: []
      }
      session_agenda_items: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          materials: string | null
          method: string | null
          position: number
          session_id: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes: number
          id?: string
          materials?: string | null
          method?: string | null
          position: number
          session_id: string
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          materials?: string | null
          method?: string | null
          position?: number
          session_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_agenda_items_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          content_status: string | null
          created_at: string | null
          delivery_id: string
          duration_minutes: number | null
          facilitator_id: string | null
          id: string
          neuro_phase: string | null
          project_id: string
          session_date: string | null
          session_type: string | null
          sort_order: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content_status?: string | null
          created_at?: string | null
          delivery_id: string
          duration_minutes?: number | null
          facilitator_id?: string | null
          id?: string
          neuro_phase?: string | null
          project_id: string
          session_date?: string | null
          session_type?: string | null
          sort_order?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content_status?: string | null
          created_at?: string | null
          delivery_id?: string
          duration_minutes?: number | null
          facilitator_id?: string | null
          id?: string
          neuro_phase?: string | null
          project_id?: string
          session_date?: string | null
          session_type?: string | null
          sort_order?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assignee: string | null
          created_at: string | null
          delivery_id: string | null
          description: string | null
          due_date: string | null
          id: string
          parent_task_id: string | null
          priority: string | null
          project_id: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee?: string | null
          created_at?: string | null
          delivery_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string | null
          priority?: string | null
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee?: string | null
          created_at?: string | null
          delivery_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string | null
          priority?: string | null
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_team: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "team" | "client"
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
  public: {
    Enums: {
      app_role: ["admin", "team", "client"],
    },
  },
} as const
