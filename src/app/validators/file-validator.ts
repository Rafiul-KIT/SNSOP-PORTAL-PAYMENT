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
  maxSizeInMB: number = 25
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

/**
 * Formats bytes into a human-readable string (e.g., 1024 -> 1KB).
 * @param bytes The number of bytes.
 * @param decimals The number of decimal places to include.
 */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Handles the file input change event for multiple files.
 * Validates total cumulative file size and returns a list of valid files.
 * @param event The file input change event.
 * @param existingFiles The array of files already selected in the component.
 * @param maxTotalSizeMB The maximum total size allowed for all files in megabytes. Defaults to 25MB.
 * @returns An object with `validFiles` (an array of File objects) and an optional `error` message.
 */
export function handleMultipleFileUpload(
  event: Event,
  existingFiles: File[],
  maxTotalSizeMB: number = 25
): { validFiles: File[]; error?: string } {
  const input = event.target as HTMLInputElement;
  const newFiles = input.files;

  if (!newFiles || newFiles.length === 0) {
    // If no new files were selected (e.g., user opened and closed dialog), return existing files
    return { validFiles: existingFiles };
  }

  const maxTotalSizeBytes = maxTotalSizeMB * 1024 * 1024;
  let combinedFiles: File[] = [...existingFiles];
  let currentTotalSize = existingFiles.reduce((sum, file) => sum + file.size, 0);

  for (let i = 0; i < newFiles.length; i++) {
    const file = newFiles[i];

    if (currentTotalSize + file.size > maxTotalSizeBytes) {
      const remainingBytes = maxTotalSizeBytes - currentTotalSize;
      const errorMessage = `Cannot add file "${file.name}" (${formatBytes(file.size)}).
        Adding it would exceed the total ${maxTotalSizeMB}MB limit.
        You can add up to ${formatBytes(remainingBytes)} more.`;
      
      // Clear the input value to allow re-selection without issues
      if (input) {
        input.value = '';
      }
      return { validFiles: combinedFiles, error: errorMessage };
    }
    combinedFiles.push(file);
    currentTotalSize += file.size;
  }

  // Clear the input value after successfully adding files
  // This allows the same file(s) to be selected again if needed
  if (input) {
    input.value = '';
  }
  return { validFiles: combinedFiles };
}
