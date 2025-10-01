// confirmDelete.js
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

export function confirmDelete(message = 'Are you sure?') {
    return new Promise((resolve) => {
        confirmAlert({
            title: 'Confirm',
            message,
            buttons: [
                {
                    label: 'Yes',
                    onClick: () => resolve(true),
                },
                {
                    label: 'No',
                    onClick: () => resolve(false),
                },
            ],
            closeOnEscape: true,
            closeOnClickOutside: false,
        });
    });
}
