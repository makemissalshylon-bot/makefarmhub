/**
 * FormInput Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../utils';
import { FormInput, FormTextarea, validators } from '../../components/UI/FormInput';

describe('FormInput', () => {
  it('renders with label', () => {
    render(<FormInput label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders required indicator', () => {
    render(<FormInput label="Email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const handleChange = vi.fn();
    render(<FormInput label="Email" onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    
    expect(handleChange).toHaveBeenCalledWith('test@example.com');
  });

  it('shows error message after interaction', () => {
    render(<FormInput label="Email" error="Invalid email" />);
    
    // Error only shows after the field has been touched (blur)
    const input = screen.getByRole('textbox');
    fireEvent.blur(input);
    
    expect(screen.getByText('Invalid email')).toBeInTheDocument();
  });

  it('shows hint text', () => {
    render(<FormInput label="Email" hint="Enter your email address" />);
    expect(screen.getByText('Enter your email address')).toBeInTheDocument();
  });

  it('toggles password visibility', () => {
    const { container } = render(<FormInput label="Password" type="password" />);
    
    const input = container.querySelector('input')!;
    expect(input).toHaveAttribute('type', 'password');
    
    const toggleButton = screen.getByRole('button', { name: /show password/i });
    fireEvent.click(toggleButton);
    
    expect(input).toHaveAttribute('type', 'text');
  });

  it('validates on blur when showValidation is true', async () => {
    const validateFn = vi.fn().mockReturnValue('Invalid');
    render(
      <FormInput 
        label="Email" 
        showValidation 
        onValidate={validateFn}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.blur(input);
    
    await waitFor(() => {
      // onValidate is called on blur with the current internal value
      expect(validateFn).toHaveBeenCalled();
    });
  });
});

describe('FormTextarea', () => {
  it('renders with label', () => {
    render(<FormTextarea label="Description" />);
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('shows character count when showCharCount is true', () => {
    render(<FormTextarea label="Description" showCharCount maxLength={100} value="Hello" />);
    expect(screen.getByText('5 / 100')).toBeInTheDocument();
  });

  it('calls onChange when value changes', () => {
    const handleChange = vi.fn();
    render(<FormTextarea label="Description" onChange={handleChange} />);
    
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Test description' } });
    
    expect(handleChange).toHaveBeenCalledWith('Test description');
  });
});

describe('validators', () => {
  describe('required', () => {
    it('returns error for empty string', () => {
      expect(validators.required('')).toBe('This field is required');
    });

    it('returns undefined for non-empty string', () => {
      expect(validators.required('test')).toBeUndefined();
    });
  });

  describe('email', () => {
    it('returns error for invalid email', () => {
      expect(validators.email('invalid')).toBe('Please enter a valid email address');
    });

    it('returns undefined for valid email', () => {
      expect(validators.email('test@example.com')).toBeUndefined();
    });
  });

  describe('phone', () => {
    it('returns error for invalid phone', () => {
      expect(validators.phone('abc')).toBe('Please enter a valid phone number');
    });

    it('returns undefined for valid phone', () => {
      expect(validators.phone('+263 77 123 4567')).toBeUndefined();
    });
  });

  describe('minLength', () => {
    it('returns error for short string', () => {
      const validate = validators.minLength(5);
      expect(validate('abc')).toBe('Must be at least 5 characters');
    });

    it('returns undefined for long enough string', () => {
      const validate = validators.minLength(5);
      expect(validate('abcdef')).toBeUndefined();
    });
  });

  describe('maxLength', () => {
    it('returns error for long string', () => {
      const validate = validators.maxLength(5);
      expect(validate('abcdefgh')).toBe('Must be no more than 5 characters');
    });

    it('returns undefined for short enough string', () => {
      const validate = validators.maxLength(5);
      expect(validate('abc')).toBeUndefined();
    });
  });

  describe('combine', () => {
    it('returns first error from combined validators', () => {
      const validate = validators.combine(validators.required, validators.email);
      expect(validate('')).toBe('This field is required');
    });

    it('returns undefined when all validators pass', () => {
      const validate = validators.combine(validators.required, validators.email);
      expect(validate('test@example.com')).toBeUndefined();
    });
  });
});
