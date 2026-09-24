// =========================================================================
// SERVICIO DE COMUNICACIÓN CON EL BACKEND (API REST + JWT)
// =========================================================================

const rawUrl = import.meta.env?.VITE_API_URL || 'http://127.0.0.1:8000/api';
const API_BASE_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/+$/, '')}/api`;

// Helper para obtener el token del almacenamiento local
const getAuthHeaders = () => {
  const token = localStorage.getItem('nexus_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// Función genérica para realizar peticiones HTTP
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Error en la petición (${response.status})`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    // Si el backend no responde (Network Error), propagamos el error para que el cliente lo maneje
    throw error;
  }
};

// =========================================================================
// ENDPOINTS DE AUTENTICACIÓN
// =========================================================================
export const authAPI = {
  login: async (email, password) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  register: async (userData) => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  getProfile: async () => {
    return request('/auth/me', {
      method: 'GET'
    });
  },

  recoverPassword: async (email) => {
    return request('/auth/recover-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }
};

// =========================================================================
// ENDPOINTS DE USUARIOS (CRUD)
// =========================================================================
export const usersAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/users${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  getById: async (id) => {
    return request(`/users/${id}`, { method: 'GET' });
  },

  create: async (userData) => {
    return request('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  update: async (id, userData) => {
    return request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  },

  toggleStatus: async (id, estado) => {
    return request(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ estado })
    });
  },

  delete: async (id) => {
    return request(`/users/${id}`, {
      method: 'DELETE'
    });
  }
};

// =========================================================================
// ENDPOINTS DE PRODUCTOS Y CONTROL DE STOCK (CRUD)
// =========================================================================
export const productsAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  getCategories: async () => {
    return request('/products/categories', { method: 'GET' });
  },

  getById: async (id) => {
    return request(`/products/${id}`, { method: 'GET' });
  },

  create: async (productData) => {
    return request('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  update: async (id, productData) => {
    return request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  },

  updateStock: async (id, { stock, delta }) => {
    return request(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock, delta })
    });
  },

  delete: async (id) => {
    return request(`/products/${id}`, {
      method: 'DELETE'
    });
  }
};

// =========================================================================
// ENDPOINTS DE SERVICIOS
// =========================================================================
export const servicesAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/services${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  create: async (serviceData) => {
    return request('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData)
    });
  },

  update: async (id, serviceData) => {
    return request(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData)
    });
  },

  delete: async (id) => {
    return request(`/services/${id}`, {
      method: 'DELETE'
    });
  }
};

// =========================================================================
// ENDPOINTS DE ROLES Y ESTADÍSTICAS
// =========================================================================
export const rolesAPI = {
  getAll: async () => {
    return request('/roles', { method: 'GET' });
  },

  getStats: async () => {
    return request('/roles/stats', { method: 'GET' });
  }
};

// =========================================================================
// ENDPOINTS DE PEDIDOS (CHECKOUT Y CLIENTE)
// =========================================================================
export const ordersAPI = {
  create: async (orderData) => {
    return request('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },

  updateStatus: async (id, statusData) => {
    return request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData)
    });
  },

  getMyOrders: async () => {
    return request('/orders/my-orders', { method: 'GET' });
  },

  getAllOrders: async () => {
    return request('/orders/all', { method: 'GET' });
  }
};

// =========================================================================
// QUINTO AVANCE: ENDPOINTS DE VENTAS Y OPERACIONES COMERCIALES
// =========================================================================
export const salesAPI = {
  create: async (saleData) => {
    return request('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData)
    });
  },

  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/sales${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  getDailyReport: async (fecha = null) => {
    const query = fecha ? `?fecha=${fecha}` : '';
    return request(`/sales/daily${query}`, { method: 'GET' });
  },

  getById: async (id) => {
    return request(`/sales/${id}`, { method: 'GET' });
  }
};

// =========================================================================
// QUINTO AVANCE: ENDPOINTS DE FACTURACIÓN
// =========================================================================
export const invoicesAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/invoices${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  getMyInvoices: async () => {
    return request('/invoices/my-invoices', { method: 'GET' });
  },

  getById: async (id) => {
    return request(`/invoices/${id}`, { method: 'GET' });
  },

  getByNumber: async (numeroFactura) => {
    return request(`/invoices/by-number/${numeroFactura}`, { method: 'GET' });
  }
};

// =========================================================================
// QUINTO AVANCE: ENDPOINTS DE PQR
// =========================================================================
export const pqrAPI = {
  create: async (pqrData) => {
    return request('/pqr', {
      method: 'POST',
      body: JSON.stringify(pqrData)
    });
  },

  getMyPQR: async () => {
    return request('/pqr/my-pqr', { method: 'GET' });
  },

  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/pqr/all${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  track: async (radicado) => {
    return request(`/pqr/track/${radicado}`, { method: 'GET' });
  },

  respond: async (id, data) => {
    return request(`/pqr/${id}/respond`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }
};

// =========================================================================
// QUINTO AVANCE: ENDPOINTS DE CHATBOT CON IA
// =========================================================================
export const chatbotAPI = {
  sendMessage: async (message, sessionId = 'web_user_session') => {
    return request('/chatbot/message', {
      method: 'POST',
      body: JSON.stringify({ message, session_id: sessionId })
    });
  },

  getHistory: async (sessionId = 'web_user_session') => {
    return request(`/chatbot/history/${sessionId}`, { method: 'GET' });
  }
};

// =========================================================================
// MÓDULO DE PROVEEDORES Y COMPRAS (REABASTECIMIENTO DE STOCK)
// =========================================================================
export const suppliersAPI = {
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/purchases/suppliers${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  create: async (supplierData) => {
    return request('/purchases/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplierData)
    });
  },

  update: async (id, supplierData) => {
    return request(`/purchases/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplierData)
    });
  }
};

export const purchasesAPI = {
  create: async (purchaseData) => {
    return request('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchaseData)
    });
  },

  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/purchases${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  getById: async (id) => {
    return request(`/purchases/${id}`, { method: 'GET' });
  }
};

// =========================================================================
// MÓDULO DE INVENTARIO Y KARDEX (TRAZABILIDAD EN TIEMPO REAL)
// =========================================================================
export const inventoryAPI = {
  getMovements: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/inventory/movements${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  adjustStock: async (adjustData) => {
    return request('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(adjustData)
    });
  },

  getSummary: async () => {
    return request('/inventory/summary', { method: 'GET' });
  }
};

