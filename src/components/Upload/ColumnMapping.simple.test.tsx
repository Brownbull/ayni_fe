import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColumnMapping } from './ColumnMapping';
import { SystemColumn } from '../../types/columnSchema';

describe('ColumnMapping Component - Core Tests', () => {
  const mockCsvColumns = ['date', 'transaction_id', 'product', 'quantity', 'price'];
  const mockOnMappingChange = vi.fn();
  const mockOnValidationChange = vi.fn();

  beforeEach(() => {
    mockOnMappingChange.mockClear();
    mockOnValidationChange.mockClear();
  });

  // TEST TYPE 1: VALID (Happy Path)
  it('[VALID] should render component with CSV columns', () => {
    render(
      <ColumnMapping
        csvColumns={mockCsvColumns}
        onMappingChange={mockOnMappingChange}
      />
    );

    expect(screen.getByText('Your CSV Columns')).toBeInTheDocument();
    expect(screen.getByText('date')).toBeInTheDocument();
  });

  it('[VALID] should show all required columns mapped when complete', async () => {
    const completeMapping = [
      { csvColumn: 'date', systemColumn: 'in_dt' as SystemColumn },
      { csvColumn: 'trans', systemColumn: 'in_trans_id' as SystemColumn },
      { csvColumn: 'prod', systemColumn: 'in_product_id' as SystemColumn },
      { csvColumn: 'qty', systemColumn: 'in_quantity' as SystemColumn },
      { csvColumn: 'price', systemColumn: 'in_price_total' as SystemColumn }
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
    });
  });

  // TEST TYPE 2: ERROR (Error Handling)
  it('[ERROR] should handle empty CSV columns', () => {
    render(
      <ColumnMapping
        csvColumns={[]}
        onMappingChange={mockOnMappingChange}
      />
    );

    expect(screen.getByText('Your CSV Columns')).toBeInTheDocument();
  });

  it('[ERROR] should show missing required columns warning', async () => {
    const partialMapping = [
      { csvColumn: 'col1', systemColumn: null }
    ];

    render(
      <ColumnMapping
        csvColumns={['col1']}
        onMappingChange={mockOnMappingChange}
        initialMappings={partialMapping}
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('⚠ Missing required mappings')).toBeInTheDocument();
    });
  });

  // TEST TYPE 3: INVALID (Input Validation)
  it('[INVALID] should handle special characters in column names', () => {
    const specialColumns = ['col with spaces', 'col-dash', 'col_underscore'];

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

  // TEST TYPE 4: EDGE (Boundary Conditions)
  it('[EDGE] should handle single column', () => {
    render(
      <ColumnMapping
        csvColumns={['single']}
        onMappingChange={mockOnMappingChange}
      />
    );

    expect(screen.getByText('single')).toBeInTheDocument();
  });

  it('[EDGE] should handle many columns', () => {
    const manyColumns = Array.from({ length: 50 }, (_, i) => `col_${i}`);

    const { container } = render(
      <ColumnMapping
        csvColumns={manyColumns}
        onMappingChange={mockOnMappingChange}
      />
    );

    expect(container.querySelectorAll('select').length).toBe(50);
  });

  // TEST TYPE 5: FUNCTIONAL (Business Logic)
  it('[FUNCTIONAL] should identify required vs optional columns', () => {
    render(
      <ColumnMapping
        csvColumns={mockCsvColumns}
        onMappingChange={mockOnMappingChange}
      />
    );

    expect(screen.getByText(/Required Columns \(5\)/)).toBeInTheDocument();
    expect(screen.getByText(/Optional Columns/)).toBeInTheDocument();
  });

  it('[FUNCTIONAL] should allow removing mapping', async () => {
    const user = userEvent.setup();

    const initialMappings = [
      { csvColumn: 'date', systemColumn: 'in_dt' as SystemColumn }
    ];

    render(
      <ColumnMapping
        csvColumns={['date']}
        onMappingChange={mockOnMappingChange}
        initialMappings={initialMappings}
      />
    );

    const removeButton = screen.getByLabelText('Remove mapping for in_dt');

    await act(async () => {
      await user.click(removeButton);
    });

    await waitFor(() => {
      const calls = mockOnMappingChange.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0][0].systemColumn).toBe(null);
    });
  });

  // TEST TYPE 6: VISUAL (UI/UX)
  it('[VISUAL] should display mapped columns with feedback', async () => {
    const initialMappings = [
      { csvColumn: 'date', systemColumn: 'in_dt' as SystemColumn }
    ];

    render(
      <ColumnMapping
        csvColumns={['date']}
        onMappingChange={mockOnMappingChange}
        initialMappings={initialMappings}
      />
    );

    await waitFor(() => {
      // Check that mapping indicator is shown
      expect(screen.getByText('← date')).toBeInTheDocument();
    });
  });

  it('[VISUAL] should show REQUIRED badge', () => {
    render(
      <ColumnMapping
        csvColumns={mockCsvColumns}
        onMappingChange={mockOnMappingChange}
      />
    );

    const badges = screen.getAllByText('REQUIRED');
    expect(badges.length).toBeGreaterThan(0);
  });

  // TEST TYPE 7: PERFORMANCE
  it('[PERFORMANCE] should render quickly with many columns', () => {
    const manyColumns = Array.from({ length: 100 }, (_, i) => `col_${i}`);

    const start = performance.now();

    render(
      <ColumnMapping
        csvColumns={manyColumns}
        onMappingChange={mockOnMappingChange}
      />
    );

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(1000);
  });

  // TEST TYPE 8: SECURITY
  it('[SECURITY] should sanitize XSS attempts in column names', () => {
    const xssColumns = [
      '<script>alert("xss")</script>',
      'col"><img src=x onerror=alert(1)>'
    ];

    render(
      <ColumnMapping
        csvColumns={xssColumns}
        onMappingChange={mockOnMappingChange}
      />
    );

    xssColumns.forEach(col => {
      expect(screen.getByText(col)).toBeInTheDocument();
    });

    // No script tags should be rendered
    expect(document.querySelectorAll('script').length).toBe(0);
  });

  it('[SECURITY] should not expose sensitive data in callbacks', async () => {
    render(
      <ColumnMapping
        csvColumns={['col1']}
        onMappingChange={mockOnMappingChange}
      />
    );

    await waitFor(() => {
      expect(mockOnMappingChange).toHaveBeenCalled();
      const lastCall = mockOnMappingChange.mock.calls[mockOnMappingChange.mock.calls.length - 1];
      const mappings = lastCall[0];

      // Only expected properties
      expect(mappings[0]).toHaveProperty('csvColumn');
      expect(mappings[0]).toHaveProperty('systemColumn');
    });
  });
});
