import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnMapping } from './ColumnMapping';
import { SystemColumn } from '../../types/columnSchema';

describe('ColumnMapping Component', () => {
  const mockCsvColumns = [
    'fecha',
    'id_transaccion',
    'producto',
    'cantidad',
    'precio_total',
    'cliente'
  ];

  const mockOnMappingChange = vi.fn();
  const mockOnValidationChange = vi.fn();

  beforeEach(() => {
    mockOnMappingChange.mockClear();
    mockOnValidationChange.mockClear();
  });

  // ==========================================
  // TEST TYPE 1: VALID (Happy Path)
  // ==========================================
  describe('Valid Tests', () => {
    it('should render successfully with CSV columns', () => {
      render(
        <ColumnMapping
          csvColumns={mockCsvColumns}
          onMappingChange={mockOnMappingChange}
        />
      );

      expect(screen.getByText('Your CSV Columns')).toBeInTheDocument();
      mockCsvColumns.forEach(col => {
        expect(screen.getByText(col)).toBeInTheDocument();
      });
    });

    it('should auto-suggest mappings based on column names', async () => {
      render(
        <ColumnMapping
          csvColumns={mockCsvColumns}
          onMappingChange={mockOnMappingChange}
          onValidationChange={mockOnValidationChange}
        />
      );

      await waitFor(() => {
        expect(mockOnMappingChange).toHaveBeenCalled();
      });

      // Check that smart matching occurred
      const lastCall = mockOnMappingChange.mock.calls[mockOnMappingChange.mock.calls.length - 1];
      const mappings = lastCall[0];

      // 'fecha' should map to 'in_dt'
      const fechaMapping = mappings.find((m: any) => m.csvColumn === 'fecha');
      expect(fechaMapping?.systemColumn).toBe('in_dt');

      // 'cantidad' should map to 'in_quantity'
      const cantidadMapping = mappings.find((m: any) => m.csvColumn === 'cantidad');
      expect(cantidadMapping?.systemColumn).toBe('in_quantity');
    });

    it('should allow user to manually map columns via dropdown', async () => {
      const user = userEvent.setup();

      render(
        <ColumnMapping
          csvColumns={['custom_column']}
          onMappingChange={mockOnMappingChange}
        />
      );

      const select = screen.getByLabelText('Map CSV column custom_column');
      await user.selectOptions(select, 'in_trans_id');

      await waitFor(() => {
        const lastCall = mockOnMappingChange.mock.calls[mockOnMappingChange.mock.calls.length - 1];
        const mappings = lastCall[0];
        expect(mappings[0].systemColumn).toBe('in_trans_id');
      });
    });

    it('should show validation success when all required columns mapped', async () => {
      const completeMapping = [
        { csvColumn: 'fecha', systemColumn: 'in_dt' as SystemColumn },
        { csvColumn: 'trans_id', systemColumn: 'in_trans_id' as SystemColumn },
        { csvColumn: 'producto', systemColumn: 'in_product_id' as SystemColumn },
        { csvColumn: 'cantidad', systemColumn: 'in_quantity' as SystemColumn },
        { csvColumn: 'precio', systemColumn: 'in_price_total' as SystemColumn }
      ];

      render(
        <ColumnMapping
          csvColumns={completeMapping.map(m => m.csvColumn)}
          onMappingChange={mockOnMappingChange}
          initialMappings={completeMapping}
          onValidationChange={mockOnValidationChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('✓ All required columns mapped')).toBeInTheDocument();
        expect(mockOnValidationChange).toHaveBeenCalledWith(true);
      });
    });
  });

  // ==========================================
  // TEST TYPE 2: ERROR (Error Handling)
  // ==========================================
  describe('Error Handling Tests', () => {
    it('should handle empty CSV columns gracefully', () => {
      render(
        <ColumnMapping
          csvColumns={[]}
          onMappingChange={mockOnMappingChange}
        />
      );

      expect(screen.getByText('Your CSV Columns')).toBeInTheDocument();
      // Should not crash, shows empty state
    });

    it('should display clear error message for missing required columns', async () => {
      render(
        <ColumnMapping
          csvColumns={['col1', 'col2']}
          onMappingChange={mockOnMappingChange}
          initialMappings={[
            { csvColumn: 'col1', systemColumn: null },
            { csvColumn: 'col2', systemColumn: null }
          ]}
          onValidationChange={mockOnValidationChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('⚠ Missing required mappings')).toBeInTheDocument();
        expect(screen.getByText(/in_dt/)).toBeInTheDocument();
        expect(screen.getByText(/in_trans_id/)).toBeInTheDocument();
      });
    });

    it('should handle callback errors gracefully', () => {
      const throwingCallback = vi.fn(() => {
        throw new Error('Callback error');
      });

      // Component should not crash even if callback throws
      expect(() => {
        render(
          <ColumnMapping
            csvColumns={mockCsvColumns}
            onMappingChange={throwingCallback}
          />
        );
      }).not.toThrow();
    });
  });

  // ==========================================
  // TEST TYPE 3: INVALID (Input Validation)
  // ==========================================
  describe('Invalid Input Tests', () => {
    it('should prevent mapping same system column to multiple CSV columns', async () => {
      const user = userEvent.setup();

      render(
        <ColumnMapping
          csvColumns={['col1', 'col2']}
          onMappingChange={mockOnMappingChange}
        />
      );

      // Map col1 to in_dt
      const select1 = screen.getByLabelText('Map CSV column col1');
      await user.selectOptions(select1, 'in_dt');

      // Try to map col2 to in_dt - option should be disabled
      const select2 = screen.getByLabelText('Map CSV column col2');
      const option = (select2.querySelector('option[value="in_dt"]') as HTMLOptionElement);
      expect(option?.disabled).toBe(true);
    });

    it('should reject invalid system column values', async () => {
      const user = userEvent.setup();

      render(
        <ColumnMapping
          csvColumns={['col1']}
          onMappingChange={mockOnMappingChange}
        />
      );

      const select = screen.getByLabelText('Map CSV column col1');

      // Select "Not mapped"
      await user.selectOptions(select, '');

      await waitFor(() => {
        const lastCall = mockOnMappingChange.mock.calls[mockOnMappingChange.mock.calls.length - 1];
        const mappings = lastCall[0];
        expect(mappings[0].systemColumn).toBe(null);
      });
    });

    it('should handle malformed column names with special characters', () => {
      const specialColumns = [
        'column with spaces',
        'column-with-dashes',
        'column_with_underscores',
        'column@with#symbols'
      ];

      render(
        <ColumnMapping
          csvColumns={specialColumns}
          onMappingChange={mockOnMappingChange}
        />
      );

      specialColumns.forEach(col => {
        expect(screen.getByText(col)).toBeInTheDocument();
      });
    });
  });

  // ==========================================
  // TEST TYPE 4: EDGE (Boundary Conditions)
  // ==========================================
  describe('Edge Case Tests', () => {
    it('should handle CSV with 100+ columns efficiently', () => {
      const manyColumns = Array.from({ length: 100 }, (_, i) => `col_${i}`);

      const { container } = render(
        <ColumnMapping
          csvColumns={manyColumns}
          onMappingChange={mockOnMappingChange}
        />
      );

      expect(container.querySelectorAll('select').length).toBe(100);
    });

    it('should handle CSV with single column', () => {
      render(
        <ColumnMapping
          csvColumns={['single_column']}
          onMappingChange={mockOnMappingChange}
        />
      );

      expect(screen.getByText('single_column')).toBeInTheDocument();
    });

    it('should handle very long column names', () => {
      const longColumnName = 'a'.repeat(200);

      render(
        <ColumnMapping
          csvColumns={[longColumnName]}
          onMappingChange={mockOnMappingChange}
        />
      );

      expect(screen.getByText(longColumnName)).toBeInTheDocument();
    });

    it('should handle rapid mapping changes', async () => {
      const user = userEvent.setup();

      render(
        <ColumnMapping
          csvColumns={['col1']}
          onMappingChange={mockOnMappingChange}
        />
      );

      const select = screen.getByLabelText('Map CSV column col1');

      // Rapidly change selections
      await user.selectOptions(select, 'in_dt');
      await user.selectOptions(select, 'in_trans_id');
      await user.selectOptions(select, 'in_product_id');
      await user.selectOptions(select, '');

      // Should have called callback for each change
      expect(mockOnMappingChange.mock.calls.length).toBeGreaterThan(3);
    });
  });

  // ==========================================
  // TEST TYPE 5: FUNCTIONAL (Business Logic)
  // ==========================================
  describe('Functional Tests', () => {
    it('should preserve mappings when component re-renders', () => {
      const initialMappings = [
        { csvColumn: 'fecha', systemColumn: 'in_dt' as SystemColumn }
      ];

      const { rerender } = render(
        <ColumnMapping
          csvColumns={['fecha']}
          onMappingChange={mockOnMappingChange}
          initialMappings={initialMappings}
        />
      );

      // Re-render with same props
      rerender(
        <ColumnMapping
          csvColumns={['fecha']}
          onMappingChange={mockOnMappingChange}
          initialMappings={initialMappings}
        />
      );

      // Mapping should still be present
      expect(screen.getByText('← fecha')).toBeInTheDocument();
    });

    it('should allow removing a mapping', async () => {
      const user = userEvent.setup();

      const initialMappings = [
        { csvColumn: 'fecha', systemColumn: 'in_dt' as SystemColumn }
      ];

      render(
        <ColumnMapping
          csvColumns={['fecha']}
          onMappingChange={mockOnMappingChange}
          initialMappings={initialMappings}
        />
      );

      // Find and click the remove button
      const removeButton = screen.getByLabelText('Remove mapping for in_dt');
      await user.click(removeButton);

      await waitFor(() => {
        const lastCall = mockOnMappingChange.mock.calls[mockOnMappingChange.mock.calls.length - 1];
        const mappings = lastCall[0];
        expect(mappings[0].systemColumn).toBe(null);
      });
    });

    it('should correctly identify required vs optional columns', () => {
      render(
        <ColumnMapping
          csvColumns={mockCsvColumns}
          onMappingChange={mockOnMappingChange}
        />
      );

      // Check that required section exists
      expect(screen.getByText(/Required Columns \(5\)/)).toBeInTheDocument();

      // Check that optional section exists
      expect(screen.getByText(/Optional Columns/)).toBeInTheDocument();

      // Check that inferable section exists
      expect(screen.getByText(/Inferable Columns \(6\)/)).toBeInTheDocument();
    });

    it('should toggle section visibility', async () => {
      const user = userEvent.setup();

      render(
        <ColumnMapping
          csvColumns={mockCsvColumns}
          onMappingChange={mockOnMappingChange}
        />
      );

      const requiredButton = screen.getByRole('button', { name: /Required Columns/ });

      // Initially expanded (default)
      expect(requiredButton).toHaveAttribute('aria-expanded', 'true');

      // Click to collapse
      await user.click(requiredButton);

      expect(requiredButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  // ==========================================
  // TEST TYPE 6: VISUAL (UI/UX)
  // ==========================================
  describe('Visual Tests', () => {
    it('should display mapped columns with green styling', async () => {
      const initialMappings = [
        { csvColumn: 'fecha', systemColumn: 'in_dt' as SystemColumn }
      ];

      render(
        <ColumnMapping
          csvColumns={['fecha']}
          onMappingChange={mockOnMappingChange}
          initialMappings={initialMappings}
        />
      );

      await waitFor(() => {
        const mappedElement = screen.getByText('in_dt').closest('div');
        expect(mappedElement?.className).toContain('border-green-500');
        expect(mappedElement?.className).toContain('bg-green-50');
      });
    });

    it('should display unmapped required columns with red styling', () => {
      render(
        <ColumnMapping
          csvColumns={['col1']}
          onMappingChange={mockOnMappingChange}
          initialMappings={[{ csvColumn: 'col1', systemColumn: null }]}
        />
      );

      const requiredButton = screen.getByRole('button', { name: /Required Columns/ });
      fireEvent.click(requiredButton);

      const requiredElement = screen.getByText('in_dt').closest('div');
      expect(requiredElement?.className).toContain('border-red-300');
      expect(requiredElement?.className).toContain('bg-red-50');
    });

    it('should show REQUIRED badge for required columns', () => {
      render(
        <ColumnMapping
          csvColumns={mockCsvColumns}
          onMappingChange={mockOnMappingChange}
        />
      );

      const badges = screen.getAllByText('REQUIRED');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should show INFERABLE badge for inferable columns', () => {
      render(
        <ColumnMapping
          csvColumns={mockCsvColumns}
          onMappingChange={mockOnMappingChange}
        />
      );

      // Expand inferable section
      const inferableButton = screen.getByRole('button', { name: /Inferable Columns/ });
      fireEvent.click(inferableButton);

      const badges = screen.getAllByText('INFERABLE');
      expect(badges.length).toBe(6);
    });

    it('should display column descriptions', () => {
      render(
        <ColumnMapping
          csvColumns={mockCsvColumns}
          onMappingChange={mockOnMappingChange}
        />
      );

      expect(screen.getByText('Transaction datetime')).toBeInTheDocument();
      expect(screen.getByText('Unique transaction identifier')).toBeInTheDocument();
    });
  });

  // ==========================================
  // TEST TYPE 7: PERFORMANCE
  // ==========================================
  describe('Performance Tests', () => {
    it('should render 100 columns in under 500ms', () => {
      const manyColumns = Array.from({ length: 100 }, (_, i) => `col_${i}`);

      const startTime = performance.now();

      render(
        <ColumnMapping
          csvColumns={manyColumns}
          onMappingChange={mockOnMappingChange}
        />
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
    });

    it('should not cause excessive re-renders', async () => {
      const user = userEvent.setup();
      let renderCount = 0;

      const TestWrapper = () => {
        renderCount++;
        return (
          <ColumnMapping
            csvColumns={['col1']}
            onMappingChange={mockOnMappingChange}
          />
        );
      };

      render(<TestWrapper />);

      const initialRenderCount = renderCount;

      // Make a single change
      const select = screen.getByLabelText('Map CSV column col1');
      await user.selectOptions(select, 'in_dt');

      // Should not cause excessive re-renders (less than 5 additional renders)
      expect(renderCount - initialRenderCount).toBeLessThan(5);
    });

    it('should memoize expensive calculations', () => {
      const { rerender } = render(
        <ColumnMapping
          csvColumns={mockCsvColumns}
          onMappingChange={mockOnMappingChange}
        />
      );

      // Re-render with same props should use memoized values
      const startTime = performance.now();

      rerender(
        <ColumnMapping
          csvColumns={mockCsvColumns}
          onMappingChange={mockOnMappingChange}
        />
      );

      const duration = performance.now() - startTime;

      // Re-render should be fast (< 50ms)
      expect(duration).toBeLessThan(50);
    });
  });

  // ==========================================
  // TEST TYPE 8: SECURITY
  // ==========================================
  describe('Security Tests', () => {
    it('should sanitize column names with XSS attempts', () => {
      const xssColumns = [
        '<script>alert("xss")</script>',
        'column"><img src=x onerror=alert(1)>',
        'javascript:alert(1)'
      ];

      render(
        <ColumnMapping
          csvColumns={xssColumns}
          onMappingChange={mockOnMappingChange}
        />
      );

      // Text should be displayed as-is, not executed
      xssColumns.forEach(col => {
        expect(screen.getByText(col)).toBeInTheDocument();
      });

      // Check that no script tags were actually rendered
      expect(document.querySelectorAll('script').length).toBe(0);
    });

    it('should not expose sensitive data in callbacks', async () => {
      const user = userEvent.setup();

      render(
        <ColumnMapping
          csvColumns={['col1']}
          onMappingChange={mockOnMappingChange}
        />
      );

      const select = screen.getByLabelText('Map CSV column col1');
      await user.selectOptions(select, 'in_dt');

      await waitFor(() => {
        const lastCall = mockOnMappingChange.mock.calls[mockOnMappingChange.mock.calls.length - 1];
        const mappings = lastCall[0];

        // Ensure only expected data is passed
        expect(mappings[0]).toHaveProperty('csvColumn');
        expect(mappings[0]).toHaveProperty('systemColumn');
        expect(Object.keys(mappings[0]).length).toBe(2);
      });
    });

    it('should prevent prototype pollution via column names', () => {
      const maliciousColumns = [
        '__proto__',
        'constructor',
        'prototype'
      ];

      expect(() => {
        render(
          <ColumnMapping
            csvColumns={maliciousColumns}
            onMappingChange={mockOnMappingChange}
          />
        );
      }).not.toThrow();

      // Component should render without modifying Object prototype
      expect(Object.prototype.hasOwnProperty('polluted')).toBe(false);
    });

    it('should validate callback is a function before calling', () => {
      // Pass invalid callback
      expect(() => {
        render(
          <ColumnMapping
            csvColumns={['col1']}
            onMappingChange={null as any}
          />
        );
      }).not.toThrow();
    });
  });
});
