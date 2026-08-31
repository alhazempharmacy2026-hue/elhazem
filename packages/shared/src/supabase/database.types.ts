// وصف يدوي لسكيما قاعدة البيانات (بديل عن `supabase gen types` لحد ما يتوفر مشروع Supabase حقيقي).
// الأعمدة هنا لازم تفضل متطابقة مع supabase/migrations/*.sql. لاحظ إن `Relationships: []` مطلوب
// في كل جدول عشان يطابق النوع العام `GenericTable` بتاع @supabase/supabase-js — من غيره الـ client
// بيرجع أنواع `never` غريبة على insert/update/rpc.

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          role: 'customer' | 'pharmacist' | 'admin' | 'courier'
          expo_push_token: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
        Relationships: []
      }
      addresses: {
        Row: {
          id: string
          customer_id: string
          label: string
          governorate: string
          city: string
          street: string
          building: string
          floor: string | null
          apartment: string | null
          landmark: string | null
          lat: number | null
          lng: number | null
          is_default: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['addresses']['Row']> & {
          customer_id: string
          label: string
          governorate: string
          city: string
          street: string
          building: string
        }
        Update: Partial<Database['public']['Tables']['addresses']['Row']>
        Relationships: []
      }
      categories: {
        Row: { id: string; name_ar: string; slug: string; sort_order: number }
        Insert: Partial<Database['public']['Tables']['categories']['Row']> & { name_ar: string; slug: string }
        Update: Partial<Database['public']['Tables']['categories']['Row']>
        Relationships: []
      }
      medicines: {
        Row: {
          id: string
          name_ar: string
          name_en: string | null
          description_ar: string | null
          category_id: string | null
          sku: string | null
          manufacturer: string | null
          price: number
          stock_quantity: number
          requires_prescription: boolean
          image_url: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['medicines']['Row']> & { name_ar: string; price: number }
        Update: Partial<Database['public']['Tables']['medicines']['Row']>
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          customer_id: string
          address_id: string
          status: string
          payment_method: string
          payment_status: string
          subtotal: number
          delivery_fee: number
          total: number
          prescription_id: string | null
          courier_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['orders']['Row']> & {
          customer_id: string
          address_id: string
          payment_method: string
          subtotal: number
          delivery_fee: number
          total: number
        }
        Update: Partial<Database['public']['Tables']['orders']['Row']>
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          medicine_id: string
          quantity: number
          unit_price: number
          line_total: number
        }
        Insert: Partial<Database['public']['Tables']['order_items']['Row']> & {
          order_id: string
          medicine_id: string
          quantity: number
          unit_price: number
          line_total: number
        }
        Update: Partial<Database['public']['Tables']['order_items']['Row']>
        Relationships: []
      }
      order_status_events: {
        Row: {
          id: string
          order_id: string
          status: string
          note: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['order_status_events']['Row']> & {
          order_id: string
          status: string
        }
        Update: Partial<Database['public']['Tables']['order_status_events']['Row']>
        Relationships: []
      }
      prescriptions: {
        Row: {
          id: string
          customer_id: string
          order_id: string | null
          image_path: string
          status: 'pending' | 'approved' | 'rejected'
          reviewed_by: string | null
          reviewer_notes: string | null
          created_at: string
          reviewed_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['prescriptions']['Row']> & {
          customer_id: string
          image_path: string
        }
        Update: Partial<Database['public']['Tables']['prescriptions']['Row']>
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          order_id: string
          provider: string
          paymob_order_id: string | null
          paymob_transaction_id: string | null
          amount: number
          status: string
          raw_webhook_payload: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['payments']['Row']> & { order_id: string; amount: number }
        Update: Partial<Database['public']['Tables']['payments']['Row']>
        Relationships: []
      }
      delivery_assignments: {
        Row: {
          id: string
          order_id: string
          courier_id: string
          status: 'assigned' | 'picked_up' | 'en_route' | 'delivered' | 'failed'
          assigned_at: string
          delivered_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['delivery_assignments']['Row']> & {
          order_id: string
          courier_id: string
        }
        Update: Partial<Database['public']['Tables']['delivery_assignments']['Row']>
        Relationships: []
      }
      courier_locations: {
        Row: { courier_id: string; order_id: string | null; lat: number; lng: number; updated_at: string }
        Insert: Partial<Database['public']['Tables']['courier_locations']['Row']> & {
          courier_id: string
          lat: number
          lng: number
        }
        Update: Partial<Database['public']['Tables']['courier_locations']['Row']>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      create_order: {
        Args: {
          p_address_id: string
          p_payment_method: string
          p_items: unknown
          p_prescription_id?: string | null
          p_delivery_fee?: number
          p_notes?: string | null
        }
        Returns: Database['public']['Tables']['orders']['Row']
      }
      set_order_status: {
        Args: { p_order_id: string; p_status: string; p_note?: string | null }
        Returns: Database['public']['Tables']['orders']['Row']
      }
      courier_set_delivery_status: {
        Args: { p_order_id: string; p_status: string }
        Returns: Database['public']['Tables']['orders']['Row']
      }
    }
  }
}
