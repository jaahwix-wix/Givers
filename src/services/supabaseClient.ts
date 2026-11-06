/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, getSupabaseUrl, getSupabaseAnonKey, getSupabaseClient } from '../supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

export { supabase, getSupabaseUrl, getSupabaseAnonKey, getSupabaseClient };
export type { SupabaseClient };
export default supabase;
