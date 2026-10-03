/**
 * Supabase Client Layer (Zero-Dependency)
 * Uses native Node.js fetch to interact with Supabase PostgREST endpoints.
 * Automatically activates when SUPABASE_URL and SUPABASE_KEY are provided.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

class SupabaseClient {
  constructor(url, key) {
    this.url = url ? url.replace(/\/$/, '') : '';
    this.key = key;
  }

  isConfigured() {
    return Boolean(this.url && this.key);
  }

  getHeaders() {
    return {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  async select(table, query = '') {
    if (!this.isConfigured()) return null;
    const endpoint = `${this.url}/rest/v1/${table}${query ? `?${query}` : ''}`;
    try {
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: this.getHeaders()
      });
      if (!res.ok) {
        console.error(`Supabase SELECT error on ${table}: ${res.statusText}`);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error(`Supabase SELECT network error on ${table}:`, err.message);
      return null;
    }
  }

  async insert(table, data) {
    if (!this.isConfigured()) return null;
    const endpoint = `${this.url}/rest/v1/${table}`;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        console.error(`Supabase INSERT error on ${table}: ${res.statusText}`);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error(`Supabase INSERT network error on ${table}:`, err.message);
      return null;
    }
  }

  async update(table, field, value, data) {
    if (!this.isConfigured()) return null;
    const endpoint = `${this.url}/rest/v1/${table}?${field}=eq.${encodeURIComponent(value)}`;
    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        console.error(`Supabase UPDATE error on ${table}: ${res.statusText}`);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error(`Supabase UPDATE network error on ${table}:`, err.message);
      return null;
    }
  }

  async upsert(table, data) {
    if (!this.isConfigured()) return null;
    const endpoint = `${this.url}/rest/v1/${table}`;
    const headers = {
      ...this.getHeaders(),
      'Prefer': 'resolution=merge-duplicates,return=representation'
    };
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        console.error(`Supabase UPSERT error on ${table}: ${res.statusText}`);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error(`Supabase UPSERT network error on ${table}:`, err.message);
      return null;
    }
  }

  async delete(table, field, value) {
    if (!this.isConfigured()) return null;
    const endpoint = `${this.url}/rest/v1/${table}?${field}=eq.${encodeURIComponent(value)}`;
    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      if (!res.ok) {
        console.error(`Supabase DELETE error on ${table}: ${res.statusText}`);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error(`Supabase DELETE network error on ${table}:`, err.message);
      return null;
    }
  }
}

const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = supabase;
