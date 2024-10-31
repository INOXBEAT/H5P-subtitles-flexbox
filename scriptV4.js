
// Identifica el contenedor de video y el elemento <track> dentro del iframe H5P
function identifyVideoAndTrackElements(iframeDocument) {
    const interactiveVideoContainer = iframeDocument.querySelector('.h5p-container.h5p-standalone.h5p-interactive-video');
    const trackElement = iframeDocument.querySelector('track');
    return interactiveVideoContainer && trackElement 
        ? { interactiveVideoContainer, trackElement } 
        : null;
}

// Crea un contenedor principal que se ajuste al ancho del body dentro del iframe
function createMainContainer(iframeDocument) {
    const mainContainer = iframeDocument.createElement('div');
    mainContainer.style.width = '100%';
    mainContainer.style.boxSizing = 'border-box';
    mainContainer.style.padding = '10px';
    mainContainer.id = 'main-flex-container';
    iframeDocument.body.appendChild(mainContainer);
    return mainContainer;
}

// Crea un elemento con estilos base para flexbox
function createFlexSection(width, backgroundColor) {
    const section = document.createElement('div');
    Object.assign(section.style, {
        width: width,
        boxSizing: 'border-box',
        padding: '10px',
        backgroundColor: backgroundColor
    });
    return section;
}

// Crea un flexbox dentro del contenedor principal con secciones A (2/3) y B (1/3)
function createFlexboxSections(mainContainer, iframeDocument) {
    const flexContainer = iframeDocument.createElement('div');
    Object.assign(flexContainer.style, {
        display: 'flex',
        width: '100%'
    });

    const sectionA = createFlexSection('66.67%', '#f0f0f0');
    const sectionB = createFlexSection('33.33%', '#d0d0d0');

    flexContainer.appendChild(sectionA);
    flexContainer.appendChild(sectionB);
    mainContainer.appendChild(flexContainer);

    return { sectionA, sectionB };
}

// Coloca los recursos de video y muestra el contenido del track en las secciones A y B
function placeResourcesInSections(sectionA, sectionB, interactiveVideoContainer, trackElement) {
    sectionA.appendChild(interactiveVideoContainer);

    if (trackElement.src) {
        fetch(trackElement.src)
            .then(response => {
                if (!response.ok) throw new Error("No se pudo cargar el contenido del <track>.");
                return response.text();
            })
            .then(trackContent => {
                const trackContentDiv = document.createElement('div');
                trackContentDiv.textContent = trackContent;
                sectionB.appendChild(trackContentDiv);
            })
            .catch(error => {
                console.warn(error.message);
                const errorMessage = document.createElement('div');
                errorMessage.textContent = "No se pudo mostrar el contenido del <track>.";
                sectionB.appendChild(errorMessage);
            });
    } else {
        const noContentMessage = document.createElement('div');
        noContentMessage.textContent = "El <track> no tiene contenido disponible.";
        sectionB.appendChild(noContentMessage);
    }
}

// Evento DOMContentLoaded y MutationObserver para inicialización del iframe y sus elementos
document.addEventListener('DOMContentLoaded', function () {
    const observer = new MutationObserver(() => {
        const iframe = document.querySelector('iframe');
        if (iframe && iframe.contentDocument && iframe.contentDocument.body) {
            observer.disconnect();

            const iframeDocument = iframe.contentDocument;
            const elements = identifyVideoAndTrackElements(iframeDocument);

            if (elements) {
                console.log("Elementos necesarios encontrados y colocados en las secciones.");
                const mainContainer = createMainContainer(iframeDocument);
                const { sectionA, sectionB } = createFlexboxSections(mainContainer, iframeDocument);
                placeResourcesInSections(sectionA, sectionB, elements.interactiveVideoContainer, elements.trackElement);
            } else {
                console.warn("No se encontraron todos los elementos necesarios. Contenedor no creado.");
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});

