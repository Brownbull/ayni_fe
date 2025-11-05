import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ColumnMapping as ColumnMappingType,
  SystemColumn,
  COLUMN_SCHEMA,
  getRequiredColumns,
  getOptionalColumns,
  getInferableColumns,
  validateMappings
} from '../../types/columnSchema';

interface ColumnMappingProps {
  csvColumns: string[];
  onMappingChange: (mappings: ColumnMappingType[]) => void;
  initialMappings?: ColumnMappingType[];
  onValidationChange?: (isValid: boolean) => void;
}

/**
 * ColumnMapping Component
 *
 * Interactive UI for mapping CSV columns to system schema columns.
 * Features:
 * - Drag-and-drop support
 * - Automatic smart matching suggestions
 * - Visual validation feedback
 * - Required/Optional/Inferable column grouping
 */
export const ColumnMapping: React.FC<ColumnMappingProps> = ({
  csvColumns,
  onMappingChange,
  initialMappings,
  onValidationChange
}) => {
  const [mappings, setMappings] = useState<ColumnMappingType[]>(() => {
    if (initialMappings && initialMappings.length > 0) {
      return initialMappings;
    }
    // Initialize with empty mappings
    return csvColumns.map(col => ({
      csvColumn: col,
      systemColumn: null
    }));
  });

  const [expandedSections, setExpandedSections] = useState({
    required: true,
    optional: true,
    inferable: false
  });

  const requiredColumns = useMemo(() => getRequiredColumns(), []);
  const optionalColumns = useMemo(() => getOptionalColumns(), []);
  const inferableColumns = useMemo(() => getInferableColumns(), []);

  // Validate mappings whenever they change
  useEffect(() => {
    const validation = validateMappings(mappings);
    onValidationChange?.(validation.valid);
    onMappingChange(mappings);
  }, [mappings, onMappingChange, onValidationChange]);

  // Smart column matching suggestions
  const suggestMapping = useCallback((csvColumn: string): SystemColumn | null => {
    const normalized = csvColumn.toLowerCase().replace(/[_\s-]/g, '');

    const suggestions: Record<string, SystemColumn> = {
      'date': 'in_dt',
      'datetime': 'in_dt',
      'fecha': 'in_dt',
      'transactionid': 'in_trans_id',
      'transid': 'in_trans_id',
      'idtransaccion': 'in_trans_id',
      'productid': 'in_product_id',
      'producto': 'in_product_id',
      'idproducto': 'in_product_id',
      'quantity': 'in_quantity',
      'cantidad': 'in_quantity',
      'qty': 'in_quantity',
      'price': 'in_price_total',
      'pricetotal': 'in_price_total',
      'total': 'in_price_total',
      'precio': 'in_price_total',
      'revenue': 'in_price_total',
      'customer': 'in_customer_id',
      'customerid': 'in_customer_id',
      'cliente': 'in_customer_id',
      'description': 'in_description',
      'descripcion': 'in_description',
      'category': 'in_category',
      'categoria': 'in_category',
      'cost': 'in_cost_total',
      'costtotal': 'in_cost_total',
      'costo': 'in_cost_total',
      'stock': 'in_stock',
      'inventory': 'in_stock',
      'inventario': 'in_stock',
      'margin': 'in_margin',
      'margen': 'in_margin',
      'discount': 'in_discount_total',
      'descuento': 'in_discount_total'
    };

    return suggestions[normalized] || null;
  }, []);

  // Auto-suggest mappings on mount
  useEffect(() => {
    if (!initialMappings) {
      const suggestedMappings = csvColumns.map(col => ({
        csvColumn: col,
        systemColumn: suggestMapping(col)
      }));
      setMappings(suggestedMappings);
    }
  }, [csvColumns, initialMappings, suggestMapping]);

  const handleMappingChange = useCallback((csvColumn: string, systemColumn: SystemColumn | null) => {
    setMappings(prev => prev.map(m =>
      m.csvColumn === csvColumn
        ? { ...m, systemColumn }
        : m
    ));
  }, []);

  const isSystemColumnMapped = useCallback((systemColumn: SystemColumn): boolean => {
    return mappings.some(m => m.systemColumn === systemColumn);
  }, [mappings]);

  const getMappedCsvColumn = useCallback((systemColumn: SystemColumn): string | null => {
    const mapping = mappings.find(m => m.systemColumn === systemColumn);
    return mapping?.csvColumn || null;
  }, [mappings]);

  const toggleSection = useCallback((section: 'required' | 'optional' | 'inferable') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const validation = useMemo(() => validateMappings(mappings), [mappings]);

  const renderSystemColumn = (systemColumn: SystemColumn, isRequired: boolean) => {
    const spec = COLUMN_SCHEMA[systemColumn];
    const isMapped = isSystemColumnMapped(systemColumn);
    const mappedCsvColumn = getMappedCsvColumn(systemColumn);

    return (
      <div
        key={systemColumn}
        className={`
          p-4 rounded-lg border-2 transition-all
          ${isMapped
            ? 'border-green-500 bg-green-50'
            : isRequired
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300 bg-gray-50'
          }
        `}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-gray-900">
                {systemColumn}
              </h4>
              {isRequired && (
                <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                  REQUIRED
                </span>
              )}
              {spec.inferable === 1 && (
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                  INFERABLE
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {spec.description}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Type: {spec.dtype}
            </p>
          </div>
          {isMapped && mappedCsvColumn && (
            <div className="ml-4 flex items-center gap-2">
              <span className="text-sm font-medium text-green-700">
                ← {mappedCsvColumn}
              </span>
              <button
                onClick={() => handleMappingChange(mappedCsvColumn, null)}
                className="text-red-500 hover:text-red-700 text-xs"
                aria-label={`Remove mapping for ${systemColumn}`}
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCsvColumn = (csvColumn: string) => {
    const mapping = mappings.find(m => m.csvColumn === csvColumn);
    const systemColumn = mapping?.systemColumn;

    return (
      <div
        key={csvColumn}
        className="p-3 rounded-lg border border-gray-300 bg-white"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm text-gray-900 truncate">
            {csvColumn}
          </span>
          <select
            value={systemColumn || ''}
            onChange={(e) => handleMappingChange(
              csvColumn,
              e.target.value as SystemColumn || null
            )}
            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Map CSV column ${csvColumn}`}
          >
            <option value="">Not mapped</option>
            <optgroup label="Required">
              {requiredColumns.map(col => (
                <option
                  key={col}
                  value={col}
                  disabled={isSystemColumnMapped(col) && systemColumn !== col}
                >
                  {col} {isSystemColumnMapped(col) && systemColumn !== col ? '(mapped)' : ''}
                </option>
              ))}
            </optgroup>
            <optgroup label="Optional">
              {optionalColumns.filter(col => !inferableColumns.includes(col)).map(col => (
                <option
                  key={col}
                  value={col}
                  disabled={isSystemColumnMapped(col) && systemColumn !== col}
                >
                  {col} {isSystemColumnMapped(col) && systemColumn !== col ? '(mapped)' : ''}
                </option>
              ))}
            </optgroup>
            <optgroup label="Inferable">
              {inferableColumns.map(col => (
                <option
                  key={col}
                  value={col}
                  disabled={isSystemColumnMapped(col) && systemColumn !== col}
                >
                  {col} {isSystemColumnMapped(col) && systemColumn !== col ? '(mapped)' : ''}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Validation Summary */}
      <div className={`
        p-4 rounded-lg border-2
        ${validation.valid
          ? 'border-green-500 bg-green-50'
          : 'border-red-500 bg-red-50'
        }
      `}>
        <h3 className="font-semibold text-lg mb-2">
          {validation.valid
            ? '✓ All required columns mapped'
            : '⚠ Missing required mappings'
          }
        </h3>
        {!validation.valid && (
          <ul className="text-sm text-red-700 space-y-1">
            {validation.missingRequired.map(col => (
              <li key={col}>• {col} - {COLUMN_SCHEMA[col].description}</li>
            ))}
          </ul>
        )}
      </div>

      {/* CSV Columns Section */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Your CSV Columns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {csvColumns.map(renderCsvColumn)}
        </div>
      </div>

      {/* System Schema Sections */}
      <div className="space-y-4">
        {/* Required Columns */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('required')}
            className="w-full px-4 py-3 bg-red-100 hover:bg-red-200 flex items-center justify-between transition-colors"
            aria-expanded={expandedSections.required}
          >
            <span className="font-semibold text-red-900">
              Required Columns ({requiredColumns.length})
            </span>
            <span className="text-red-900">
              {expandedSections.required ? '▼' : '▶'}
            </span>
          </button>
          {expandedSections.required && (
            <div className="p-4 space-y-3">
              {requiredColumns.map(col => renderSystemColumn(col, true))}
            </div>
          )}
        </div>

        {/* Optional Columns */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('optional')}
            className="w-full px-4 py-3 bg-blue-100 hover:bg-blue-200 flex items-center justify-between transition-colors"
            aria-expanded={expandedSections.optional}
          >
            <span className="font-semibold text-blue-900">
              Optional Columns ({optionalColumns.filter(col => !inferableColumns.includes(col)).length})
            </span>
            <span className="text-blue-900">
              {expandedSections.optional ? '▼' : '▶'}
            </span>
          </button>
          {expandedSections.optional && (
            <div className="p-4 space-y-3">
              {optionalColumns
                .filter(col => !inferableColumns.includes(col))
                .map(col => renderSystemColumn(col, false))}
            </div>
          )}
        </div>

        {/* Inferable Columns */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('inferable')}
            className="w-full px-4 py-3 bg-purple-100 hover:bg-purple-200 flex items-center justify-between transition-colors"
            aria-expanded={expandedSections.inferable}
          >
            <span className="font-semibold text-purple-900">
              Inferable Columns ({inferableColumns.length})
            </span>
            <span className="text-purple-900">
              {expandedSections.inferable ? '▼' : '▶'}
            </span>
          </button>
          {expandedSections.inferable && (
            <div className="p-4 space-y-3">
              {inferableColumns.map(col => renderSystemColumn(col, false))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ColumnMapping;
