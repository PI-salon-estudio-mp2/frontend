import { useState } from 'react';
import { TextField, type TextFieldProps } from './TextField';

export function PasswordField(props: Omit<TextFieldProps, 'type' | 'adornment'>) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      adornment={
        <button
          type="button"
          aria-controls={props.id}
          onClick={() => setVisible((v) => !v)}
          className="inline-flex min-h-10 items-center rounded-lg px-3 font-bold text-primary-700 hover:bg-primary-50"
        >
          {visible ? 'Ocultar' : 'Mostrar'}
          <span className="sr-only"> contraseña</span>
        </button>
      }
    />
  );
}