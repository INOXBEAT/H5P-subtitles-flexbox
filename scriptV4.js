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

// Crea un contenedor principal que se ajuste al ancho del body
function createMainContainer() {
    const mainContainer = document.createElement('div');
    mainContainer.style.width = '100%';
    mainContainer.style.boxSizing = 'border-box';
    mainContainer.style.padding = '10px';
    mainContainer.id = 'main-flex-container';
    document.body.appendChild(mainContainer);
    console.log("Contenedor principal creado y ajustado al ancho del body:", mainContainer);
    return mainContainer;
}

// Crea un flexbox dentro del contenedor principal con dos secciones A (2/3) y B (1/3)
function createFlexboxSections(mainContainer) {
    const flexContainer = document.createElement('div');
    flexContainer.style.display = 'flex';
    flexContainer.style.width = '100%';

    const sectionA = document.createElement('div');
    sectionA.style.width = '66.67%';
    sectionA.style.boxSizing = 'border-box';
    sectionA.style.padding = '10px';
    sectionA.style.backgroundColor = '#f0f0f0';

    const sectionB = document.createElement('div');
    sectionB.style.width = '33.33%';
    sectionB.style.boxSizing = 'border-box';
    sectionB.style.padding = '10px';
    sectionB.style.backgroundColor = '#d0d0d0';

    flexContainer.appendChild(sectionA);
    flexContainer.appendChild(sectionB);

    mainContainer.appendChild(flexContainer);

    return { sectionA, sectionB };
}

// Ejecuta ambas funciones para crear el contenedor principal y las secciones A y B en flexbox
document.addEventListener('DOMContentLoaded', function() {
    const mainContainer = createMainContainer();
    const { sectionA, sectionB } = createFlexboxSections(mainContainer);
});

