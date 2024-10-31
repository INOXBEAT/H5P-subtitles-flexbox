// Identifica el contenedor de video y el elemento <track> dentro del iframe H5P
function identifyVideoAndTrackElements() {
    const iframe = document.querySelector('iframe');

    if (iframe && iframe.contentDocument) {
        const h5pDocument = iframe.contentDocument;
        const interactiveVideoContainer = h5pDocument.querySelector('.h5p-container.h5p-standalone.h5p-interactive-video');
        const trackElement = h5pDocument.querySelector('track');

        if (interactiveVideoContainer && trackElement) {
            console.log("Contenedor de video:", interactiveVideoContainer);
            console.log("Elemento <track>:", trackElement);
            return { interactiveVideoContainer, trackElement };
        } else {
            console.log("No se encontraron todos los elementos necesarios.");
            return null;
        }
    } else {
        return null;
    }
}

// Evento DOMContentLoaded para iniciar la identificación de elementos dentro del iframe H5P
document.addEventListener('DOMContentLoaded', function() {

    let attempts = 0;
    const maxAttempts = 10;
    
    const intervalId = setInterval(() => {
        const iframe = document.querySelector('iframe');
        attempts++;
        
        if (iframe && iframe.contentDocument) {
            const elements = identifyVideoAndTrackElements();
            clearInterval(intervalId);
            if (elements) {
                const { interactiveVideoContainer, trackElement } = elements;
            }
        }

        if (attempts >= maxAttempts) {
            console.warn("No se pudo encontrar el iframe o los elementos requeridos tras múltiples intentos.");
            clearInterval(intervalId);
        }
    }, 1000);
});
