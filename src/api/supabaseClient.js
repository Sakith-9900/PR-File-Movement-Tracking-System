import { supabase } from '@/config/supabase';

// Helper function to handle Supabase responses
const handleResponse = async (promise) => {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
};

// Generic CRUD operations
const createEntity = (tableName) => ({
  list: async (orderBy = '-created_at') => {
    const isDescending = orderBy.startsWith('-');
    const column = isDescending ? orderBy.slice(1) : orderBy;

    return handleResponse(
      supabase
        .from(tableName)
        .select('*')
        .order(column, { ascending: !isDescending })
    );
  },

  filter: async (filters) => {
    let query = supabase.from(tableName).select('*');

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    return handleResponse(query);
  },

  create: async (data) => {
    return handleResponse(
      supabase
        .from(tableName)
        .insert(data)
        .select()
        .single()
    );
  },

  update: async (id, data) => {
    return handleResponse(
      supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()
    );
  },

  delete: async (id) => {
    return handleResponse(
      supabase
        .from(tableName)
        .delete()
        .eq('id', id)
    );
  },

  get: async (id) => {
    return handleResponse(
      supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single()
    );
  },
});

// Export entities matching Base 44 structure
export const supabaseClient = {
  entities: {
    PRFile: createEntity('pr_files'),
    Employee: createEntity('employees'),
    FileAssignment: createEntity('file_assignments'),
    FileDocument: createEntity('file_documents'),
    RFQ: {
      ...createEntity('rfqs'),
      getLatestNumber: async (year) => {
        const { data, error } = await supabase
          .from('rfqs')
          .select('rfq_number')
          .ilike('rfq_number', `RFQ-${year}-%`)
          .order('rfq_number', { ascending: false })
          .limit(1);

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows found
        return data?.[0]?.rfq_number || null;
      }
    },
    PO: {
      ...createEntity('pos'),
      getLatestNumber: async (year) => {
        const { data, error } = await supabase
          .from('pos')
          .select('po_number')
          .ilike('po_number', `PO-${year}-%`)
          .order('po_number', { ascending: false })
          .limit(1);

        if (error && error.code !== 'PGRST116') throw error;
        return data?.[0]?.po_number || null;
      }
    },
    AuditLog: createEntity('audit_logs'),
    User: createEntity('users'),
  },
  // Add auth namespace for compatibility
  auth: {
    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = '/login';
    },
    getCurrentUser: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    syncUser: async (user) => {
      if (!user) return;

      // Check if user exists in public.users
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingUser) {
        // Create public user record if not exists
        await supabase.from('users').insert({
          id: user.id,
          email: user.email,
          short_code: user.email.split('@')[0].toUpperCase(), // Default short code
          is_active: true,
          created_at: new Date().toISOString()
        });
      }
    }
  },
  // Add appLogs namespace for NavigationTracker compatibility
  appLogs: {
    logUserInApp: async (pageName) => {
      console.log(`[Analytics] User visited: ${pageName}`);
      // Optional: Insert into audit_logs or a dedicated analytics table
      return Promise.resolve();
    }
  }
};
