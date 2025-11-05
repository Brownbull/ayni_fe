/**
 * Column Schema Types
 * Based on COLUMN_SCHEMA from ayni_core/src/core/constants.py
 */

export interface ColumnSpec {
  optional: 0 | 1;  // 0 = REQUIRED, 1 = OPTIONAL
  inferable: 0 | 1;  // 0 = NOT inferable, 1 = INFERABLE
  description: string;
  dtype: 'datetime64[ns]' | 'object' | 'float64';
}

export type SystemColumn =
  // Required columns
  | 'in_dt'
  | 'in_trans_id'
  | 'in_product_id'
  | 'in_quantity'
  | 'in_price_total'
  // Optional columns
  | 'in_trans_type'
  | 'in_customer_id'
  | 'in_description'
  | 'in_category'
  | 'in_unit_type'
  | 'in_stock'
  // Inferable columns
  | 'in_cost_unit'
  | 'in_cost_total'
  | 'in_price_unit'
  | 'in_discount_total'
  | 'in_commission_total'
  | 'in_margin';

export interface ColumnMapping {
  csvColumn: string;
  systemColumn: SystemColumn | null;
}

export interface ColumnMappingState {
  mappings: ColumnMapping[];
  csvColumns: string[];
}

export const COLUMN_SCHEMA: Record<SystemColumn, ColumnSpec> = {
  // REQUIRED COLUMNS (optional=0)
  in_dt: {
    optional: 0,
    inferable: 0,
    description: 'Transaction datetime',
    dtype: 'datetime64[ns]'
  },
  in_trans_id: {
    optional: 0,
    inferable: 0,
    description: 'Unique transaction identifier',
    dtype: 'object'
  },
  in_product_id: {
    optional: 0,
    inferable: 0,
    description: 'Product identifier',
    dtype: 'object'
  },
  in_quantity: {
    optional: 0,
    inferable: 0,
    description: 'Quantity of items in transaction',
    dtype: 'float64'
  },
  in_price_total: {
    optional: 0,
    inferable: 0,
    description: 'Total price/revenue for transaction',
    dtype: 'float64'
  },

  // OPTIONAL COLUMNS (optional=1, inferable=0)
  in_trans_type: {
    optional: 1,
    inferable: 0,
    description: 'Transaction type (sale, return, etc.)',
    dtype: 'object'
  },
  in_customer_id: {
    optional: 1,
    inferable: 0,
    description: 'Customer identifier',
    dtype: 'object'
  },
  in_description: {
    optional: 1,
    inferable: 0,
    description: 'Product description',
    dtype: 'object'
  },
  in_category: {
    optional: 1,
    inferable: 0,
    description: 'Product category',
    dtype: 'object'
  },
  in_unit_type: {
    optional: 1,
    inferable: 0,
    description: 'Unit of measure (kg, unit, liter, etc.)',
    dtype: 'object'
  },
  in_stock: {
    optional: 1,
    inferable: 0,
    description: 'Current stock level',
    dtype: 'float64'
  },

  // INFERABLE COLUMNS (optional=1, inferable=1)
  in_cost_unit: {
    optional: 1,
    inferable: 1,
    description: 'Cost per unit (can be inferred from cost_total/quantity)',
    dtype: 'float64'
  },
  in_cost_total: {
    optional: 1,
    inferable: 1,
    description: 'Total cost (can be inferred from cost_unit * quantity)',
    dtype: 'float64'
  },
  in_price_unit: {
    optional: 1,
    inferable: 1,
    description: 'Price per unit (can be inferred from price_total/quantity)',
    dtype: 'float64'
  },
  in_discount_total: {
    optional: 1,
    inferable: 1,
    description: 'Total discount amount (can be inferred)',
    dtype: 'float64'
  },
  in_commission_total: {
    optional: 1,
    inferable: 1,
    description: 'Total commission amount (can be inferred)',
    dtype: 'float64'
  },
  in_margin: {
    optional: 1,
    inferable: 1,
    description: 'Profit margin (can be inferred from price and cost)',
    dtype: 'float64'
  }
};

/**
 * Get list of required system columns
 */
export function getRequiredColumns(): SystemColumn[] {
  return Object.entries(COLUMN_SCHEMA)
    .filter(([_, spec]) => spec.optional === 0)
    .map(([col, _]) => col as SystemColumn);
}

/**
 * Get list of optional system columns
 */
export function getOptionalColumns(): SystemColumn[] {
  return Object.entries(COLUMN_SCHEMA)
    .filter(([_, spec]) => spec.optional === 1)
    .map(([col, _]) => col as SystemColumn);
}

/**
 * Get list of inferable system columns
 */
export function getInferableColumns(): SystemColumn[] {
  return Object.entries(COLUMN_SCHEMA)
    .filter(([_, spec]) => spec.inferable === 1)
    .map(([col, _]) => col as SystemColumn);
}

/**
 * Check if all required columns are mapped
 */
export function validateMappings(mappings: ColumnMapping[]): {
  valid: boolean;
  missingRequired: SystemColumn[];
} {
  const requiredColumns = getRequiredColumns();
  const mappedSystemColumns = mappings
    .filter(m => m.systemColumn !== null)
    .map(m => m.systemColumn as SystemColumn);

  const missingRequired = requiredColumns.filter(
    col => !mappedSystemColumns.includes(col)
  );

  return {
    valid: missingRequired.length === 0,
    missingRequired
  };
}
