// utils/alertHelper.ts
import Swal from 'sweetalert2';

export const showAlert = (
    title: string, 
    text: string, 
    icon: 'success' | 'error' | 'warning' | 'info' | 'question' = 'info'
) => {
    return Swal.fire({
        title,
        text,
        icon,
        confirmButtonText: 'OK',
        confirmButtonColor: '#0f692b',
    });
};

export const showConfirm = (
    title: string, 
    text: string, 
    confirmText: string = 'Ja', 
    cancelText: string = 'Abbrechen'
) => {
    return Swal.fire({
        title,
        text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        confirmButtonColor: '#0f692b',
        cancelButtonColor: '#6b7280',
    });
};

export const showSuccess = (text: string) => {
    return Swal.fire({
        title: 'Erfolg!',
        text,
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#0f692b',
    });
};

export const showError = (text: string) => {
    return Swal.fire({
        title: 'Fehler',
        text,
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#d33',
    });
};

// Für spezifische Nachrichten
export const bookingSuccess = (isRecurring: boolean = false) => {
    return showSuccess(
        isRecurring 
        ? 'Wiederkehrende Buchung erfolgreich erstellt!' 
        : 'Buchung erfolgreich!'
    );
};