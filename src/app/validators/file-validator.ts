import { FormGroup } from '@angular/forms';
import Swal from 'sweetalert2';

/**
 * Validates the file size against a maximum limit.
 * @param file The file to validate.
 * @param maxSizeInMB The maximum file size allowed in megabytes. Defaults to 3MB.
 * @returns An object with `isValid` and an optional `message`.
 */
export function validateFileSize(file: File, maxSizeInMB: number = 3): { isValid: boolean; message: string | null } {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return {
      isValid: false,
      message: `File size must not exceed ${maxSizeInMB}MB. Current size is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`
    };
  }
  return { isValid: true, message: null };
}

/**
 * Handles the file input change event for a reactive form.
 * Validates file size, shows an alert on error, and updates the form control.
 * @param event The file input change event.
 * @param form The FormGroup containing the file control.
 * @param controlName The name of the form control for the file.
 * @param maxSizeInMB The maximum file size allowed in megabytes. Defaults to 3MB.
 */
export function handleFileUpload(
  event: Event,
  form: FormGroup,
  controlName: string,
  maxSizeInMB: number = 3
): void {
  const input = event.target as HTMLInputElement;
  
  if (!input.files || input.files.length === 0) {
    form.get(controlName)?.setValue(null);
    form.get(controlName)?.setErrors(null);
    return;
  }

  const file = input.files[0];
  const validation = validateFileSize(file, maxSizeInMB);

  if (!validation.isValid) {
    Swal.fire({
      icon: 'error',
      title: 'Invalid File Size',
      text: validation.message as string,
    });
    input.value = '';
    form.get(controlName)?.setValue(null);
    form.get(controlName)?.setErrors({ invalidSize: true });
  } else {
    form.get(controlName)?.setValue(file);
    form.get(controlName)?.setErrors(null);
  }
}
