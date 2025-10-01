import React from 'react';

import './FormFeedback.css';

function FormFeedback({ message = '', errors = {}, touched = false, loading = false }) {



    if (!touched && !message && !loading) return null;

    return (
        <>
            {message && (
                <div className="error">
                    <span role="img" aria-label="error">❌</span> {message}
                </div>
            )}

            {/* Render all errors in the errors object */}
            {touched && Object.entries(errors).map(([key, msg]) => {
                if (!msg) return null;
                // Avoid duplicating 'server' here if you want special styling:
                if (key === 'server') return (
                    <div key={key} className="error server-error">
                        <span role="img" aria-label="error">⚠️</span> {msg}
                    </div>
                );
                return (
                    <div key={key} className="error">
                        <span role="img" aria-label="error">❌</span> {msg}
                    </div>
                );
            })}

            {loading && (
                <div className="loading-spinner">
                    <span className="spinner"></span> Loading...
                </div>
            )}
        </>
    );


}

export default FormFeedback;
