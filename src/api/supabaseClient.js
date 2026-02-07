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
    RFQ: createEntity('rfqs'),
    PO: createEntity('pos'),
    AuditLog: createEntity('audit_logs'),
    User: createEntity('users'),
  },
};
