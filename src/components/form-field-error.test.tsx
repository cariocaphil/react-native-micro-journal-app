import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

import { FormFieldError } from '@/components/form-field-error';

describe('FormFieldError', () => {
  it('renders the message when provided', async () => {
    await render(<FormFieldError message="Enter a journal entry." />);

    expect(screen.getByText('Enter a journal entry.')).toBeTruthy();
  });

  it('renders nothing when the message is undefined', async () => {
    await render(<FormFieldError message={undefined} />);

    expect(screen.queryByText(/.+/)).toBeNull();
  });

  it('renders nothing when the message is an empty string', async () => {
    await render(<FormFieldError message="" />);

    expect(screen.queryByText(/.+/)).toBeNull();
  });
});
